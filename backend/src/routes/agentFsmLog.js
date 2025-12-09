/**
 * Routes for Agent FSM Logging
 */
const express = require('express');
const AgentFsmLogService = require('../services/AgentFsmLogService');

const router = express.Router();

/**
 * GET /api/agent-fsm-log/:subtaskId
 * Retrieve all FSM transitions for a specific subtask
 */
router.get('/:subtaskId', async (req, res, next) => {
  try {
    const { subtaskId } = req.params;
    
    if (!subtaskId || subtaskId.trim() === '') {
      return res.status(400).json({ 
        error: 'subtaskId is required and must be non-empty' 
      });
    }

    const transitions = await AgentFsmLogService.getTransitionsBySubtask(subtaskId);
    
    res.json({
      subtaskId,
      count: transitions.length,
      transitions
    });
  } catch (error) {
    console.error('Error fetching agent FSM logs:', error);
    next(error);
  }
});

module.exports = router;
