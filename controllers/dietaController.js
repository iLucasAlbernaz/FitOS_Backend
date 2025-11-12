const Dieta = require('../models/Dieta');
const Usuario = require('../models/Usuario');
const { GoogleGenAI } = require('@google/genai'); // Usa a biblioteca correta

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// --- ROTA: Gerar Plano de Dieta (IA Profissional Gemini) ---
exports.gerarPlanoDietaIA = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        // 1. Buscar o perfil do usuário
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }
        
        const { principal } = usuario.objetivos;
        const { idade, sexo, altura_cm, peso_atual_kg } = usuario.dados_biometricos;
        const sexoTexto = sexo === 'M' ? 'Masculino' : 'Feminino';

        // 2. Criar o prompt para a IA (Pedindo o plano completo)
        const prompt = `
            Por favor, aja como um nutricionista sênior do app FitOS.
            Eu preciso que você gere um plano alimentar completo EM PORTUGUÊS para um usuário com o seguinte perfil:
            - Objetivo Principal: ${principal} (Ex: Perda de Peso, Ganho de Massa)
            - Idade: ${idade}
            - Sexo: ${sexoTexto}
            - Altura: ${altura_cm} m
            - Peso Atual: ${peso_atual_kg} kg

            O plano deve ser saudável e 100% alinhado com o objetivo do usuário.
            Sua resposta deve ser APENAS um objeto JSON, sem nenhum outro texto, markdown ou formatação.
            O JSON deve seguir EXATAMENTE esta estrutura (incluindo 4 refeições e totais):

            {
              "nomePlano": "IA: ${principal}",
              "explicacao": "Uma explicação curta (2-3 frases) do motivo pelo qual este plano (calorias, macros) foi escolhido para o objetivo do usuário.",
              "cafeDaManha": {
                "alimentos": [
                  {"nome": "Ovo Cozido", "porcao": "2 unidades", "calorias": 140, "proteinas": 12, "carboidratos": 1, "gorduras": 10},
                  {"nome": "Mamão Papaia", "porcao": "1/2 unidade", "calorias": 60, "proteinas": 1, "carboidratos": 15, "gorduras": 0}
                ],
                "modoPreparo": "Cozinhe os ovos por 8 minutos. Sirva com o mamão.",
                "totais": {"calorias": 200, "proteinas": 13, "carboidratos": 16, "gorduras": 10}
              },
              "almoco": {
                "alimentos": [
                  {"nome": "Filé de Frango", "porcao": "120g", "calorias": 180, "proteinas": 35, "carboidratos": 0, "gorduras": 3},
                  {"nome": "Arroz Integral", "porcao": "1 xícara", "calorias": 215, "proteinas": 5, "carboidratos": 45, "gorduras": 2}
                ],
                "modoPreparo": "Grelhe o frango. Sirva com o arroz e salada.",
                "totais": {"calorias": 395, "proteinas": 40, "carboidratos": 45, "gorduras": 5}
              },
              "lanche": {
                "alimentos": [
                  {"nome": "Iogurte Natural", "porcao": "1 pote", "calorias": 100, "proteinas": 10, "carboidratos": 15, "gorduras": 0}
                ],
                "modoPreparo": "Pode adicionar frutas se desejar.",
                "totais": {"calorias": 100, "proteinas": 10, "carboidratos": 15, "gorduras": 0}
              },
              "jantar": {
                "alimentos": [
                  {"nome": "Salmão Grelhado", "porcao": "100g", "calorias": 200, "proteinas": 22, "carboidratos": 0, "gorduras": 12}
                ],
                "modoPreparo": "Grelhe o salmão com temperos.",
                "totais": {"calorias": 200, "proteinas": 22, "carboidratos": 0, "gorduras": 12}
              },
              "totais": {
                "calorias": 895,
                "proteinas": 85,
                "carboidratos": 61,
                "gorduras": 27
              }
            }
        `;
        
        // 3. [CORREÇÃO] Chamar a API do Gemini (Usando a sintaxe que funciona)
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        // 4. [CORREÇÃO] Ler a resposta (Usando a sintaxe que funciona)
        const text = response.text;
        const cleanedText = text.replace(/```json\n|```/g, '').trim();
        const planoJSON = JSON.parse(cleanedText);

        // 5. Salvar o novo plano
        await Dieta.findOneAndDelete({ usuario: usuarioId });
        
        const novoPlano = new Dieta({
            usuario: usuarioId,
            nomePlano: planoJSON.nomePlano,
            explicacao: planoJSON.explicacao, 
            isAtivo: true, 
            cafeDaManha: planoJSON.cafeDaManha,
            almoco: planoJSON.almoco,
            lanche: planoJSON.lanche,
            jantar: planoJSON.jantar,
            totais: planoJSON.totais
        });

        await novoPlano.save();
        res.status(201).json(novoPlano);

    } catch (error) {
        console.error("Erro na API do Gemini (Plano de Dieta):", error);
        res.status(503).json({ msg: 'O serviço de planos de dieta (IA) está indisponível. Tente novamente mais tarde.' });
    }
};

// --- ROTA: Buscar Plano ATIVO ---
exports.getPlanoAtivo = async (req, res) => {
    try {
        const dieta = await Dieta.findOne({ usuario: req.usuario.id, isAtivo: true });
        if (!dieta) {
            return res.status(404).json({ msg: 'Nenhum plano de dieta ativo no momento.' });
        }
        res.json(dieta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao carregar o plano de dieta.');
    }
};

// --- [NOVO] ROTA: Buscar Planos SALVOS ---
exports.getPlanosSalvos = async (req, res) => {
    try {
        const planos = await Dieta.find({ usuario: req.usuario.id, isAtivo: false })
                                .sort({ createdAt: -1 })
                                .select('nomePlano createdAt'); 
        res.json(planos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao carregar planos salvos.');
    }
};

// --- [NOVO] ROTA: Definir um plano salvo como ATIVO ---
exports.setPlanoAtivo = async (req, res) => {
    const usuarioId = req.usuario.id;
    const planoId = req.params.id;

    try {
        // Desativa todos os outros planos
        await Dieta.updateMany(
            { usuario: usuarioId },
            { $set: { isAtivo: false } }
        );
        
        // Ativa o plano escolhido
        const planoAtivado = await Dieta.findOneAndUpdate(
            { _id: planoId, usuario: usuarioId },
            { $set: { isAtivo: true } },
            { new: true } 
        );

        if (!planoAtivado) {
            return res.status(404).json({ msg: "Plano não encontrado ou não pertence a você." });
        }
        
        res.json(planoAtivado);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao ativar o plano.');
    }
};