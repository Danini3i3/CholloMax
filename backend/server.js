// server.js
// Entry point for the backend Express application

require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');

const { initDB } = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// initialize database
initDB();

// routes (placeholders, to be expanded in controllers/routes files)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/game', require('./src/routes/gameRoutes'));
app.use('/api/flash', require('./src/routes/flashRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/user', require('./src/routes/userRoutes')); // profile & points

// error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
