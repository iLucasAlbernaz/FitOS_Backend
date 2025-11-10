const Receita = require('../models/Receita');
const Usuario = require('../models/Usuario'); 
// [CORREÇÃO 1] Importa a biblioteca correta
const { GoogleGenAI } = require('@google/genai'); 

// [CORREÇÃO 2] Usa o construtor correto
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

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


// 6. [MODIFICADO] SUGERIR RECEITAS (IA)
// GET /api/receitas/sugeridas
exports.sugerirReceitas = async (req, res) => {
    try {
        // 1. Buscar o perfil do usuário
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }

        const { principal } = usuario.objetivos;
        const { idade, sexo } = usuario.dados_biometricos;

        // 2. Criar o prompt para a IA
        const prompt = `
            Por favor, aja como um nutricionista do app FitOS.
            Eu preciso que você gere 3 sugestões de receitas para um usuário com o seguinte perfil:
            - Objetivo Principal: ${principal}
            - Idade: ${idade}
            - Sexo: ${sexo === 'M' ? 'Masculino' : 'Feminino'}

            As receitas devem ser saudáveis e alinhadas com o objetivo.

            Sua resposta deve ser APENAS um array JSON, sem nenhum outro texto, markdown ou formatação.
            O JSON deve seguir exatamente esta estrutura:
            [
              {
                "nome": "Nome da Receita 1",
                "descricao": "Uma descrição curta e atrativa.",
                "ingredientes": [
                  {"nome": "Ingrediente 1", "quantidade": "Ex: 100g"},
                  {"nome": "Ingrediente 2", "quantidade": "Ex: 2 unidades"}
                ],
                "modoPreparo": "1. Faça isso. 2. Faça aquilo.",
                "macros": {"calorias": 0, "proteinas": 0, "carboidratos": 0, "gorduras": 0}
              },
              {
                "nome": "Nome da Receita 2",
                "descricao": "...",
                "ingredientes": [...],
                "modoPreparo": "...",
                "macros": {...}
              },
              {
                "nome": "Nome da Receita 3",
                "descricao": "...",
                "ingredientes": [...],
                "modoPreparo": "...",
                "macros": {...}
              }
            ]
        `;

        // 3. [CORREÇÃO] Chamar a API do Gemini com a SINTAXE NOVA
        const response = await genAI.models.generateContent({
            model: "gemini-1.5-flash-latest", 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = response.text; // [CORREÇÃO] .text (propriedade)
        
        // 4. Limpar e enviar a resposta JSON
        const cleanedText = text.replace(/```json\n|```/g, '').trim();
        
        const receitasSugeridas = JSON.parse(cleanedText);
        res.json(receitasSugeridas);

    } catch (error) {
        console.error("Erro na API do Gemini ao sugerir receitas:", error);
        res.status(503).json({ msg: "O assistente de IA está temporariamente fora do ar. Tente novamente mais tarde." });
    }
};