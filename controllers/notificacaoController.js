const Notificacao = require('../models/Notificacao');

/**
 * Helper para criar e salvar uma nova notificação (Usado por outros controllers)
 */
exports.sendNotification = async (userId, tipo, mensagem) => {
    try {
        const novaNotificacao = new Notificacao({
            usuario: userId,
            tipo: tipo,
            mensagem: mensagem,
            lida: false
        });
        await novaNotificacao.save();
    } catch (error) {
        console.error("Erro ao criar notificação:", error.message);
    }
};

/**
 * @route   GET /api/notificacoes
 * @desc    Busca as 10 últimas notificações do usuário logado
 */
exports.getNotificacoes = async (req, res) => {
    try {
        // [CORRIGIDO] Usa req.usuario.id (assumindo que o middleware é 'auth')
        const userId = req.usuario.id; 
        
        const notificacoes = await Notificacao.find({ usuario: userId })
                                              .sort({ createdAt: -1 })
                                              .limit(10); 

        const naoLidasCount = await Notificacao.countDocuments({ 
            usuario: userId, 
            lida: false 
        });

        res.json({
            notificacoes,
            naoLidasCount
        });

    } catch (error) {
        console.error("Erro ao buscar notificações:", error.message);
        res.status(500).send('Erro no Servidor');
    }
};

/**
 * @route   PUT /api/notificacoes/marcar-lida/:id
 * @desc    Marca uma notificação específica como lida
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.usuario.id; // [CORRIGIDO]
        let notificacao = await Notificacao.findById(req.params.id);

        if (!notificacao) {
            return res.status(404).json({ msg: 'Notificação não encontrada' });
        }
        
        if (notificacao.usuario.toString() !== userId) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        notificacao.lida = true;
        await notificacao.save();
        
        const naoLidasCount = await Notificacao.countDocuments({ 
            usuario: userId, 
            lida: false 
        });

        res.json({ msg: 'Notificação marcada como lida.', naoLidasCount });

    } catch (error) {
        console.error("Erro ao marcar como lida:", error.message);
        res.status(500).send('Erro no Servidor');
    }
};