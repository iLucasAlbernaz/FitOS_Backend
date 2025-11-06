const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middleware/auth'); 


router.post('/', usuarioController.cadastrarUsuario);
router.get('/perfil', authMiddleware, usuarioController.getUsuarioLogado); 
router.put('/perfil', authMiddleware, usuarioController.atualizarPerfil); 
router.delete('/perfil', authMiddleware, usuarioController.deletarPerfil);


module.exports = router;