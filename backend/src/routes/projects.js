const express = require('express');
const db = require('../db/connection');
const projectContextService = require("../services/projectContextService");
const memoryExtractionService = require("../services/memoryExtractionService");

const router = express.Router();

// List all projects
router.get("/", async (req, res, next) => {
  try {
    const projects = await db.listProjects();
    res.json(projects || []);
  } catch (err) {
    next(err);
  }
});

// Get project by id
router.get("/:id", async (req, res, next) => {
  try {
    const project = await db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    return res.json(project);
  } catch (err) {
    return next(err);
  }
});

// Create a new project
router.post("/", async (req, res, next) => {
  try {
    const { name, description, path, git_url } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }
    const project = await db.createProject({
      name,
      description,
      path,
      git_url,
    });
    return res.status(201).json(project);
  } catch (err) {
    console.error("Create Project Failed:", err); // ADDED LOG
    return next(err);
  }
});

// Import project from git
router.post("/import", async (req, res, next) => {
  try {
    const { git_url, name } = req.body;
    if (!git_url) {
      return res.status(400).json({ error: "Git URL is required" });
    }
    // For now, we'll create a project with the git_url and a generated path
    // In a real implementation, we would clone the repo and set the path
    const projectName = name || `Imported from ${git_url}`;
    const project = await db.createProject({
      name: projectName,
      description: `Project imported from ${git_url}`,
      git_url,
      path: `./projects/${Date.now()}`,
    });
    return res.status(201).json(project);
  } catch (err) {
    return next(err);
  }
});

// Update project
router.put("/:id", async (req, res, next) => {
  try {
    const project = await db.updateProject(req.params.id, req.body);
    return res.json(project);
  } catch (err) {
    return next(err);
  }
});

// Delete project
router.delete("/:id", async (req, res, next) => {
  try {
    await db.deleteProject(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

// Get project context
router.get("/:id/context", async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }
    const context = await projectContextService.buildContext(projectId);
    if (!context) {
      return res
        .status(404)
        .json({ error: "Project not found or context unavailable" });
    }
    return res.json(context);
  } catch (err) {
    return next(err);
  }
});

// Update project context (memory)
router.post("/:id/context", async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }
    const { facts } = req.body;
    if (!facts || !Array.isArray(facts)) {
      return res
        .status(400)
        .json({ error: "Request body must contain an array of facts" });
    }
    await memoryExtractionService.saveExtractedFacts(projectId, facts);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
});

// Error handler
router.use((err, req, res, next) => {
  if (err) {
    console.error("Error in projects router:", err.message, err.stack);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Invalid request" });
  }
  return next();
});

module.exports = router;
