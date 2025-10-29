const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Rota POST para enviar perguntas ao chatbot (não precisa de Token)
router.post('/', chatController.responderChat);

module.exports = router;