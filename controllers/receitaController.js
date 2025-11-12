const Receita = require('../models/Receita');
const Usuario = require('../models/Usuario');
const { GoogleGenAI } = require('@google/genai'); // Usando o SDK do seu modelo

// [REMOVIDO] O axios para o Edamam não é mais necessário
// const axios = require('axios'); 

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY); // Usando a sintaxe do seu modelo

// 1. VISUALIZAR RECEITAS (GET /api/receitas)
exports.getReceitas = async (req, res) => {
    try {
        const receitas = await Receita.find({ usuario: req.usuario.id }).sort({ createdAt: -1 });
        res.json(receitas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 2. VISUALIZAR UMA (GET /api/receitas/:id)
exports.getReceitaById = async (req, res) => {
    try {
        const receita = await Receita.findById(req.params.id);
        if (!receita) return res.status(404).json({ msg: 'Receita não encontrada' });

        if (receita.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }
        res.json(receita);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 3. CRIAR RECEITA (POST /api/receitas)
exports.createReceita = async (req, res) => {
    const { nome, descricao, ingredientes, modoPreparo, macros } = req.body;

    if (!nome || !ingredientes || ingredientes.length === 0 || !macros) {
        return res.status(400).json({ msg: 'Nome, Macros e ao menos um Ingrediente são obrigatórios.' });
    }
    if (macros.calorias < 0 || macros.proteinas < 0 || macros.carboidratos < 0 || macros.gorduras < 0) {
         return res.status(400).json({ msg: 'Valores nutricionais não podem ser negativos.' });
    }

    try {
        const novaReceita = new Receita({
            usuario: req.usuario.id,
            nome,
            descricao,
            ingredientes,
            modoPreparo,
            macros
        });

        const receita = await novaReceita.save();
        res.status(201).json(receita);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 4. EDITAR RECEITA (PUT /api/receitas/:id)
exports.updateReceita = async (req, res) => {
    // [MELHORIA] Adicionando validação também no update
    const { nome, ingredientes, macros } = req.body;
    
    if (nome !== undefined && nome.trim() === '') {
         return res.status(400).json({ msg: 'Nome não pode ser vazio.' });
    }
    if (ingredientes !== undefined && ingredientes.length === 0) {
         return res.status(400).json({ msg: 'A lista de ingredientes não pode estar vazia.' });
    }
    if (macros && (macros.calorias < 0 || macros.proteinas < 0 || macros.carboidratos < 0 || macros.gorduras < 0)) {
         return res.status(400).json({ msg: 'Valores nutricionais não podem ser negativos.' });
    }
    
    try {
        let receita = await Receita.findById(req.params.id);
        if (!receita) return res.status(404).json({ msg: 'Receita não encontrada' });

        if (receita.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        receita = await Receita.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },  
            { new: true }        
        );
        res.json(receita);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};

// 5. EXCLUIR RECEITA (DELETE /api/receitas/:id)
exports.deleteReceita = async (req, res) => {
    try {
        let receita = await Receita.findById(req.params.id);
        if (!receita) return res.status(404).json({ msg: 'Receita não encontrada' });

        if (receita.usuario.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        await Receita.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Receita removida com sucesso.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
};


// 6. [MODELADO] SUGERIR RECEITAS (Gemini)
// (Usando a sintaxe do chatAI.js)
exports.sugerirReceitas = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }

        const { principal } = usuario.objetivos;
        const { idade, sexo } = usuario.dados_biometricos;
        const sexoTexto = sexo === 'M' ? 'Masculino' : 'Feminino';
        const perfilUsado = `Sugestões para (Objetivo: ${principal} | Idade: ${idade} | Sexo: ${sexoTexto})`;

        const prompt = `
            Por favor, aja como um nutricionista do app FitOS.
            Eu preciso que você gere 4 sugestões de receitas para um usuário com o seguinte perfil:
            - Objetivo Principal: ${principal}
            - Idade: ${idade}
            - Sexo: ${sexoTexto}
            Gere OBRIGATORIAMENTE 4 receitas: Café da Manhã, Almoço, Lanche da Tarde, Jantar.
            Sua resposta deve ser APENAS um array JSON, sem nenhum outro texto, markdown ou formatação.
            O JSON deve seguir exatamente esta estrutura (certifique-se de incluir 4 itens e que a 'quantidade' seja um NÚMERO):
            [
              {
                "nome": "Café da Manhã: Nome da Receita",
                "descricao": "Uma descrição curta e atrativa.",
                "ingredientes": [{"nome": "Ingrediente 1", "quantidade": 100, "unidade": "g"}],
                "modoPreparo": "1. Faça isso. 2. Faça aquilo.",
                "macros": {"calorias": 0, "proteinas": 0, "carboidratos": 0, "gorduras": 0}
              },
              { "nome": "Almoço: ...", "descricao": "...", "ingredientes": [], "modoPreparo": "...", "macros": {} },
              { "nome": "Lanche da Tarde: ...", "descricao": "...", "ingredientes": [], "modoPreparo": "...", "macros": {} },
              { "nome": "Jantar: ...", "descricao": "...", "ingredientes": [], "modoPreparo": "...", "macros": {} }
            ]
        `;
        
        // Sintaxe do chatAI.js
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", // O modelo que você especificou
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        // Sintaxe do chatAI.js
        const text = response.text;
        
        const cleanedText = text.replace(/```json\n|```/g, '').trim();
        const receitasSugeridas = JSON.parse(cleanedText);
        
        res.json({
            perfilUsado: perfilUsado,
            receitas: receitasSugeridas
        });

    } catch (error) {
        console.error("Erro na API do Gemini ao sugerir receitas:", error);
        res.status(503).json({ msg: "O assistente de IA (Gemini) está temporariamente fora do ar." });
    }
};

// 7. [MODELADO] CALCULAR MACROS (Usando APENAS Gemini)
// (Usando a sintaxe do chatAI.js)
exports.calcularMacros = async (req, res) => {
    const { ingredientes } = req.body; 

    if (!ingredientes || ingredientes.length === 0) {
        return res.status(400).json({ msg: "A lista de ingredientes não pode estar vazia." });
    }

    try {
        const ingredientesFormatados = ingredientes.map(ing => {
            return `${ing.quantidade} ${ing.unidade} ${ing.nome}`;
        }).join(', ');

        const promptCalculo = `
            Calcule os macronutrientes totais (calorias, proteinas, carboidratos, gorduras) para a seguinte lista de ingredientes:
            ${ingredientesFormatados}
            
            Retorne APENAS um objeto JSON, sem nenhum outro texto, markdown ou formatação.
            O JSON deve seguir exatamente esta estrutura:
            {
              "calorias": 0,
              "proteinas": 0,
              "carboidratos": 0,
              "gorduras": 0
            }
            (Use números inteiros ou com uma casa decimal para os valores)
        `;
        
        // Sintaxe do chatAI.js
        const geminiResponse = await genAI.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ role: "user", parts: [{ text: promptCalculo }] }],
        });
        
        // Sintaxe do chatAI.js
        const text = geminiResponse.text;
        const cleanedText = text.replace(/```json\n|```/g, '').trim();
        const macros = JSON.parse(cleanedText);

        res.json(macros);

    } catch (error)
    {
        console.error("Erro na API ao calcular macros:", error.response ? error.response.data : error.message);
        res.status(503).json({ msg: "O serviço de cálculo de macros (IA) está indisponível." });
    }
};