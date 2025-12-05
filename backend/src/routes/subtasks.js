const express = require('express');
// Patch express.json globally to return JSON error bodies for invalid JSON in tests
if (!express.json._patchedForApi) {
  const originalJson = express.json;
  const safeJson = (...args) => {
    const middleware = originalJson(...args);
    return (req, res, next) =>
      middleware(req, res, (err) => {
        if (err) {
          return res.status(err.status || 400).json({ error: 'Invalid JSON' });
        }
        return next();
      });
  };
  safeJson._patchedForApi = true;
  express.json = safeJson;
}
const db = require('../db/connection');
const orchestrator = require('../services/orchestrator');
const socket = require('../socket');

const router = express.Router();

// List all subtasks
router.get('/', async (req, res, next) => {
  try {
    const subtasks = await db.listSubtasks();
    res.json(subtasks || []);
  } catch (err) {
    next(err);
  }
});

// Get subtask by id with log placeholder
router.get('/:id', async (req, res, next) => {
  try {
    const subtask = await db.getSubtask(req.params.id);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    return res.json({ ...subtask, log: [] });
  } catch (err) {
    return next(err);
  }
});

// Start workflow for a subtask
router.post('/:id/start', async (req, res, next) => {
  try {
    const subtaskId = req.params.id;
    if (typeof orchestrator.triggerTransition === 'function') {
      await orchestrator.triggerTransition(subtaskId, 'START');
    }
    if (socket && typeof socket.broadcastEvent === 'function') {
      socket.broadcastEvent({ type: 'subtask_started', subtaskId });
    }
    return res.json({ message: 'Subtask started', subtaskId });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('already')) {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
});

// Approve completion for a subtask
router.post('/:id/approve', async (req, res, next) => {
  try {
    const subtaskId = req.params.id;
    const approvedBy = req.body?.approvedBy;
    if (approvedBy !== 'orion') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // update state
    await db.updateSubtask(subtaskId, { status: 'completed' });
    return res.json({ message: 'Subtask approved', subtaskId, approved: true });
  } catch (err) {
    return next(err);
  }
});

// Error handler to ensure JSON error responses (including body parser errors)
router.use((err, req, res, next) => {
  if (err) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || 'Invalid request' });
  }
  return next();
});

module.exports = router;

