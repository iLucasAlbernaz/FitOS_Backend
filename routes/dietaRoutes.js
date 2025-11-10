const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dietaController = require('../controllers/dietaController');

// Rota para BUSCAR o plano (Já existia)
// GET /api/dieta/meu-plano
router.get('/meu-plano', auth, dietaController.getMeuPlano);

// Rota para CRIAR/ESCOLHER um plano (Padrão)
// POST /api/dieta/gerar
router.post('/gerar', auth, dietaController.gerarMeuPlano);

// [NOVO] Rota para CRIAR/ESCOLHER um plano (Spoonacular - IA)
// POST /api/dieta/gerar-plano-ia
router.post('/gerar-plano-ia', auth, dietaController.gerarPlanoSpoonacular);

module.exports = router;