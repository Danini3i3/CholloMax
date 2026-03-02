// src/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', cartController.get);
router.post('/add', [body('productId').isInt(), body('quantity').isInt({ gt: 0 })], cartController.add);
router.post('/update', [body('productId').isInt(), body('quantity').isInt()], cartController.update);
router.post('/remove', [body('productId').isInt()], cartController.remove);

module.exports = router;
