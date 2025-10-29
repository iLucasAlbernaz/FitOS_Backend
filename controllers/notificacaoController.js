const Notificacao = require('../models/Notificacao');

// [POST] Simulação do Sistema Criando Notificação (Ex: Meta de água batida)
exports.criarNotificacaoSistema = async (req, res) => {
    try {
        const novaNotificacao = new Notificacao({
            usuario_id: req.usuario.id, // Pega ID do token
            tipo: req.body.tipo || 'Sistema', 
            mensagem: req.body.mensagem,
            status: 'Não Lida'
        });

        await novaNotificacao.save();

        res.status(201).json({ 
            mensagem: "Notificação criada (simulação de sistema)!", 
            notificacao: novaNotificacao 
        });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno ao criar notificação." });
    }
};

// [GET] Buscar todas as notificações do usuário logado
exports.buscarNotificacoes = async (req, res) => {
    try {
        const notificacoes = await Notificacao.find({ usuario_id: req.usuario.id })
            .sort({ createdAt: -1 });

        res.status(200).json(notificacoes);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno ao buscar notificações." });
    }
};

// [DELETE] Deletar uma notificação específica
exports.deletarNotificacao = async (req, res) => {
    try {
        const { id } = req.params;

        const notificacao = await Notificacao.findOneAndDelete({ 
            _id: id, 
            usuario_id: req.usuario.id // Garante que só o dono possa deletar
        });

        if (!notificacao) {
            return res.status(404).json({ mensagem: "Notificação não encontrada ou não pertence a você." });
        }

        res.status(200).json({ mensagem: "Notificação excluída com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro interno ao deletar notificação." });
    }
};