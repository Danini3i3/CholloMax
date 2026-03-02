// src/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

// public
router.get('/', productController.list);
router.get('/:id', productController.getOne);

// admin (for simplicity assume any logged user is admin; later we could extend roles)
router.post(
  '/',
  protect,
  [
    body('name').notEmpty(),
    body('price').isFloat({ gt: 0 }),
  ],
  productController.create
);
router.put('/:id', protect, productController.update);
router.delete('/:id', protect, productController.remove);

module.exports = router;
