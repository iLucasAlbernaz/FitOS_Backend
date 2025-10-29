    const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');
const authMiddleware = require('../middleware/auth'); 

// Rotas Protegidas (POST/GET/DELETE)
router.post('/', authMiddleware, notificacaoController.criarNotificacaoSistema);
router.get('/', authMiddleware, notificacaoController.buscarNotificacoes);
router.delete('/:id', authMiddleware, notificacaoController.deletarNotificacao);

module.exports = router;