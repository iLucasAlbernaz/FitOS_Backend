// [CORREÇÃO 1] Importa da biblioteca correta '@google/genai'
const { GoogleGenAI } = require('@google/genai'); 
const Chat = require('../models/Chat'); 

// [CORREÇÃO 2] Usa o construtor correto 'GoogleGenAI'
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

/**
 * @route   POST /api/chat
 * @desc    Recebe uma pergunta, salva, e retorna a resposta da IA
 */
exports.handleChat = async (req, res) => {
    const { pergunta } = req.body;

    if (!pergunta) {
        return res.status(400).json({ mensagem: 'Pergunta não pode estar vazia.' });
    }

    try {
        // 1. Salva a pergunta do usuário no histórico
        const perguntaUsuario = new Chat({
            usuario: req.usuario.id,
            role: 'user',
            content: pergunta
        });
        await perguntaUsuario.save();

        // 2. [CORREÇÃO] Prepara e envia o prompt para a IA (usando a NOVA SINTAXE)
        
        // [CORREÇÃO 3] Usa a sintaxe correta (getGenerativeModel) e o nome do modelo
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); 

        // Define o "contexto" ou "personalidade" do bot
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Você é o assistente de IA do app 'FitOS'. Sua especialidade é nutrição, fitness e saúde. Responda de forma clara, motivadora e direta (no máximo 3 frases). Não use markdown ou formatação especial." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Entendido. Eu sou o FitOS. Estou pronto para ajudar com dúvidas de fitness e nutrição." }],
                }
            ]
        });

        // [CORREÇÃO 4] Usa a sintaxe correta (sendMessage)
        const result = await chat.sendMessage(pergunta);
        const response = await result.response;
        const text = response.text();
        // --- Fim da Correção ---

        // 3. Salva a resposta da IA no histórico
        const respostaIA = new Chat({
            usuario: req.usuario.id,
            role: 'model',
            content: text
        });
        await respostaIA.save();

        // 4. Retorna a resposta da IA para o frontend
        res.json({ resposta: text });

    } catch (error) {
        // (FE3.1) Lida com erros da API da IA
        console.error("Erro na API do Gemini:", error);
        res.status(503).json({ mensagem: "O chatbot está temporariamente fora do ar. Tente novamente mais tarde." });
    }
};

/**
 * @route   GET /api/chat/historico
 * @desc    Busca o histórico de chat do usuário logado
 */
exports.getHistorico = async (req, res) => {
    try {
        const historico = await Chat.find({ usuario: req.usuario.id })
                                    .sort({ createdAt: 1 }); // Ordena do mais antigo para o mais novo

        res.json(historico);

    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        res.status(500).send('Erro interno do servidor.');
    }
};