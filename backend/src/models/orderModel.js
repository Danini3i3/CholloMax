// src/models/orderModel.js

const { getPool } = require('../config/db');

async function createOrder({ userId, total }) {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO orders (user_id, total, fecha, estado)
     VALUES (?, ?, NOW(), 'pending')`,
    [userId, total]
  );
  return result.insertId;
}

async function addOrderItem(orderId, productId, quantity, price) {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO order_items (order_id, product_id, quantity, price)
     VALUES (?, ?, ?, ?)`,
    [orderId, productId, quantity, price]
  );
}

module.exports = { createOrder, addOrderItem };
