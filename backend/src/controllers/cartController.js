// src/controllers/cartController.js
// Operations on the shopping cart

const { validationResult } = require('express-validator');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

async function add(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    const prod = await Product.findById(productId);
    if (!prod) return res.status(404).json({ message: 'Product not found' });
    if (quantity > prod.stock) {
      return res.status(400).json({ message: 'Not enough stock' });
    }
    await Cart.addItem(req.user.id, productId, quantity);
    res.status(201).json({ message: 'Added' });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    const prod = await Product.findById(productId);
    if (!prod) return res.status(404).json({ message: 'Product not found' });
    if (quantity > prod.stock) {
      return res.status(400).json({ message: 'Not enough stock' });
    }
    await Cart.updateItem(req.user.id, productId, quantity);
    res.json({ message: 'Updated' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { productId } = req.body;
    await Cart.removeItem(req.user.id, productId);
    res.json({ message: 'Removed' });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const items = await Cart.getCart(req.user.id);
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
}

module.exports = { add, update, remove, get };
