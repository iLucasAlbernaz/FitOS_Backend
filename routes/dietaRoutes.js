const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // (Presumo que seu middleware de autenticação se chame 'auth.js')
const dietaController = require('../controllers/dietaController');

// Rota para BUSCAR o plano (Já existia)
// GET /api/dieta/meu-plano
router.get('/meu-plano', auth, dietaController.getMeuPlano);

// Rota para CRIAR/ESCOLHER um plano (Nova)
// POST /api/dieta/gerar
router.post('/gerar', auth, dietaController.gerarMeuPlano);


module.exports = router;