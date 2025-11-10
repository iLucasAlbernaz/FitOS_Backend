const Receita = require('../models/Receita');
const Usuario = require('../models/Usuario'); 
const { GoogleGenAI } = require('@google/genai'); 
const axios = require('axios'); 

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// --- (As funções 1 a 5: getReceitas, getReceitaById, createReceita, updateReceita, deleteReceita NÃO MUDAM) ---
// (Você pode manter as suas, elas estão corretas)
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


// 6. [MODIFICADO] SUGERIR RECEITAS (Gemini)
// Usa a sintaxe 100% correta do seu chatController
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
        
        // [CORREÇÃO] Usa a sintaxe do seu chatController (que funciona)
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", // Nome do modelo que você enviou
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        // [CORREÇÃO] Usa a sintaxe do seu chatController (que funciona)
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

// 7. [MODIFICADO] CALCULAR MACROS (Gemini + Edamam)
exports.calcularMacros = async (req, res) => {
    const { ingredientes } = req.body; 

    if (!ingredientes || ingredientes.length === 0) {
        return res.status(400).json({ msg: "A lista de ingredientes não pode estar vazia." });
    }

    try {
        // --- ETAPA 1: Traduzir os ingredientes com o Gemini ---
        const nomesIngredientes = ingredientes.map(ing => ing.nome).join(', '); 
        
        const promptTraducao = `
            Traduza a seguinte lista de ingredientes para o inglês. 
            Retorne APENAS os nomes em inglês, separados por vírgula, sem formatação.
            Lista: "${nomesIngredientes}"
        `;
        
        // [CORREÇÃO] Usa a sintaxe do seu chatController (que funciona)
        const geminiResponse = await genAI.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ role: "user", parts: [{ text: promptTraducao }] }],
        });
        
        // [CORREÇÃO] Usa a sintaxe do seu chatController (que funciona)
        const nomesEmInglesTexto = geminiResponse.text;
        const nomesEmIngles = nomesEmInglesTexto.split(',').map(item => item.trim());

        if (nomesEmIngles.length !== ingredientes.length) {
            throw new Error('Falha na tradução dos ingredientes pela IA.');
        }

        // --- ETAPA 2: Formatar para o Edamam ---
        const ingredientesFormatados = ingredientes.map((ing, index) => {
            return `${ing.quantidade} ${ing.unidade} ${nomesEmIngles[index]}`;
        });

        // --- ETAPA 3: Chamar o Edamam ---
        const edamamResponse = await axios.post(
            `https://api.edamam.com/api/nutrition-details?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}`,
            { ingr: ingredientesFormatados } 
        );

        const data = edamamResponse.data;
        
        const nutrients = data.totalNutrients; 
        
        if (data.error === 'low_quality' || !nutrients) {
             return res.status(400).json({ msg: "Cálculo falhou. Verifique os ingredientes (ex: '100g frango' ou '2 ovos grandes')." });
        }

        const macros = {
            calorias: data.calories || 0,
            proteinas: nutrients.PROCNT ? nutrients.PROCNT.quantity.toFixed(1) : 0,
            carboidratos: nutrients.CHOCDF ? nutrients.CHOCDF.quantity.toFixed(1) : 0,
            gorduras: nutrients.FAT ? nutrients.FAT.quantity.toFixed(1) : 0
        };

        if (macros.calorias === 0 && macros.proteinas === 0) {
            return res.status(400).json({ msg: "Cálculo falhou. A API não conseguiu analisar esses ingredientes." });
        }

        res.json(macros);

    } catch (error) {
        console.error("Erro na API do Edamam/Gemini:", error.response ? error.response.data : error.message);
        if(error.response && (error.response.status === 555 || error.response.status === 400)) {
            return res.status(400).json({ msg: "Não foi possível calcular. Verifique os ingredientes." });
        }
        res.status(503).json({ msg: "O serviço de cálculo de macros está indisponível." });
    }
};