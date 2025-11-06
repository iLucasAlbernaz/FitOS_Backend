const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const chatController = require('../controllers/chatController');

router.post('/', auth, chatController.handleChat);
router.get('/historico', auth, chatController.getHistorico);

module.exports = router;