const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const receitaController = require('../controllers/receitaController');

// [NOVO] Rota para Calcular Macros (Edamam)
// Deve vir antes de /:id
router.post('/calcular-macros', auth, receitaController.calcularMacros);

// [EXISTENTE] Rota para Sugerir Receitas (Gemini)
// Deve vir antes de /:id
router.get('/sugeridas', auth, receitaController.sugerirReceitas);

// --- Rotas CRUD Padrão ---
router.get('/', auth, receitaController.getReceitas);
router.post('/', auth, receitaController.createReceita);
router.get('/:id', auth, receitaController.getReceitaById);
router.put('/:id', auth, receitaController.updateReceita);
router.delete('/:id', auth, receitaController.deleteReceita);

module.exports = router;