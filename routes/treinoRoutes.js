const express = require('express');
const router = express.Router();
const treinoController = require('../controllers/treinoController');
const authMiddleware = require('../middleware/auth'); 

router.post('/', authMiddleware, treinoController.criarRotina);
router.get('/', authMiddleware, treinoController.buscarRotinasUsuario);
router.put('/:id', authMiddleware, treinoController.atualizarRotina); 
router.delete('/:id', authMiddleware, treinoController.deletarRotina);

module.exports = router;