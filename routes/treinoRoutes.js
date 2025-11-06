const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const treinoController = require('../controllers/treinoController');

router.post('/gerar-abc', auth, treinoController.gerarTreinosABC);

router.get('/', auth, treinoController.getTreinos);

router.post('/', auth, treinoController.createTreino);

router.get('/:id', auth, treinoController.getTreinoById);

router.put('/:id', auth, treinoController.updateTreino);

router.delete('/:id', auth, treinoController.deleteTreino);

module.exports = router;