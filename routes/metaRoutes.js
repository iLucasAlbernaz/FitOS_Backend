const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const metaController = require('../controllers/metaController');

router.get('/', auth, metaController.getMetas);

router.get('/:id', auth, metaController.getMetaById);

router.post('/', auth, metaController.createMeta);

router.put('/:id', auth, metaController.updateMeta);

router.delete('/:id', auth, metaController.deleteMeta);

module.exports = router;