const { describe, test, expect, beforeEach } = require('@jest/globals');
const request = require('supertest');

// The app we're testing doesn't exist yet, so we'll try to import it and handle the error.
let app;
try {
  app = require('../../../index');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  app = {};
}

// Mock the database connection
jest.mock('../../../src/db/connection', () => ({
  query: jest.fn()
}));

const db = require('../../../src/db/connection');

// Helper to ensure we have an app to test, otherwise skip the test.
function requireApp() {
  if (Object.keys(app).length === 0) {
    throw new Error('App module not found. Tests are expected to fail.');
  }
  return app;
}

describe('Tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    test('should return tasks with pagination', async () => {
      const mockTasks = [
        { id: 1, type: 'test', status: 'pending' },
        { id: 2, type: 'test', status: 'completed' },
      ];
      db.query.mockResolvedValue({ rows: mockTasks });

      const response = await request(requireApp())
        .get('/api/tasks')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTasks);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), expect.anything());
    });

    test('should filter by status', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await request(requireApp())
        .get('/api/tasks')
        .query({ status: 'pending' });

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE status'), expect.arrayContaining(['pending']));
    });
  });

  describe('GET /api/tasks/stats', () => {
    test('should return counts by status', async () => {
      const mockStats = [
        { status: 'pending', count: 5 },
        { status: 'running', count: 2 },
        { status: 'completed', count: 10 },
        { status: 'failed', count: 1 },
      ];
      db.query.mockResolvedValue({ rows: mockStats });

      const response = await request(requireApp()).get('/api/tasks/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
    });
  });

  describe('POST /api/tasks/:id/retry', () => {
    test('should reset task to pending', async () => {
      db.query.mockResolvedValue({ rowCount: 1 });

      const response = await request(requireApp())
        .post('/api/tasks/1/retry');

      expect(response.status).toBe(200);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(["1"])
      );
    });

    test('should return 404 if task not found', async () => {
      db.query.mockResolvedValue({ rowCount: 0 });

      const response = await request(requireApp())
        .post('/api/tasks/999/retry');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    test('should remove task', async () => {
      db.query.mockResolvedValue({ rowCount: 1 });

      const response = await request(requireApp())
        .delete('/api/tasks/1');

      expect(response.status).toBe(204);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(["1"])
      );
    });

    test('should return 404 if task not found', async () => {
      db.query.mockResolvedValue({ rowCount: 0 });

      const response = await request(requireApp())
        .delete('/api/tasks/999');

      expect(response.status).toBe(404);
    });
  });
});
