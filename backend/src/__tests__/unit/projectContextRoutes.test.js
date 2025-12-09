const { describe, test, expect, beforeEach, jest } = require('@jest/globals');
const request = require('supertest');

// The app we're testing doesn't exist yet, so we'll try to import it and handle the error.
let app;
try {
  app = require('../../../index');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  app = {};
}

// Mock the ProjectContextService and MemoryExtractionService
jest.mock('../../../src/services/projectContextService', () => ({
  buildContext: jest.fn(),
}));

jest.mock('../../../src/services/memoryExtractionService', () => ({
  getExtractedMemories: jest.fn(),
  saveExtractedFacts: jest.fn(),
}));

const ProjectContextService = require('../../../src/services/projectContextService');
const MemoryExtractionService = require('../../../src/services/memoryExtractionService');

// Helper to ensure we have an app to test, otherwise skip the test.
function requireApp() {
  if (Object.keys(app).length === 0) {
    throw new Error('App module not found. Tests are expected to fail.');
  }
  return app;
}

describe('Project Context API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects/:id/context', () => {
    test('should return valid context structure', async () => {
      // Mock the ProjectContextService to return a sample context
      const mockContext = {
        project: { id: 1, name: 'Test Project' },
        techStack: { languages: ['JavaScript'] },
        structure: [],
        keyFiles: {},
        recentActivity: { recentChats: [] },
        extractedMemories: [],
      };
      ProjectContextService.buildContext.mockResolvedValue(mockContext);

      const response = await request(requireApp())
        .get('/api/projects/1/context');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContext);
      expect(ProjectContextService.buildContext).toHaveBeenCalledWith(1);
    });

    test('should return 404 when project not found', async () => {
      ProjectContextService.buildContext.mockResolvedValue(null);

      const response = await request(requireApp())
        .get('/api/projects/999/context');

      expect(response.status).toBe(404);
    });

    test('should handle service errors gracefully', async () => {
      ProjectContextService.buildContext.mockRejectedValue(new Error('DB error'));

      const response = await request(requireApp())
        .get('/api/projects/1/context');

      // Expect 500 or appropriate error status
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/projects/:id/context', () => {
    test('should update memory with provided facts', async () => {
      const mockFacts = [
        { key: 'tech_stack', value: 'Using Node.js' },
        { key: 'preference', value: 'User likes dark mode' },
      ];
      // Mock the service to resolve successfully
      MemoryExtractionService.saveExtractedFacts.mockResolvedValue();

      const response = await request(requireApp())
        .post('/api/projects/1/context')
        .send({ facts: mockFacts });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(MemoryExtractionService.saveExtractedFacts).toHaveBeenCalledWith(1, mockFacts);
    });

    test('should validate request body', async () => {
      // Missing facts array
      const response = await request(requireApp())
        .post('/api/projects/1/context')
        .send({});

      expect(response.status).toBe(400);
    });

    test('should handle service errors', async () => {
      MemoryExtractionService.saveExtractedFacts.mockRejectedValue(new Error('DB error'));

      const response = await request(requireApp())
        .post('/api/projects/1/context')
        .send({ facts: [] });

      expect(response.status).toBe(500);
    });
  });
});
