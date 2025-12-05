const express = require('express');
const orchestrator = require('../services/orchestrator');
const OrionAgent = require('../agents/OrionAgent');

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

router.post('/orion/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message: must be a non-empty string' });
    }

    const orion = new OrionAgent();
    const response = await orion.chat(message);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
  return next();
});

module.exports = router;
