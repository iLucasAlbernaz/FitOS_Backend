const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const diarioController = require('../controllers/diarioController');

// GET /api/diarios (Visualizar Todos)
router.get('/', auth, diarioController.getRegistros);

// POST /api/diarios (Cadastrar)
router.post('/', auth, diarioController.createRegistro);

// GET /api/diarios/:id (Visualizar Um para Editar)
router.get('/:id', auth, diarioController.getRegistroById);

// PUT /api/diarios/:id (Editar)
router.put('/:id', auth, diarioController.updateRegistro);

// DELETE /api/diarios/:id (Excluir)
router.delete('/:id', auth, diarioController.deleteRegistro);

module.exports = router;