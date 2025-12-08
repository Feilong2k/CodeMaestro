const { describe, test, expect, beforeEach } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let ProjectTool;
try {
  ProjectTool = require('../../../src/tools/ProjectTool');
} catch (error) {
  console.error('Failed to load ProjectTool:', error);
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  ProjectTool = {};
}

// Mock the database connection
jest.mock('../../../src/db/connection', () => ({
  query: jest.fn()
}));

// Mock the fs module for directory operations
jest.mock('fs', () => ({
  mkdirSync: jest.fn(),
  existsSync: jest.fn()
}));

const db = require('../../../src/db/connection');
const fs = require('fs');

// Helper to ensure we have a method to test, otherwise skip the test.
function requireProjectTool() {
  if (Object.keys(ProjectTool).length === 0) {
    throw new Error('ProjectTool module not found. Tests are expected to fail.');
  }
  return ProjectTool;
}

describe('Project Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject(projectData)', () => {
    test('should insert project into database and create directory', async () => {
      const tool = requireProjectTool();

      // Mock database query to return a new project ID
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });
      // Mock fs.existsSync to return false (directory doesn't exist)
      fs.existsSync.mockReturnValue(false);

      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        path: 'projects/test-project'
      };

      // We expect the tool to return the created project
      const result = await tool.createProject(projectData);

      // Should call database insert with correct fields
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([projectData.name, projectData.description, projectData.path])
      );
      // Should create directory if it doesn't exist
      expect(fs.mkdirSync).toHaveBeenCalledWith(projectData.path, { recursive: true });
    });

    test('should handle duplicate project names gracefully', async () => {
      const tool = requireProjectTool();

      // Mock database query to throw duplicate key error
      db.query.mockRejectedValue({ code: '23505' }); // PostgreSQL unique violation

      const projectData = {
        name: 'Duplicate Project',
        description: 'Duplicate',
        path: 'projects/duplicate'
      };

      // Should throw or return error
      await expect(tool.createProject(projectData)).rejects.toThrow(/duplicate|already exists/i);
    });
  });

  describe('deleteProject(projectId)', () => {
    test('should soft delete project (set status = "deleted")', async () => {
      const tool = requireProjectTool();

      db.query.mockResolvedValue({ rowCount: 1 });

      const projectId = 42;
      await tool.deleteProject(projectId);

      // Should update status to 'deleted' rather than hard delete
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['deleted', projectId])
      );
    });

    test('should not delete non-existent project', async () => {
      const tool = requireProjectTool();

      db.query.mockResolvedValue({ rowCount: 0 });

      const projectId = 999;
      // Should throw or return false
      await expect(tool.deleteProject(projectId)).rejects.toThrow(/not found/i);
    });
  });

  describe('listProjects()', () => {
    test('should return only active projects (excluding deleted)', async () => {
      const tool = requireProjectTool();

      const mockProjects = [
        { id: 1, name: 'Active Project 1', status: 'active' },
        { id: 2, name: 'Active Project 2', status: 'active' }
      ];
      db.query.mockResolvedValue({ rows: mockProjects });

      const projects = await tool.listProjects();

      // Should query with status filter
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['active'])
      );
      expect(projects).toEqual(mockProjects);
    });

    test('should return empty array if no active projects', async () => {
      const tool = requireProjectTool();

      db.query.mockResolvedValue({ rows: [] });

      const projects = await tool.listProjects();
      expect(projects).toEqual([]);
    });
  });

  describe('getProject(projectId)', () => {
    test('should return project details', async () => {
      const tool = requireProjectTool();

      const mockProject = { id: 1, name: 'Test Project', status: 'active' };
      db.query.mockResolvedValue({ rows: [mockProject] });

      const project = await tool.getProject(1);
      expect(project).toEqual(mockProject);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([1])
      );
    });

    test('should return null for non-existent project', async () => {
      const tool = requireProjectTool();

      db.query.mockResolvedValue({ rows: [] });

      const project = await tool.getProject(999);
      expect(project).toBeNull();
    });
  });

  describe('updateProject(projectId, updates)', () => {
    test('should update project fields', async () => {
      const tool = requireProjectTool();

      db.query.mockResolvedValue({ rowCount: 1 });

      const projectId = 1;
      const updates = { name: 'Updated Name', description: 'New description' };
      await tool.updateProject(projectId, updates);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([updates.name, updates.description, projectId])
      );
    });
  });
});
