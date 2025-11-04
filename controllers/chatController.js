// [MODIFICADO] Importa a NOVA biblioteca
const { GoogleGenerativeAI } = require('@google/genai');
const Chat = require('../models/Chat'); 

// Inicializa o GenAI com a chave do seu .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        // 2. Prepara e envia o prompt para a IA (usando a NOVA sintaxe)
        
        // [MODIFICADO] Usa o modelo recomendado pelo AI Studio
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

        const prompt = `
            Você é o assistente de IA do app "FitOS".
            Sua especialidade é nutrição, fitness e saúde.
            Responda de forma clara, motivadora e direta (no máximo 3 frases).
            Não use markdown ou formatação especial.
            
            Pergunta do usuário: "${pergunta}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

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