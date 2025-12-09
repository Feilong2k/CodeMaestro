const express = require('express');
const orchestrator = require('../services/orchestrator');
const OrionAgent = require('../agents/OrionAgent');
const agentRegistryService = require('../services/agentRegistryService');

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
    const { message, mode, projectId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message: must be a non-empty string' });
    }

    const orion = new OrionAgent();
    // Pass mode and projectId - history is loaded from database
    const response = await orion.chat(message, mode, projectId);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// === Agent Registry Routes ===

/**
 * GET /api/agents/registry - Get all agents with their tools
 */
router.get('/registry', async (req, res, next) => {
  try {
    const agents = await agentRegistryService.getAllAgents();
    res.json(agents);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agents/tools - Get all available tools
 */
router.get('/tools', async (req, res, next) => {
  try {
    const tools = await agentRegistryService.getAllTools();
    res.json(tools);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agents/:name/tools - Get tools for a specific agent
 */
router.get('/:name/tools', async (req, res, next) => {
  try {
    const tools = await agentRegistryService.getToolsForAgent(req.params.name);
    res.json(tools);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agents/registry - Create a new agent
 */
router.post('/registry', async (req, res, next) => {
  try {
    const { id, name, role, description } = req.body;
    if (!id || !name || !role) {
      return res.status(400).json({ error: 'Agent id, name, and role are required' });
    }
    const agent = await agentRegistryService.createAgent(id, name, role, description);
    res.status(201).json(agent);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agents/tools - Create a new tool
 */
router.post('/tools', async (req, res, next) => {
  try {
    const { name, description, className } = req.body;
    if (!name || !className) {
      return res.status(400).json({ error: 'Tool name and className are required' });
    }
    const tool = await agentRegistryService.createTool(name, description, className);
    res.status(201).json(tool);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agents/:name/tools/:toolName - Assign a tool to an agent
 */
router.post('/:name/tools/:toolName', async (req, res, next) => {
  try {
    await agentRegistryService.assignToolToAgent(req.params.name, req.params.toolName);
    res.json({ success: true, message: `Tool ${req.params.toolName} assigned to ${req.params.name}` });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/agents/:name/tools/:toolName - Remove a tool from an agent
 */
router.delete('/:name/tools/:toolName', async (req, res, next) => {
  try {
    await agentRegistryService.removeToolFromAgent(req.params.name, req.params.toolName);
    res.json({ success: true, message: `Tool ${req.params.toolName} removed from ${req.params.name}` });
  } catch (err) {
    next(err);
  }
});

// === Permission Management Routes ===

/**
 * GET /api/agents/:name/permissions - Get all permissions for an agent
 */
router.get('/:name/permissions', async (req, res, next) => {
  try {
    const permissions = await agentRegistryService.getPermissionsForAgent(req.params.name);
    res.json(permissions);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agents/:name/permissions - Add a permission
 * Body: { pathPattern, permission, isAllowed, priority }
 */
router.post('/:name/permissions', async (req, res, next) => {
  try {
    const { pathPattern, permission, isAllowed, priority } = req.body;
    if (!pathPattern || !permission) {
      return res.status(400).json({ error: 'pathPattern and permission are required' });
    }
    await agentRegistryService.addPermission(
      req.params.name,
      pathPattern,
      permission,
      isAllowed !== false,
      priority || 0
    );
    res.status(201).json({ success: true, message: 'Permission added' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/agents/:name/permissions - Remove a permission
 * Body: { pathPattern, permission }
 */
router.delete('/:name/permissions', async (req, res, next) => {
  try {
    const { pathPattern, permission } = req.body;
    if (!pathPattern || !permission) {
      return res.status(400).json({ error: 'pathPattern and permission are required' });
    }
    await agentRegistryService.removePermission(req.params.name, pathPattern, permission);
    res.json({ success: true, message: 'Permission removed' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agents/:name/check-permission - Check if agent has permission
 * Body: { path, permission }
 */
router.post('/:name/check-permission', async (req, res, next) => {
  try {
    const { path, permission } = req.body;
    if (!path || !permission) {
      return res.status(400).json({ error: 'path and permission are required' });
    }
    const allowed = await agentRegistryService.checkPermission(req.params.name, path, permission);
    res.json({ path, permission, allowed });
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
