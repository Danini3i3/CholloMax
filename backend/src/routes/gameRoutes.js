// src/routes/gameRoutes.js

const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/spin', protect, gameController.spin);

module.exports = router;