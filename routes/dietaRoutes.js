const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dietaController = require('../controllers/dietaController');

// @route   GET /api/dieta/meu-plano
// @desc    Busca o plano de dieta atual do usuário
router.get('/meu-plano', auth, dietaController.getMeuPlano);

// @route   POST /api/dieta/gerar-plano-ia
// @desc    Gera um novo plano de dieta com IA (Spoonacular)
router.post('/gerar-plano-ia', auth, dietaController.gerarPlanoSpoonacular);

// [REMOVIDO] A rota /gerar (plano estático) não é mais necessária
// router.post('/gerar', auth, dietaController.gerarMeuPlano);

module.exports = router;