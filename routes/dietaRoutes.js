const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dietaController = require('../controllers/dietaController');

// @route   GET /api/dieta/meu-plano
// @desc    Busca o plano de dieta ATIVO
router.get('/meu-plano', auth, dietaController.getPlanoAtivo);

// @route   GET /api/dieta/planos-salvos
// @desc    Busca os planos de dieta INATIVOS (salvos)
router.get('/planos-salvos', auth, dietaController.getPlanosSalvos);

// @route   POST /api/dieta/gerar-plano-ia
// @desc    [MODIFICADO] Gera uma SUGESTÃO de plano (Não salva no banco)
router.post('/gerar-plano-ia', auth, dietaController.gerarPlanoDietaIA);

// @route   POST /api/dieta/salvar-plano-gerado
// @desc    [NOVO] Salva o plano (recebido no body) e o define como ATIVO
router.post('/salvar-plano-gerado', auth, dietaController.salvarPlanoGerado);

// @route   PUT /api/dieta/set-ativo/:id
// @desc    Define um plano salvo (antigo) como o ATIVO
router.put('/set-ativo/:id', auth, dietaController.setPlanoAtivo);

module.exports = router;