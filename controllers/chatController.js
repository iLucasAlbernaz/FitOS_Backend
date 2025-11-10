const { GoogleGenAI } = require('@google/genai'); 
const Chat = require('../models/Chat'); 
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

        // 2. Prepara e envia o prompt para a IA
        const prompt = `
            Você é o assistente de IA do app "FitOS".
            Sua especialidade é nutrição, fitness e saúde.
            Responda de forma clara, motivadora e direta (no máximo 3 frases).
            Não use markdown ou formatação especial.
            
            Pergunta do usuário: "${pergunta}"
        `;
        
        // 3. Usa a sintaxe que funciona
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", // O modelo que você especificou
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        // 4. Usa a sintaxe que funciona
        const text = response.text;

        const respostaIA = new Chat({
            usuario: req.usuario.id,
            role: 'model',
            content: text
        });
        await respostaIA.save();

        res.json({ resposta: text });

    } catch (error) {
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
                                    .sort({ createdAt: 1 });

        res.json(historico);

    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        res.status(500).send('Erro interno do servidor.');
    }
};