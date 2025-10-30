const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware de autenticação
const chatController = require('../controllers/chatController');

// @route   POST /api/chat
// @desc    Enviar pergunta para o chat
router.post('/', auth, chatController.handleChat);

// @route   GET /api/chat/historico
// @desc    Buscar histórico do chat
router.get('/historico', auth, chatController.getHistorico);

module.exports = router;