// src/controllers/productController.js
// Admin and public operations on products

const { validationResult } = require('express-validator');
const Product = require('../models/productModel');

async function list(req, res, next) {
  try {
    const { category } = req.query;
    const products = await Product.getAll({ category });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// admin
async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const { name, description, price, stock, category, image_url } = req.body;
    const id = await Product.createProduct({ name, description, price, stock, category, image_url });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = req.body;
    await Product.updateProduct(req.params.id, data);
    res.json({ message: 'Updated' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Product.deleteProduct(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};
