// src/models/cartModel.js

const { getPool } = require('../config/db');

async function addItem(userId, productId, quantity) {
  const pool = getPool();
  const [existing] = await pool.execute(
    'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  if (existing.length > 0) {
    // update quantity
    await pool.execute(
      'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
      [quantity, userId, productId]
    );
  } else {
    await pool.execute(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [userId, productId, quantity]
    );
  }
}

async function updateItem(userId, productId, quantity) {
  const pool = getPool();
  if (quantity <= 0) {
    await pool.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
  } else {
    await pool.execute('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, userId, productId]);
  }
}

async function removeItem(userId, productId) {
  const pool = getPool();
  await pool.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
}

async function getCart(userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.image_url
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = ?`,
    [userId]
  );
  return rows;
}

module.exports = { addItem, updateItem, removeItem, getCart };
