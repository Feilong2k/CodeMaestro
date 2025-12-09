const db = require('../db/connection');
const fs = require('fs');
const path = require('path');

// Project root - configurable via env for cloud deployment
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, '../../../');
const PROJECTS_DIR = process.env.PROJECTS_PATH || path.join(PROJECT_ROOT, 'Projects');

/**
 * Tool for managing projects (CRUD operations).
 */
const ProjectTool = {
  /**
   * Create a new project.
   * Inserts into DB and creates local directory inside Projects/.
   * @param {Object} projectData
   * @param {string} projectData.name - Unique project name.
   * @param {string} projectData.description - Project description.
   * @param {string} [projectData.path] - Optional custom path (defaults to Projects/{name}).
   * @returns {Promise<Object>} The created project.
   */
  async createProject(projectData) {
    const { name, description } = projectData;

    if (!name) {
      throw new Error('Project name is required');
    }

    // Auto-generate path inside Projects folder if not provided
    const relativePath = projectData.path || `Projects/${name}`;
    const absolutePath = path.join(PROJECT_ROOT, relativePath);

    // 1. Create directory (with safety check)
    if (!absolutePath.startsWith(PROJECT_ROOT)) {
      throw new Error('Invalid project path: must be within project root');
    }
    
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
    }

    // 2. Insert into DB (store relative path)
    const query = `
      INSERT INTO projects (name, description, path, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING *
    `;
    const values = [name, description, relativePath];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Project with name "${name}" already exists`);
      }
      throw error;
    }
  },

  /**
   * Soft delete a project.
   * @param {number} projectId
   * @returns {Promise<void>}
   */
  async deleteProject(projectId) {
    const query = `
      UPDATE projects
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, ['deleted', projectId]);
    
    if (result.rowCount === 0) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
  },

  /**
   * List all active projects.
   * @returns {Promise<Array>}
   */
  async listProjects() {
    const query = `
      SELECT * FROM projects
      WHERE status = $1
      ORDER BY updated_at DESC
    `;
    
    const result = await db.query(query, ['active']);
    return result.rows;
  },

  /**
   * Get details of a specific project.
   * @param {number} projectId
   * @returns {Promise<Object|null>}
   */
  async getProject(projectId) {
    const query = `
      SELECT * FROM projects
      WHERE id = $1
    `;
    
    const result = await db.query(query, [projectId]);
    return result.rows.length ? result.rows[0] : null;
  },

  /**
   * Update project details.
   * If path is updated, creates the folder if it doesn't exist.
   * @param {number} projectId
   * @param {Object} updates - Fields to update (name, description, git_url, path).
   * @returns {Promise<Object>} Updated project.
   */
  async updateProject(projectId, updates) {
    const allowedFields = ['name', 'description', 'git_url', 'path'];
    const fieldsToUpdate = [];
    const values = [];
    let paramCount = 1;

    // If path is being updated, create the folder
    if (updates.path) {
      const absolutePath = path.join(PROJECT_ROOT, updates.path);
      if (!absolutePath.startsWith(PROJECT_ROOT)) {
        throw new Error('Invalid project path: must be within project root');
      }
      if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true });
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fieldsToUpdate.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fieldsToUpdate.length === 0) {
      return this.getProject(projectId);
    }

    values.push(projectId);
    const query = `
      UPDATE projects
      SET ${fieldsToUpdate.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      if (result.rowCount === 0) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      // If the query returns rows, return the first row, otherwise return undefined.
      return result.rows ? result.rows[0] : undefined;
    } catch (error) {
       if (error.code === '23505') {
        throw new Error(`Project name already exists`);
      }
      throw error;
    }
  },

  /**
   * Generic execute method for AgentExecutor compatibility.
   * @param {Object} params - { action, ...actionParams }
   * @returns {Promise<any>} Result of the action
   */
  async execute(params) {
    const { action, ...actionParams } = params;
    
    switch (action) {
      case 'create':
        return this.createProject({
          name: actionParams.name,
          description: actionParams.description
        });
      case 'list':
        return this.listProjects();
      case 'get':
        return this.getProject(actionParams.projectId);
      case 'update':
        return this.updateProject(actionParams.projectId, actionParams.updates || actionParams);
      case 'delete':
        return this.deleteProject(actionParams.projectId);
      default:
        throw new Error(`Unknown ProjectTool action: ${action}`);
    }
  }
};

module.exports = ProjectTool;
