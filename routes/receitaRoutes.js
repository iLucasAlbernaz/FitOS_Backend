const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const receitaController = require('../controllers/receitaController');

// [NOVA ROTA]
// GET /api/receitas/sugeridas (Deve vir ANTES de /:id)
router.get('/sugeridas', auth, receitaController.sugerirReceitas);

// GET /api/receitas (Visualizar Todas)
router.get('/', auth, receitaController.getReceitas);

// POST /api/receitas (Cadastrar)
router.post('/', auth, receitaController.createReceita);

// GET /api/receitas/:id (Visualizar Um)
router.get('/:id', auth, receitaController.getReceitaById);

// PUT /api/receitas/:id (Editar)
router.put('/:id', auth, receitaController.updateReceita);

// DELETE /api/receitas/:id (Excluir)
router.delete('/:id', auth, receitaController.deleteReceita);

module.exports = router;