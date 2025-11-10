const Receita = require('../models/Receita');
const Usuario = require('../models/Usuario'); 
const { GoogleGenAI } = require('@google/genai'); 
const axios = require('axios'); // Para Edamam

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


// 6. [EXISTENTE] SUGERIR RECEITAS (Gemini)
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
            O JSON deve seguir exatamente esta estrutura (certifique-se de incluir 4 itens):
            [
              {
                "nome": "Café da Manhã: Nome da Receita",
                "descricao": "Uma descrição curta e atrativa.",
                "ingredientes": [{"nome": "Ingrediente 1", "quantidade": "Ex: 100g"}],
                "modoPreparo": "1. Faça isso. 2. Faça aquilo.",
                "macros": {"calorias": 0, "proteinas": 0, "carboidratos": 0, "gorduras": 0}
              },
              { "nome": "Almoço: ...", ... },
              { "nome": "Lanche da Tarde: ...", ... },
              { "nome": "Jantar: ...", ... }
            ]
        `;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = response.text;
        
        const cleanedText = text.replace(/```json\n|```/g, '').trim();
        const receitasSugeridas = JSON.parse(cleanedText);
        
        res.json({
            perfilUsado: perfilUsado,
            receitas: receitasSugeridas
        });

    } catch (error) {
        console.error("Erro na API do Gemini ao sugerir receitas:", error);
        res.status(503).json({ msg: "O assistente de IA está temporariamente fora do ar." });
    }
};

// 7. [NOVO] CALCULAR MACROS (Edamam)
// POST /api/receitas/calcular-macros
exports.calcularMacros = async (req, res) => {
    const { ingredientes } = req.body; // Espera um array de strings, ex: ["2 ovos", "1 banana"]

    if (!ingredientes || ingredientes.length === 0) {
        return res.status(400).json({ msg: "A lista de ingredientes não pode estar vazia." });
    }

    try {
        const response = await axios.post(
            `https://api.edamam.com/api/nutrition-details?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}`,
            { ingr: ingredientes } 
        );

        const data = response.data;
        
        const macros = {
            calorias: data.calories || 0,
            proteinas: data.totalNutrients.PROCNT ? data.totalNutrients.PROCNT.quantity.toFixed(1) : 0,
            carboidratos: data.totalNutrients.CHOCDF ? data.totalNutrients.CHOCDF.quantity.toFixed(1) : 0,
            gorduras: data.totalNutrients.FAT ? data.totalNutrients.FAT.quantity.toFixed(1) : 0
        };

        res.json(macros);

    } catch (error) {
        console.error("Erro na API do Edamam:", error.response ? error.response.data : error.message);
        if(error.response && error.response.status === 555) {
            return res.status(400).json({ msg: "Não foi possível calcular. Verifique os ingredientes (ex: '100g frango')." });
        }
        res.status(503).json({ msg: "O serviço de cálculo de macros está indisponível." });
    }
};