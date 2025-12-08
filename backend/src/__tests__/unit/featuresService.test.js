const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let FeaturesService;
try {
  FeaturesService = require('../../../src/services/FeaturesService');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  FeaturesService = {};
}

// Mock the database connection
jest.mock('../../../src/db/connection', () => ({
  query: jest.fn()
}));

const db = require('../../../src/db/connection');

// Helper to ensure we have a method to test, otherwise skip the test.
function requireFeaturesService() {
  if (Object.keys(FeaturesService).length === 0) {
    throw new Error('FeaturesService module not found. Tests are expected to fail.');
  }
  return FeaturesService;
}

describe('Features Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllFeatures()', () => {
    test('should return all features from the database', async () => {
      const service = requireFeaturesService();

      const mockFeatures = [
        { id: 1, title: 'AI Council', description: '...', priority: 'high' },
        { id: 2, title: 'Real-time Collaboration', description: '...', priority: 'medium' }
      ];
      db.query.mockResolvedValue({ rows: mockFeatures });

      const features = await service.getAllFeatures();

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.anything()
      );
      expect(features).toEqual(mockFeatures);
    });
  });

  describe('searchFeatures(query)', () => {
    test('should return features matching search query', async () => {
      const service = requireFeaturesService();

      const mockFeatures = [
        { id: 1, title: 'AI Council', description: '...' }
      ];
      db.query.mockResolvedValue({ rows: mockFeatures });

      const query = 'AI Council';
      const features = await service.searchFeatures(query);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([`%${query}%`])
      );
      expect(features).toEqual(mockFeatures);
    });

    test('should return empty array if no matches', async () => {
      const service = requireFeaturesService();

      db.query.mockResolvedValue({ rows: [] });

      const query = 'nonexistent';
      const features = await service.searchFeatures(query);

      expect(features).toEqual([]);
    });
  });

  describe('getFeatureById(id)', () => {
    test('should return a single feature by ID', async () => {
      const service = requireFeaturesService();

      const mockFeature = { id: 1, title: 'AI Council', description: '...' };
      db.query.mockResolvedValue({ rows: [mockFeature] });

      const feature = await service.getFeatureById(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([1])
      );
      expect(feature).toEqual(mockFeature);
    });

    test('should return null if feature not found', async () => {
      const service = requireFeaturesService();

      db.query.mockResolvedValue({ rows: [] });

      const feature = await service.getFeatureById(999);
      expect(feature).toBeNull();
    });
  });
});
