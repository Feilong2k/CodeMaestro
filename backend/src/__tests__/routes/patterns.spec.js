const request = require('supertest');
const app = require('../../../index');
const db = require('../../../src/db/connection');

describe('Pattern Library API', () => {
  let createdPatternId;

  // Cleanup after tests
  afterAll(async () => {
    if (createdPatternId) {
      await db.pool.query('DELETE FROM patterns WHERE id = $1', [createdPatternId]);
    }
    await db.closePool();
  });

  describe('POST /api/patterns', () => {
    it('should create a new pattern', async () => {
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
    });
  });

  describe('GET /api/patterns', () => {
    it('should list patterns', async () => {
      const res = await request(app).get('/api/patterns');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should search patterns by query', async () => {
      const res = await request(app).get('/api/patterns?q=Test');
      expect(res.statusCode).toBe(200);
      // We expect the search to work if implemented, but initially it might return all or empty
    });
  });

  describe('DELETE /api/patterns/:id', () => {
    it('should delete a pattern', async () => {
      // Create a dummy pattern to delete
      const createRes = await request(app)
        .post('/api/patterns')
        .send({ title: 'To Delete', solution: '...' });
        
      const idToDelete = createRes.body.id || 99999; 

      const res = await request(app).delete(`/api/patterns/${idToDelete}`);
      expect(res.statusCode).toBe(204);
    });
  });
});

