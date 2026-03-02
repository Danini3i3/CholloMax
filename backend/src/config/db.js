// src/config/db.js
// Initialize MySQL connection using mysql2 and export a pool

const mysql = require('mysql2/promise');

let pool;

async function initDB() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'flashdeal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('MySQL pool created');
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initDB first.');
  }
  return pool;
}

module.exports = { initDB, getPool };
