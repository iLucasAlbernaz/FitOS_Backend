const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const treinoController = require('../controllers/treinoController');

// Rota especial para gerar o ABC
// POST /api/treinos/gerar-abc
router.post('/gerar-abc', auth, treinoController.gerarTreinosABC);

// Rotas CRUD padrão
// GET /api/treinos (Visualizar Todos)
router.get('/', auth, treinoController.getTreinos);

// POST /api/treinos (Cadastrar)
router.post('/', auth, treinoController.createTreino);

// GET /api/treinos/:id (Visualizar Um)
router.get('/:id', auth, treinoController.getTreinoById);

// PUT /api/treinos/:id (Editar)
router.put('/:id', auth, treinoController.updateTreino);

// DELETE /api/treinos/:id (Excluir)
router.delete('/:id', auth, treinoController.deleteTreino);

module.exports = router;