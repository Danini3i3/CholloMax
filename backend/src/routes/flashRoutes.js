// src/routes/flashRoutes.js

const express = require('express');
const router = express.Router();
const flashController = require('../controllers/flashController');

// public
router.get('/active', flashController.listActive);

module.exports = router;