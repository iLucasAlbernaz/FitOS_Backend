const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificacaoController = require('../controllers/notificacaoController');

// @route   GET /api/notificacoes
// @desc    Busca todas as notificações do usuário
router.get('/', auth, notificacaoController.getNotificacoes);

// @route   PUT /api/notificacoes/marcar-lida/:id
// @desc    Marca uma notificação como lida
router.put('/marcar-lida/:id', auth, notificacaoController.markAsRead);

module.exports = router;