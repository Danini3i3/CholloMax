// src/models/gameModel.js
// Track game history per user

const { getPool } = require('../config/db');

async function recordSpin(userId, prize) {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO historial_juego (user_id, prize, fecha)
     VALUES (?, ?, NOW())`,
    [userId, prize]
  );
}

async function lastSpin(userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT fecha FROM historial_juego WHERE user_id = ? ORDER BY fecha DESC LIMIT 1`,
    [userId]
  );
  return rows[0];
}

module.exports = { recordSpin, lastSpin };
