// routes/treinoRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const treinoController = require('../controllers/treinoController');

// Rota antiga para gerar ABC (pode manter ou remover)
router.post('/gerar-abc', auth, treinoController.gerarTreinosABC);

// [NOVO] Rota para sugestão da IA
router.post('/sugerir', auth, treinoController.sugerirTreino);

// Rotas CRUD
router.get('/', auth, treinoController.getTreinos);
router.post('/', auth, treinoController.createTreino); // O "Salvar Sugestão" usará esta rota
router.get('/:id', auth, treinoController.getTreinoById);
router.put('/:id', auth, treinoController.updateTreino);
router.delete('/:id', auth, treinoController.deleteTreino);

module.exports = router;