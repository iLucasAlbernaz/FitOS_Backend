const express = require('express');
const router = express.Router();
const diarioController = require('../controllers/diarioController');
const authMiddleware = require('../middleware/auth'); 

router.post('/', authMiddleware, diarioController.criarDiario);
router.get('/', authMiddleware, diarioController.buscarDiariosUsuario);
router.put('/:id', authMiddleware, diarioController.atualizarDiario); 
router.delete('/:id', authMiddleware, diarioController.deletarDiario);

module.exports = router;