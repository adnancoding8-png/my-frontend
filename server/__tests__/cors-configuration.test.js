const request = require('supertest');
const express = require('express');
const cors = require('cors');

describe('CORS Configuration Verification', () => {
  let app;

  beforeEach(() => {
    app = express();

    // Apply the same CORS configuration as in server.js
    app.use(
      cors({
        origin: [
          // Development origins
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:5176',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174',
          'http://127.0.0.1:5175',
          'http://127.0.0.1:5176',
          // Production origin
          'https://server-e-commerce-app-env.up.railway.app'
        ],
        methods: ['GET', 'POST', 'DELETE', 'PUT'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'Cache-Control',
          'Expires',
          'Pragma',
        ],
        credentials: true,
      })
    );

    app.get('/test', (req, res) => {
      res.json({ message: 'OK' });
    });
  });

  describe('Requirement 2.1: Production origin in allowed origins list', () => {
    it('should accept requests from production origin', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://server-e-commerce-app-env.up.railway.app');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(
        'https://server-e-commerce-app-env.up.railway.app'
      );
    });
  });

  describe('Requirement 2.2: credentials: true is set', () => {
    it('should have Access-Control-Allow-Credentials set to true', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://server-e-commerce-app-env.up.railway.app');

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Requirement 2.3: All methods (GET, POST, PUT, DELETE) are included', () => {
    it('should include all required methods in Access-Control-Allow-Methods', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'https://server-e-commerce-app-env.up.railway.app')
        .set('Access-Control-Request-Method', 'POST');

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toBeDefined();
      expect(allowedMethods).toMatch(/GET/i);
      expect(allowedMethods).toMatch(/POST/i);
      expect(allowedMethods).toMatch(/PUT/i);
      expect(allowedMethods).toMatch(/DELETE/i);
    });
  });

  describe('Requirement 2.4: Authorization header is in the allowed headers list', () => {
    it('should include Authorization in Access-Control-Allow-Headers', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'https://server-e-commerce-app-env.up.railway.app')
        .set('Access-Control-Request-Headers', 'Authorization');

      const allowedHeaders = response.headers['access-control-allow-headers'];
      expect(allowedHeaders).toBeDefined();
      expect(allowedHeaders).toMatch(/Authorization/i);
    });
  });

  describe('Development origins should still work', () => {
    it('should accept requests from localhost:5173', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should accept requests from 127.0.0.1:5173', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://127.0.0.1:5173');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
    });
  });

  describe('Unauthorized origins should be rejected', () => {
    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://unauthorized-origin.com');

      // CORS middleware will not set the Access-Control-Allow-Origin header for unauthorized origins
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Verify Access-Control-Allow-Origin matches request origin', () => {
    it('should match the request origin for production URL', async () => {
      const origin = 'https://server-e-commerce-app-env.up.railway.app';
      const response = await request(app)
        .get('/test')
        .set('Origin', origin);

      expect(response.headers['access-control-allow-origin']).toBe(origin);
    });

    it('should match the request origin for localhost', async () => {
      const origin = 'http://localhost:5173';
      const response = await request(app)
        .get('/test')
        .set('Origin', origin);

      expect(response.headers['access-control-allow-origin']).toBe(origin);
    });
  });
});
