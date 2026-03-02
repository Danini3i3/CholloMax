// src/controllers/gameController.js
// Simple daily roulette game

const Game = require('../models/gameModel');
const User = require('../models/userModel');

function randomPrize() {
  const roll = Math.random();
  if (roll < 0.25) return { type: 'points', amount: 50 };
  if (roll < 0.5) return { type: 'discount', amount: 10 }; // percent
  if (roll < 0.75) return { type: 'shipping', amount: 0 }; // free shipping
  return { type: 'none' };
}

async function spin(req, res, next) {
  try {
    const userId = req.user.id;
    const last = await Game.lastSpin(userId);
    if (last) {
      const diff = Date.now() - new Date(last.fecha).getTime();
      if (diff < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ message: 'Already played in last 24h' });
      }
    }
    const prize = randomPrize();
    // record
    await Game.recordSpin(userId, JSON.stringify(prize));
    // apply effect
    if (prize.type === 'points') {
      const user = await User.findById(userId);
      await User.updatePoints(userId, user.puntos + prize.amount);
    }
    res.json({ prize });
  } catch (err) {
    next(err);
  }
}

module.exports = { spin };
