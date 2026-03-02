// src/models/flashModel.js

const { getPool } = require('../config/db');

async function getActiveOffers() {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT * FROM ofertas_flash WHERE fecha_inicio <= NOW() AND fecha_fin >= NOW()`
  );
  return rows;
}

async function updateOffer(id, data) {
  const pool = getPool();
  const fields = [];
  const values = [];
  for (const key in data) {
    fields.push(`${key} = ?`);
    values.push(data[key]);
  }
  if (fields.length === 0) return;
  values.push(id);
  await pool.execute(`UPDATE ofertas_flash SET ${fields.join(', ')} WHERE id = ?`, values);
}

module.exports = { getActiveOffers, updateOffer };
