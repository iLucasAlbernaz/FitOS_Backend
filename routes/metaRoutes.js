const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const metaController = require('../controllers/metaController');

// GET /api/metas (Visualizar Todas)
router.get('/', auth, metaController.getMetas);

// [ROTA ADICIONADA]
// GET /api/metas/:id (Visualizar Um para Editar)
router.get('/:id', auth, metaController.getMetaById);

// POST /api/metas (Cadastrar)
router.post('/', auth, metaController.createMeta);

// PUT /api/metas/:id (Editar)
router.put('/:id', auth, metaController.updateMeta);

// DELETE /api/metas/:id (Excluir)
router.delete('/:id', auth, metaController.deleteMeta);

module.exports = router;