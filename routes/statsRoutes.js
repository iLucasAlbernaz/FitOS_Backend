const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const statsController = require('../controllers/statsController');

// @route   GET /api/stats/dashboard
// @desc    Busca dados agregados para os gráficos do painel
// @access  Private
router.get('/dashboard', auth, statsController.getDashboardStats);

module.exports = router;