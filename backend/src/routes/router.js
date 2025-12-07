const express = require('express');
const router = express.Router();
const TaskRouter = require('../services/taskRouter');

/**
 * POST /api/router/classify
 * Body: { message: string }
 * Returns: { mode: 'strategic' | 'tactical' }
 */
router.post('/classify', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const mode = TaskRouter.classify(message);
    res.json({ mode });
  } catch (error) {
    console.error('Router error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

