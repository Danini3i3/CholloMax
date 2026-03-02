// src/models/productModel.js

const { getPool } = require('../config/db');

async function createProduct({ name, description, price, stock, category, image_url }) {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO products (name, description, price, stock, category, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, price, stock, category, image_url]
  );
  return result.insertId;
}

async function getAll({ category } = {}) {
  const pool = getPool();
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function updateProduct(id, data) {
  const pool = getPool();
  const fields = [];
  const values = [];
  for (const key in data) {
    fields.push(`${key} = ?`);
    values.push(data[key]);
  }
  if (fields.length === 0) return;
  values.push(id);
  await pool.execute(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

async function deleteProduct(id) {
  const pool = getPool();
  await pool.execute('DELETE FROM products WHERE id = ?', [id]);
}

module.exports = {
  createProduct,
  getAll,
  findById,
  updateProduct,
  deleteProduct,
};
