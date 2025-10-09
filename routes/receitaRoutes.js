const express = require('express');
const router = express.Router();
const receitaController = require('../controllers/receitaController');
const authMiddleware = require('../middleware/auth'); 

router.post('/', authMiddleware, receitaController.criarReceita);
router.get('/', authMiddleware, receitaController.buscarReceitasUsuario);
router.put('/:id', authMiddleware, receitaController.atualizarReceita); 
router.delete('/:id', authMiddleware, receitaController.deletarReceita);

module.exports = router;