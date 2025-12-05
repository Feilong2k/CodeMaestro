const express = require('express');
const orchestrator = require('../services/orchestrator');

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    let status = {};
    if (typeof orchestrator.getAgentStatus === 'function') {
      status = await orchestrator.getAgentStatus();
    }
    res.json(status || {});
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

