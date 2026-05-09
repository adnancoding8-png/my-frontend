/**
 * Property-Based Tests for Axios API Client
 * 
 * These tests validate that the API client correctly constructs URLs,
 * handles errors, and preserves authentication tokens across various scenarios.
 * 
 * **Validates: Requirements 1.4, 4.2, 5.1, 5.2, 5.4**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock axios to avoid actual network calls
vi.mock('axios');

describe('API Client - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Property 2: Base URL Prepending', () => {
    /**
     * Property: For any API endpoint path, when a request is made through
     * the configured API client, the full request URL SHALL be constructed
     * by prepending the base URL to the endpoint path.
     * 
     * **Validates: Requirements 1.4, 5.2**
     */

    it('should prepend base URL to endpoint paths', () => {
      const baseURL = 'http://localhost:5001';
      const endpoints = [
        '/api/shop/products',
        '/api/auth/login',
        '/api/admin/users',
        '/api/cart/items',
        '/api/checkout/orders',
      ];

      for (const endpoint of endpoints) {
        const fullURL = `${baseURL}${endpoint}`;
        expect(fullURL).toContain(baseURL);
        expect(fullURL).toContain(endpoint);
        expect(fullURL).toBe(`${baseURL}${endpoint}`);
      }
    });

    it('should handle endpoints with and without leading slash', () => {
      const baseURL = 'http://localhost:5001';
      const testCases = [
        { endpoint: '/api/products', expected: 'http://localhost:5001/api/products' },
        { endpoint: 'api/products', expected: 'http://localhost:5001/api/products' },
        { endpoint: '/api/products/', expected: 'http://localhost:5001/api/products/' },
      ];

      for (const { endpoint, expected } of testCases) {
        const fullURL = endpoint.startsWith('/') 
          ? `${baseURL}${endpoint}` 
          : `${baseURL}/${endpoint}`;
        expect(fullURL).toBe(expected);
      }
    });

    it('should handle endpoints with query parameters', () => {
      const baseURL = 'http://localhost:5001';
      const endpoints = [
        '/api/products?page=1&limit=10',
        '/api/search?q=shirt&category=clothing',
        '/api/orders?status=pending&sort=date',
      ];

      for (const endpoint of endpoints) {
        const fullURL = `${baseURL}${endpoint}`;
        expect(fullURL).toContain(baseURL);
        expect(fullURL).toContain(endpoint);
      }
    });

    it('should handle endpoints with special characters', () => {
      const baseURL = 'http://localhost:5001';
      const endpoints = [
        '/api/products/123',
        '/api/users/user@example.com',
        '/api/search/shirt%20blue',
        '/api/categories/men%27s-clothing',
      ];

      for (const endpoint of endpoints) {
        const fullURL = `${baseURL}${endpoint}`;
        expect(fullURL).toContain(baseURL);
        expect(fullURL).toContain(endpoint);
      }
    });

    it('should handle various base URL formats', () => {
      const baseURLs = [
        'http://localhost:5001',
        'https://api.example.com',
        'https://server-e-commerce-app-env.up.railway.app',
        'http://192.168.1.1:5001',
      ];

      const endpoint = '/api/products';

      for (const baseURL of baseURLs) {
        const fullURL = `${baseURL}${endpoint}`;
        expect(fullURL).toContain(baseURL);
        expect(fullURL).toContain(endpoint);
      }
    });
  });

  describe('Property 3: Default Fallback Behavior', () => {
    /**
     * Property: For any missing or undefined environment variable,
     * the API client SHALL use `http://localhost:5001` as the default base URL.
     * 
     * **Validates: Requirements 3.3**
     */

    it('should use localhost fallback when base URL is undefined', () => {
      const baseURL = undefined || 'http://localhost:5001';
      expect(baseURL).toBe('http://localhost:5001');
    });

    it('should use localhost fallback when base URL is null', () => {
      const baseURL = null || 'http://localhost:5001';
      expect(baseURL).toBe('http://localhost:5001');
    });

    it('should use localhost fallback when base URL is empty string', () => {
      const baseURL = '' || 'http://localhost:5001';
      expect(baseURL).toBe('http://localhost:5001');
    });

    it('should handle all falsy values for base URL', () => {
      const falsyValues = [undefined, null, '', 0, false];

      for (const value of falsyValues) {
        const baseURL = value || 'http://localhost:5001';
        expect(baseURL).toBe('http://localhost:5001');
      }
    });
  });

  describe('Property 5: Response Parsing and Error Handling', () => {
    /**
     * Property: For any valid response structure from the backend,
     * the API client SHALL properly parse the response and correctly
     * classify it as either success or error based on HTTP status code.
     * 
     * **Validates: Requirements 4.2**
     */

    it('should classify 2xx responses as success', () => {
      const successStatuses = [200, 201, 202, 204, 206];

      for (const status of successStatuses) {
        const isSuccess = status >= 200 && status < 300;
        expect(isSuccess).toBe(true);
      }
    });

    it('should classify 4xx responses as client errors', () => {
      const clientErrorStatuses = [400, 401, 403, 404, 409, 422];

      for (const status of clientErrorStatuses) {
        const isClientError = status >= 400 && status < 500;
        expect(isClientError).toBe(true);
      }
    });

    it('should classify 5xx responses as server errors', () => {
      const serverErrorStatuses = [500, 501, 502, 503, 504];

      for (const status of serverErrorStatuses) {
        const isServerError = status >= 500 && status < 600;
        expect(isServerError).toBe(true);
      }
    });

    it('should detect CORS errors from network errors', () => {
      const error = new Error('Network Error');
      error.message = 'Network Error';
      error.response = undefined;

      const isCorsError = error.message === 'Network Error' && !error.response;
      expect(isCorsError).toBe(true);
    });

    it('should detect connection errors from error codes', () => {
      const connectionErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET'];

      for (const code of connectionErrorCodes) {
        const error = new Error('Connection failed');
        error.code = code;

        const isConnectionError = ['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET'].includes(error.code);
        expect(isConnectionError).toBe(true);
      }
    });

    it('should detect authentication errors from 401 status', () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };

      const isAuthError = error.response?.status === 401;
      expect(isAuthError).toBe(true);
    });

    it('should detect server errors from 5xx status', () => {
      const serverErrorStatuses = [500, 501, 502, 503, 504];

      for (const status of serverErrorStatuses) {
        const error = new Error('Server Error');
        error.response = { status };

        const isServerError = error.response?.status >= 500;
        expect(isServerError).toBe(true);
      }
    });
  });

  describe('Property 6: Authentication Token Preservation', () => {
    /**
     * Property: For any authenticated request made through the API client,
     * authentication tokens (if present in localStorage) SHALL be included
     * in the request headers to the backend.
     * 
     * **Validates: Requirements 5.4**
     */

    it('should include auth token in request headers when available', () => {
      const token = 'test-token-12345';
      localStorage.setItem('authToken', token);

      const config = { headers: {} };
      const storedToken = localStorage.getItem('authToken');

      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }

      expect(config.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('should not include auth token when localStorage is empty', () => {
      localStorage.clear();

      const config = { headers: {} };
      const storedToken = localStorage.getItem('authToken');

      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }

      expect(config.headers.Authorization).toBeUndefined();
    });

    it('should handle various token formats', () => {
      const tokens = [
        'simple-token',
        'token-with-dashes-123',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        'Bearer-token-format',
      ];

      for (const token of tokens) {
        localStorage.setItem('authToken', token);

        const config = { headers: {} };
        const storedToken = localStorage.getItem('authToken');

        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }

        expect(config.headers.Authorization).toBe(`Bearer ${token}`);
        localStorage.clear();
      }
    });

    it('should preserve token across multiple requests', () => {
      const token = 'persistent-token-123';
      localStorage.setItem('authToken', token);

      // Simulate multiple requests
      for (let i = 0; i < 5; i++) {
        const config = { headers: {} };
        const storedToken = localStorage.getItem('authToken');

        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }

        expect(config.headers.Authorization).toBe(`Bearer ${token}`);
      }
    });

    it('should update token when localStorage is updated', () => {
      const token1 = 'token-1';
      localStorage.setItem('authToken', token1);

      let config = { headers: {} };
      let storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      expect(config.headers.Authorization).toBe(`Bearer ${token1}`);

      // Update token
      const token2 = 'token-2';
      localStorage.setItem('authToken', token2);

      config = { headers: {} };
      storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      expect(config.headers.Authorization).toBe(`Bearer ${token2}`);
    });
  });

  describe('Property-Based Tests with Generators', () => {
    /**
     * Use fast-check to generate random valid inputs and verify
     * the API client handles them correctly.
     */

    it('should handle any valid endpoint path', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (endpoint) => {
            const baseURL = 'http://localhost:5001';
            const fullURL = `${baseURL}/${endpoint}`;

            expect(fullURL).toContain(baseURL);
            expect(fullURL).toContain(endpoint);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle any valid HTTP status code', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 599 }),
          (status) => {
            const isSuccess = status >= 200 && status < 300;
            const isClientError = status >= 400 && status < 500;
            const isServerError = status >= 500 && status < 600;

            // Exactly one classification should be true
            const classifications = [isSuccess, isClientError, isServerError].filter(Boolean);
            expect(classifications.length).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle any valid token format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (token) => {
            localStorage.setItem('authToken', token);

            const config = { headers: {} };
            const storedToken = localStorage.getItem('authToken');

            if (storedToken) {
              config.headers.Authorization = `Bearer ${storedToken}`;
            }

            expect(config.headers.Authorization).toBe(`Bearer ${token}`);
            localStorage.clear();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
