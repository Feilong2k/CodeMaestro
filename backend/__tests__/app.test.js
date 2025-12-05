const request = require('supertest');
const app = require('../index.js');

describe('Backend Scaffold Tests', () => {
  // Health endpoint
  describe('GET /api/health', () => {
    it('should return status "ok"', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);
      expect(res.body.status).toBe('ok'); // Changed from 'okay' to 'ok'
    });

    it('should return a message', async () => {
      const res = await request(app)
        .get('/api/health');
      expect(res.body.message).toBe('Backend is reachable');
    });
  });

  // CORS headers
  describe('CORS configuration', () => {
    it('should include CORS headers for frontend origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should allow GET, POST, PUT, DELETE, OPTIONS methods', async () => {
      const res = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:5173');
      const allowedMethods = res.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('DELETE');
      expect(allowedMethods).toContain('OPTIONS');
    });
  });

  // Server structure
  describe('Required directories', () => {
    const fs = require('fs');
    const path = require('path');
    it('should have a src/routes directory', () => {
      const dir = path.join(__dirname, '../src/routes');
      expect(fs.existsSync(dir)).toBe(true);
    });
    it('should have a src/services directory', () => {
      const dir = path.join(__dirname, '../src/services');
      expect(fs.existsSync(dir)).toBe(true);
    });
  });
});
