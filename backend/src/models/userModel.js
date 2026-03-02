// src/models/userModel.js
// Data access methods for `users` table

const { getPool } = require('../config/db');

async function createUser({ name, email, passwordHash }) {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password, puntos, fecha_registro)
     VALUES (?, ?, ?, 0, NOW())`,
    [name, email, passwordHash]
  );
  return result.insertId;
}

async function findByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT * FROM users WHERE email = ?`,
    [email]
  );
  return rows[0];
}

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, email, puntos, fecha_registro FROM users WHERE id = ?`,
    [id]
  );
  return rows[0];
}

async function updatePoints(id, newPoints) {
  const pool = getPool();
  await pool.execute(
    `UPDATE users SET puntos = ? WHERE id = ?`,
    [newPoints, id]
  );
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updatePoints,
};
