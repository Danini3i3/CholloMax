// src/controllers/flashController.js
// Returns active flash offers

const Flash = require('../models/flashModel');

async function listActive(req, res, next) {
  try {
    const offers = await Flash.getActiveOffers();
    res.json(offers);
  } catch (err) {
    next(err);
  }
}

async function updateOffer(req, res, next) {
  try {
    const id = req.params.id;
    await Flash.updateOffer(id, req.body);
    res.json({ message: 'Offer updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listActive, updateOffer };
