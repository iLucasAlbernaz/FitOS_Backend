const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const receitaController = require('../controllers/receitaController');

router.get('/', auth, receitaController.getReceitas);

router.post('/', auth, receitaController.createReceita);

router.get('/:id', auth, receitaController.getReceitaById);

router.put('/:id', auth, receitaController.updateReceita);

router.delete('/:id', auth, receitaController.deleteReceita);

module.exports = router;