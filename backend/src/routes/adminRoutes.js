// src/routes/adminRoutes.js
// simple admin panel endpoints

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const flashController = require('../controllers/flashController');
const productController = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

// for MVP we assume authenticate user normally and use protect middleware
// additional check could be added to verify admin flag

router.put('/flash/:id', protect, flashController.updateOffer);

// product management is handled in productRoutes; we could also re-export
router.post('/product', protect, productController.create);
router.put('/product/:id', protect, productController.update);
router.delete('/product/:id', protect, productController.remove);

module.exports = router;
