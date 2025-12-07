const express = require('express');
const router = express.Router();
const workflowEngine = require('../services/workflowEngine');

/**
 * Handle errors consistently across routes
 */
const handleRouteError = (error, res, context = '') => {
  console.error(`Error ${context}:`, error);
  
  if (error.message.includes('requires') || error.message.includes('Invalid')) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

/**
 * Validate workflow update payload
 */
const validateWorkflowUpdate = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid JSON');
  }
  
  if (!payload.name || !payload.definition) {
    throw new Error('Workflow update requires name and definition');
  }
  
  return true;
};

/**
 * @route GET /api/workflows
 * @desc List all active workflows
 * @access Public (for MVP, but could be restricted)
 */
router.get('/', async (req, res) => {
  try {
    const workflows = await workflowEngine.listWorkflows();
    res.json(workflows);
  } catch (error) {
    handleRouteError(error, res, 'listing workflows');
  }
});

/**
 * @route GET /api/workflows/:id
 * @desc Get a specific workflow by its name (id)
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const workflow = await workflowEngine.getWorkflow(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json(workflow);
  } catch (error) {
    handleRouteError(error, res, `getting workflow ${req.params.id}`);
  }
});

/**
 * @route PUT /api/workflows/:id
 * @desc Update a workflow (admin only, but MVP no auth)
 * @access Private (admin) - for MVP we'll just accept the update
 */
router.put('/:id', async (req, res) => {
  try {
    validateWorkflowUpdate(req.body);
    
    const updated = await workflowEngine.updateWorkflow(req.params.id, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json(updated);
  } catch (error) {
    handleRouteError(error, res, `updating workflow ${req.params.id}`);
  }
});

module.exports = router;
