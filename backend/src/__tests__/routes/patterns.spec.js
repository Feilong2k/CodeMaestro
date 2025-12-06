const request = require('supertest');
// Mock pg before requiring app
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

const app = require('../../../index');
const db = require('../../../src/db/connection'); // This will use the mocked Pool

describe('Pattern Library API', () => {
  let createdPatternId;
  let pool;

  beforeAll(() => {
    pool = db.getPool();
  });

  beforeEach(() => {
    pool.query.mockReset();
  });

  // Cleanup after tests
  afterAll(async () => {
    await db.closePool();
  });

  describe('POST /api/patterns', () => {
    it('should create a new pattern', async () => {
      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, title: 'Test Pattern', solution: 'console.log("test")' }] 
      });

      const res = await request(app)
        .post('/api/patterns')
        .send({
          title: 'Test Pattern',
          solution: 'console.log("test")',
          problem: 'How to log?',
          tags: ['test', 'js']
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Pattern');
      
      createdPatternId = res.body.id;
    });

    it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/patterns')
        .send({ title: 'Missing Content' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/patterns', () => {
    it('should list patterns', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/patterns');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should search patterns by query', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/patterns?q=Test');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/patterns/:id', () => {
    it('should return a specific pattern', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, title: 'Found' }] });
      const idToGet = createdPatternId || 1;
      
      const res = await request(app).get(`/api/patterns/${idToGet}`);
      
      // We expect 200 OK
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 for non-existent pattern', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/patterns/999999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/patterns/:id', () => {
    it('should delete a pattern', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const idToDelete = createdPatternId || 1; 

      const res = await request(app).delete(`/api/patterns/${idToDelete}`);
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 if trying to delete non-existent pattern', async () => {
       pool.query.mockResolvedValueOnce({ rows: [] });
       const res = await request(app).delete('/api/patterns/999999');
       expect(res.statusCode).toBe(404);
    });
  });
});
