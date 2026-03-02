// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// registration route
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  ],
  authController.register
);

// login route
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').exists(),
  ],
  authController.login
);

module.exports = router;
