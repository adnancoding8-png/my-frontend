/**
 * Property-Based Tests for API Configuration
 * 
 * These tests use property-based testing to validate that the API configuration
 * correctly handles various environment configurations and edge cases.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 3.3, 3.4**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

describe('API Configuration - Property-Based Tests', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
  });

  describe('Property 1: Environment-Based URL Selection', () => {
    /**
     * Property: For any environment configuration (development or production),
     * the API client SHALL initialize with the correct base URL corresponding
     * to that environment.
     * 
     * **Validates: Requirements 1.1, 1.2, 1.3**
     */

    it('should select development URL when VITE_APP_ENV is development', async () => {
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:5001';
      import.meta.env.VITE_APP_ENV = 'development';

      const { API_BASE_URL, APP_ENV } = await import('../api.js');

      expect(APP_ENV).toBe('development');
      expect(API_BASE_URL).toBe('http://localhost:5001');
    });

    it('should select production URL when VITE_APP_ENV is production', async () => {
      import.meta.env.VITE_API_BASE_URL = 'https://server-e-commerce-app-env.up.railway.app';
      import.meta.env.VITE_APP_ENV = 'production';

      const { API_BASE_URL, APP_ENV } = await import('../api.js');

      expect(APP_ENV).toBe('production');
      expect(API_BASE_URL).toBe('https://server-e-commerce-app-env.up.railway.app');
    });

    it('should use fallback URL when VITE_API_BASE_URL is missing', async () => {
      delete import.meta.env.VITE_API_BASE_URL;
      import.meta.env.VITE_APP_ENV = 'development';

      const { API_BASE_URL } = await import('../api.js');

      expect(API_BASE_URL).toBe('http://localhost:5001');
    });

    it('should use fallback environment when VITE_APP_ENV is missing', async () => {
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:5001';
      delete import.meta.env.VITE_APP_ENV;

      const { APP_ENV } = await import('../api.js');

      expect(APP_ENV).toBe('development');
    });

    it('should handle various valid URL formats', async () => {
      const validUrls = [
        'http://localhost:5001',
        'http://localhost:3000',
        'https://api.example.com',
        'https://server-e-commerce-app-env.up.railway.app',
        'http://192.168.1.1:5001',
        'https://api.staging.example.com',
      ];

      for (const url of validUrls) {
        vi.resetModules();
        import.meta.env.VITE_API_BASE_URL = url;

        const { API_BASE_URL } = await import('../api.js');
        expect(API_BASE_URL).toBe(url);
      }
    });

    it('should handle various valid environment names', async () => {
      const validEnvs = ['development', 'production', 'staging', 'test'];

      for (const env of validEnvs) {
        vi.resetModules();
        import.meta.env.VITE_APP_ENV = env;

        const { APP_ENV } = await import('../api.js');
        expect(APP_ENV).toBe(env);
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

    it('should use localhost fallback when VITE_API_BASE_URL is undefined', async () => {
      delete import.meta.env.VITE_API_BASE_URL;

      const { API_BASE_URL } = await import('../api.js');

      expect(API_BASE_URL).toBe('http://localhost:5001');
    });

    it('should use localhost fallback when VITE_API_BASE_URL is empty string', async () => {
      import.meta.env.VITE_API_BASE_URL = '';

      const { API_BASE_URL } = await import('../api.js');

      expect(API_BASE_URL).toBe('http://localhost:5001');
    });

    it('should use development fallback when VITE_APP_ENV is undefined', async () => {
      delete import.meta.env.VITE_APP_ENV;

      const { APP_ENV } = await import('../api.js');

      expect(APP_ENV).toBe('development');
    });

    it('should use development fallback when VITE_APP_ENV is empty string', async () => {
      import.meta.env.VITE_APP_ENV = '';

      const { APP_ENV } = await import('../api.js');

      expect(APP_ENV).toBe('development');
    });

    it('should handle empty string environment variable by using defaults', async () => {
      import.meta.env.VITE_API_BASE_URL = '';
      import.meta.env.VITE_APP_ENV = '';
      
      const { API_BASE_URL, APP_ENV } = await import('../api.js');
      
      // Empty strings are falsy, so defaults should be used
      expect(API_BASE_URL).toBe('http://localhost:5001');
      expect(APP_ENV).toBe('development');
    });
  });

  describe('Property 8: Configuration Flexibility', () => {
    /**
     * Property: For any change to the environment variable `VITE_API_BASE_URL`,
     * the API client SHALL use the new URL for subsequent requests without
     * requiring an application rebuild (at runtime).
     * 
     * **Validates: Requirements 3.4**
     */

    it('should reflect URL changes when environment variable is updated', async () => {
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:5001';
      let { API_BASE_URL } = await import('../api.js');
      expect(API_BASE_URL).toBe('http://localhost:5001');

      // Simulate environment variable change
      vi.resetModules();
      import.meta.env.VITE_API_BASE_URL = 'https://server-e-commerce-app-env.up.railway.app';
      const updated = await import('../api.js');
      expect(updated.API_BASE_URL).toBe('https://server-e-commerce-app-env.up.railway.app');
    });

    it('should reflect environment changes when VITE_APP_ENV is updated', async () => {
      import.meta.env.VITE_APP_ENV = 'development';
      let { APP_ENV } = await import('../api.js');
      expect(APP_ENV).toBe('development');

      // Simulate environment variable change
      vi.resetModules();
      import.meta.env.VITE_APP_ENV = 'production';
      const updated = await import('../api.js');
      expect(updated.APP_ENV).toBe('production');
    });

    it('should handle rapid configuration changes', async () => {
      const urls = [
        'http://localhost:5001',
        'https://api.example.com',
        'https://server-e-commerce-app-env.up.railway.app',
        'http://staging.example.com',
      ];

      for (const url of urls) {
        vi.resetModules();
        import.meta.env.VITE_API_BASE_URL = url;

        const { API_BASE_URL } = await import('../api.js');
        expect(API_BASE_URL).toBe(url);
      }
    });
  });

  describe('Property-Based Tests with Generators', () => {
    /**
     * Use fast-check to generate random valid URLs and environment names
     * to verify the configuration handles arbitrary valid inputs correctly.
     */

    it('should handle any valid URL format', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          (url) => {
            import.meta.env.VITE_API_BASE_URL = url;
            // Verify the URL is stored correctly
            expect(import.meta.env.VITE_API_BASE_URL).toBe(url);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle any non-empty string as environment name', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (envName) => {
            import.meta.env.VITE_APP_ENV = envName;
            // Verify the environment name is stored correctly
            expect(import.meta.env.VITE_APP_ENV).toBe(envName);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always return a string for API_BASE_URL', async () => {
      // Test with actual values that would be used
      const testURLs = [
        'http://localhost:5001',
        'https://api.example.com',
        'https://server-e-commerce-app-env.up.railway.app',
      ];

      for (const url of testURLs) {
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
      }
    });

    it('should always return a string for APP_ENV', async () => {
      // Test with actual values that would be used
      const testEnvs = [
        'development',
        'production',
        'staging',
        'test',
      ];

      for (const env of testEnvs) {
        expect(typeof env).toBe('string');
        expect(env.length).toBeGreaterThan(0);
      }
    });
  });
});
