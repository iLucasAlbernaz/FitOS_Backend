const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const dietaController = require('../controllers/dietaController');

router.get('/meu-plano', auth, dietaController.getMeuPlano);
router.post('/gerar', auth, dietaController.gerarMeuPlano);


module.exports = router;