const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dietaController = require('../controllers/dietaController');

// @route   GET /api/dieta/meu-plano
router.get('/meu-plano', auth, dietaController.getPlanoAtivo);

// @route   GET /api/dieta/planos-salvos
router.get('/planos-salvos', auth, dietaController.getPlanosSalvos);

// @route   POST /api/dieta/gerar-plano-ia
router.post('/gerar-plano-ia', auth, dietaController.gerarPlanoDietaIA);

// @route   POST /api/dieta/salvar-plano-gerado
router.post('/salvar-plano-gerado', auth, dietaController.salvarPlanoGerado);

// @route   PUT /api/dieta/set-ativo/:id
router.put('/set-ativo/:id', auth, dietaController.setPlanoAtivo);

// @route   DELETE /api/dieta/plano/:id
// @desc    [NOVO] Exclui um plano de dieta salvo (inativo)
router.delete('/plano/:id', auth, dietaController.deletePlanoSalvo);


module.exports = router;