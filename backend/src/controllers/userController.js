// src/controllers/userController.js
// endpoints related to user profile and points

const User = require('../models/userModel');

async function getProfile(req, res, next) {
  try {
    // req.user already has minimal info
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function redeemPoints(req, res, next) {
  try {
    const { points } = req.body;
    if (!points || points <= 0) {
      return res.status(400).json({ message: 'Invalid points to redeem' });
    }
    const user = await User.findById(req.user.id);
    if (user.puntos < points) {
      return res.status(400).json({ message: 'Not enough points' });
    }
    // calculate discount
    const discount = Math.floor(points / 100) * 5; // 100->5
    const remainingPoints = user.puntos - points;
    await User.updatePoints(user.id, remainingPoints);
    res.json({ discount, remainingPoints });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, redeemPoints };
