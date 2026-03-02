// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/profile', userController.getProfile);
router.post('/redeem', [body('points').isInt({ gt: 0 })], userController.redeemPoints);

module.exports = router;