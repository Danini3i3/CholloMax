// src/controllers/orderController.js
// Handles order creation and related logic

const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

async function placeOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const items = await Cart.getCart(userId);
    if (items.length === 0) {
      return res.status(400).json({ message: 'Cart empty' });
    }
    let total = 0;
    for (const item of items) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ message: `Not enough stock for ${item.name}` });
      }
      total += item.price * item.quantity;
    }
    // create order
    const orderId = await Order.createOrder({ userId, total });
    for (const item of items) {
      await Order.addOrderItem(orderId, item.product_id, item.quantity, item.price);
      // decrement stock
      await Product.updateProduct(item.product_id, { stock: item.stock - item.quantity });
    }
    // clear cart
    // note: simple implementation - remove all items
    for (const item of items) {
      await Cart.removeItem(userId, item.product_id);
    }
    // add points 1€=1 point
    const user = await User.findById(userId);
    const newPoints = user.puntos + Math.floor(total);
    await User.updatePoints(userId, newPoints);
    res.json({ message: 'Order placed', orderId, newPoints });
  } catch (err) {
    next(err);
  }
}

module.exports = { placeOrder };
