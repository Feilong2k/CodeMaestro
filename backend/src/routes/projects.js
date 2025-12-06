const express = require('express');
const db = require('../db/connection');

const router = express.Router();

// List all projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await db.listProjects();
    res.json(projects || []);
  } catch (err) {
    next(err);
  }
});

// Get project by id
router.get('/:id', async (req, res, next) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.json(project);
  } catch (err) {
    return next(err);
  }
});

// Create a new project
router.post('/', async (req, res, next) => {
  try {
    const { name, description, path, git_url } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    const project = await db.createProject({ name, description, path, git_url });
    return res.status(201).json(project);
  } catch (err) {
    console.error('Create Project Failed:', err); // ADDED LOG
    return next(err);
  }
});

// Import project from git
router.post('/import', async (req, res, next) => {
  try {
    const { git_url, name } = req.body;
    if (!git_url) {
      return res.status(400).json({ error: 'Git URL is required' });
    }
    // For now, we'll create a project with the git_url and a generated path
    // In a real implementation, we would clone the repo and set the path
    const projectName = name || `Imported from ${git_url}`;
    const project = await db.createProject({
      name: projectName,
      description: `Project imported from ${git_url}`,
      git_url,
      path: `./projects/${Date.now()}`
    });
    return res.status(201).json(project);
  } catch (err) {
    return next(err);
  }
});

// Update project
router.put('/:id', async (req, res, next) => {
  try {
    const project = await db.updateProject(req.params.id, req.body);
    return res.json(project);
  } catch (err) {
    return next(err);
  }
});

// Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    await db.deleteProject(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

// Error handler
router.use((err, req, res, next) => {
  if (err) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || 'Invalid request' });
  }
  return next();
});

module.exports = router;
