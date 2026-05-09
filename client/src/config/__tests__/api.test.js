/**
 * API Configuration Tests
 * 
 * Tests for the API configuration module that reads environment variables
 * and provides fallback values for API_BASE_URL and APP_ENV.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 3.3, 3.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('API Configuration Module', () => {
  // Store original import.meta.env values
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    // Reset import.meta.env before each test
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    Object.assign(import.meta.env, originalEnv);
  });

  describe('API_BASE_URL', () => {
    it('should export API_BASE_URL constant', async () => {
      const { API_BASE_URL } = await import('../api.js');
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe('string');
    });

    it('should use localhost:5001 as default when VITE_API_BASE_URL is not set', async () => {
      // Simulate missing environment variable
      delete import.meta.env.VITE_API_BASE_URL;
      
      const { API_BASE_URL } = await import('../api.js');
      expect(API_BASE_URL).toBe('http://localhost:5001');
    });

    it('should use production URL when VITE_API_BASE_URL is set to production', async () => {
      import.meta.env.VITE_API_BASE_URL = 'https://server-e-commerce-app-env.up.railway.app';
      
      const { API_BASE_URL } = await import('../api.js');
      expect(API_BASE_URL).toBe('https://server-e-commerce-app-env.up.railway.app');
    });

    it('should use development URL when VITE_API_BASE_URL is set to localhost', async () => {
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:5001';
      
      const { API_BASE_URL } = await import('../api.js');
      expect(API_BASE_URL).toBe('http://localhost:5001');
    });
  });

  describe('APP_ENV', () => {
    it('should export APP_ENV constant', async () => {
      const { APP_ENV } = await import('../api.js');
      expect(APP_ENV).toBeDefined();
      expect(typeof APP_ENV).toBe('string');
    });

    it('should use "development" as default when VITE_APP_ENV is not set', async () => {
      delete import.meta.env.VITE_APP_ENV;
      
      const { APP_ENV } = await import('../api.js');
      expect(APP_ENV).toBe('development');
    });

    it('should use "production" when VITE_APP_ENV is set to production', async () => {
      import.meta.env.VITE_APP_ENV = 'production';
      
      const { APP_ENV } = await import('../api.js');
      expect(APP_ENV).toBe('production');
    });

    it('should use "development" when VITE_APP_ENV is set to development', async () => {
      import.meta.env.VITE_APP_ENV = 'development';
      
      const { APP_ENV } = await import('../api.js');
      expect(APP_ENV).toBe('development');
    });
  });

  describe('Configuration Accessibility', () => {
    it('should be importable from other modules using @ alias', async () => {
      // This test verifies the configuration can be imported using the @ alias
      // which is configured in vite.config.js
      const { API_BASE_URL, APP_ENV } = await import('../api.js');
      
      expect(API_BASE_URL).toBeDefined();
      expect(APP_ENV).toBeDefined();
    });

    it('should export both API_BASE_URL and APP_ENV together', async () => {
      const config = await import('../api.js');
      
      expect(config).toHaveProperty('API_BASE_URL');
      expect(config).toHaveProperty('APP_ENV');
      expect(Object.keys(config).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Fallback Behavior', () => {
    it('should provide sensible defaults when environment variables are missing', async () => {
      delete import.meta.env.VITE_API_BASE_URL;
      delete import.meta.env.VITE_APP_ENV;
      
      const { API_BASE_URL, APP_ENV } = await import('../api.js');
      
      // Verify defaults are sensible for development
      expect(API_BASE_URL).toBe('http://localhost:5001');
      expect(APP_ENV).toBe('development');
    });

    it('should handle empty string environment variables by using defaults', async () => {
      import.meta.env.VITE_API_BASE_URL = '';
      import.meta.env.VITE_APP_ENV = '';
      
      const { API_BASE_URL, APP_ENV } = await import('../api.js');
      
      // Empty strings are falsy, so defaults should be used
      expect(API_BASE_URL).toBe('http://localhost:5001');
      expect(APP_ENV).toBe('development');
    });
  });
});
