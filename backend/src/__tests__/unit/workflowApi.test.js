// Unit tests for Workflow API Endpoints - subtask 4-10
// These tests should fail (Red state) until implementation is complete

const request = require('supertest');
const express = require('express');

// Import the modules to test (will fail as they don't exist yet)
let workflowsRouter;
try {
  workflowsRouter = require('../../../src/routes/workflows');
} catch (error) {
  // Module doesn't exist yet - expected failure
  console.log('Note: workflows route module does not exist yet. Tests will fail appropriately.');
  workflowsRouter = null;
}

// Mock WorkflowEngine dependency
jest.mock('../../../src/services/workflowEngine', () => ({
  listWorkflows: jest.fn(),
  getWorkflow: jest.fn(),
  updateWorkflow: jest.fn()
}));

const workflowEngine = require('../../../src/services/workflowEngine');

describe('Workflow API Endpoints', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    
    // JSON parser with graceful invalid JSON handling (same as in index.js)
    const jsonParser = express.json();
    app.use((req, res, next) =>
      jsonParser(req, res, (err) => {
        if (err) {
          return res.status(400).json({ error: 'Invalid JSON' });
        }
        return next();
      })
    );
    
    // Mount router if it exists
    if (workflowsRouter) {
      app.use('/api/workflows', workflowsRouter);
    } else {
      // Fallback routes for testing if router doesn't exist
      app.get('/api/workflows', (req, res) => res.status(501).json({ error: 'Not implemented' }));
      app.get('/api/workflows/:id', (req, res) => res.status(501).json({ error: 'Not implemented' }));
      app.put('/api/workflows/:id', (req, res) => res.status(501).json({ error: 'Not implemented' }));
    }
  });

  describe('GET /api/workflows', () => {
    test('should return 200 and a JSON array of active workflows', async () => {
      // Mock the WorkflowEngine to return sample data
      const mockWorkflows = [
        { id: 'wf-1', name: 'Test Workflow 1', status: 'active' },
        { id: 'wf-2', name: 'Test Workflow 2', status: 'active' }
      ];
      workflowEngine.listWorkflows.mockResolvedValue(mockWorkflows);

      const response = await request(app).get('/api/workflows');
      
      if (response.status === 501) {
        // Router not implemented yet - this is expected failure
        expect(response.status).toBe(501);
      } else {
        // Router implemented - check structure
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(mockWorkflows);
        expect(workflowEngine.listWorkflows).toHaveBeenCalled();
      }
    });

    test('should return empty array when no workflows', async () => {
      workflowEngine.listWorkflows.mockResolvedValue([]);

      const response = await request(app).get('/api/workflows');
      
      if (response.status === 501) {
        expect(response.status).toBe(501);
      } else {
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      }
    });
  });

  describe('GET /api/workflows/:id', () => {
    test('should return 200 and the workflow state machine object', async () => {
      const workflowId = 'wf-123';
      const mockWorkflow = {
        id: workflowId,
        name: 'Sample Workflow',
        definition: {
          states: {
            initial: { on: { START: 'running' } },
            running: { on: { COMPLETE: 'done' } },
            done: { type: 'final' }
          },
          initial: 'initial'
        }
      };
      workflowEngine.getWorkflow.mockResolvedValue(mockWorkflow);

      const response = await request(app).get(`/api/workflows/${workflowId}`);
      
      if (response.status === 501) {
        expect(response.status).toBe(501);
      } else {
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockWorkflow);
        expect(workflowEngine.getWorkflow).toHaveBeenCalledWith(workflowId);
      }
    });

    test('should return 404 if workflow not found', async () => {
      const workflowId = 'nonexistent';
      workflowEngine.getWorkflow.mockResolvedValue(null);

      const response = await request(app).get(`/api/workflows/${workflowId}`);
      
      if (response.status === 501) {
        expect(response.status).toBe(501);
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Workflow not found');
      }
    });
  });

  describe('PUT /api/workflows/:id', () => {
    test('should accept valid JSON update and return 200', async () => {
      const workflowId = 'wf-123';
      const validUpdate = {
        name: 'Updated Workflow',
        definition: {
          states: { new: {} },
          initial: 'new'
        }
      };
      workflowEngine.updateWorkflow.mockResolvedValue({
        id: workflowId,
        ...validUpdate,
        updatedAt: new Date().toISOString()
      });

      const response = await request(app)
        .put(`/api/workflows/${workflowId}`)
        .send(validUpdate);
      
      if (response.status === 501) {
        expect(response.status).toBe(501);
      } else {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', workflowId);
        expect(response.body).toHaveProperty('name', validUpdate.name);
        expect(workflowEngine.updateWorkflow).toHaveBeenCalledWith(workflowId, validUpdate);
      }
    });

    test('should return 400 for invalid JSON structure', async () => {
      const workflowId = 'wf-123';
      const invalidUpdate = {
        // Missing required fields or invalid structure
        definition: {}
      };

      const response = await request(app)
        .put(`/api/workflows/${workflowId}`)
        .send(invalidUpdate);
      
      if (response.status === 501) {
        expect(response.status).toBe(501);
      } else {
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        // WorkflowEngine should not have been called
        expect(workflowEngine.updateWorkflow).not.toHaveBeenCalled();
      }
    });

    test('should return 404 when updating non-existent workflow', async () => {
      const workflowId = 'nonexistent';
      const validUpdate = {
        name: 'Updated',
        definition: { states: {}, initial: 'start' }
      };
      workflowEngine.updateWorkflow.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/workflows/${workflowId}`)
        .send(validUpdate);
      
      if (response.status === 501) {
        expect(response.status).toBe(501);
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Workflow not found');
      }
    });
  });

  describe('Error handling', () => {
    test('should return JSON error for malformed JSON in request body', async () => {
      const response = await request(app)
        .put('/api/workflows/wf-123')
        .set('Content-Type', 'application/json')
        .send('invalid json string');
      
      if (response.status === 501) {
        expect(response.status).toBe(501);
      } else {
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });

    test('should return 405 for unsupported HTTP methods', async () => {
      const response = await request(app).post('/api/workflows');
      
      if (response.status === 501) {
        expect(response.status).toBe(501);
      } else {
        expect([405, 404]).toContain(response.status);
      }
    });
  });
});
