const express = require('express');

const router = express.Router();

// Simple in-memory events placeholder
let events = [];

router.get('/', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10);
    let result = events;
    if (!Number.isNaN(limit) && limit > 0) {
      result = events.slice(0, limit);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err) {
    return res.status(err.status || 400).json({ error: err.message || 'Invalid request' });
  }
  return next();
});

module.exports = router;

