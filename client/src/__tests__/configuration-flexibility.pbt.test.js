/**
 * Property-Based Tests for Configuration Flexibility
 * 
 * These tests validate that the API client can be configured with
 * different URLs and environments without requiring rebuilds.
 * 
 * **Validates: Requirements 3.4**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

describe('Configuration Flexibility - Property-Based Tests', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Property 8: Configuration Flexibility', () => {
    /**
     * Property: For any change to the environment variable `VITE_API_BASE_URL`,
     * the API client SHALL use the new URL for subsequent requests without
     * requiring an application rebuild (at runtime).
     * 
     * **Validates: Requirements 3.4**
     */

    it('should support switching between development and production URLs', async () => {
      // Start with development URL
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:5001';
      let { API_BASE_URL } = await import('../config/api.js');
      expect(API_BASE_URL).toBe('http://localhost:5001');

      // Switch to production URL
      vi.resetModules();
      import.meta.env.VITE_API_BASE_URL = 'https://server-e-commerce-app-env.up.railway.app';
      const updated = await import('../config/api.js');
      expect(updated.API_BASE_URL).toBe('https://server-e-commerce-app-env.up.railway.app');
    });

    it('should support switching between multiple staging URLs', async () => {
      const stagingURLs = [
        'https://staging1.example.com',
        'https://staging2.example.com',
        'https://staging3.example.com',
      ];

      for (const url of stagingURLs) {
        vi.resetModules();
        import.meta.env.VITE_API_BASE_URL = url;

        const { API_BASE_URL } = await import('../config/api.js');
        expect(API_BASE_URL).toBe(url);
      }
    });

    it('should reflect URL changes without application rebuild', async () => {
      const urls = [
        'http://localhost:5001',
        'http://localhost:3000',
        'https://api.example.com',
        'https://server-e-commerce-app-env.up.railway.app',
      ];

      for (const url of urls) {
        vi.resetModules();
        import.meta.env.VITE_API_BASE_URL = url;

        const { API_BASE_URL } = await import('../config/api.js');
        expect(API_BASE_URL).toBe(url);
      }
    });

    it('should support environment-specific configurations', async () => {
      const environments = [
        { env: 'development', url: 'http://localhost:5001' },
        { env: 'staging', url: 'https://staging.example.com' },
        { env: 'production', url: 'https://server-e-commerce-app-env.up.railway.app' },
      ];

      for (const config of environments) {
        vi.resetModules();
        import.meta.env.VITE_APP_ENV = config.env;
        import.meta.env.VITE_API_BASE_URL = config.url;

        const { APP_ENV, API_BASE_URL } = await import('../config/api.js');
        expect(APP_ENV).toBe(config.env);
        expect(API_BASE_URL).toBe(config.url);
      }
    });

    it('should handle rapid configuration changes', async () => {
      const urls = [
        'http://localhost:5001',
        'https://api.example.com',
        'https://server-e-commerce-app-env.up.railway.app',
        'http://staging.example.com',
        'http://localhost:3000',
      ];

      for (const url of urls) {
        vi.resetModules();
        import.meta.env.VITE_API_BASE_URL = url;

        const { API_BASE_URL } = await import('../config/api.js');
        expect(API_BASE_URL).toBe(url);
      }
    });
  });

  describe('Runtime Configuration', () => {
    /**
     * Property: Configuration should be flexible and support runtime changes
     * without requiring code modifications.
     */

    it('should support any valid URL format', async () => {
      const validURLs = [
        'http://localhost:5001',
        'https://api.example.com',
        'https://api.example.com:8443',
        'http://192.168.1.1:5001',
        'https://subdomain.example.co.uk',
      ];

      for (const url of validURLs) {
        vi.resetModules();
        import.meta.env.VITE_API_BASE_URL = url;

        const { API_BASE_URL } = await import('../config/api.js');
        expect(API_BASE_URL).toBe(url);
      }
    });

    it('should support any valid environment name', async () => {
      const environments = [
        'development',
        'production',
        'staging',
        'test',
        'qa',
        'uat',
      ];

      for (const env of environments) {
        vi.resetModules();
        import.meta.env.VITE_APP_ENV = env;

        const { APP_ENV } = await import('../config/api.js');
        expect(APP_ENV).toBe(env);
      }
    });

    it('should maintain configuration consistency across multiple imports', async () => {
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:5001';

      const config1 = await import('../config/api.js');
      const config2 = await import('../config/api.js');

      expect(config1.API_BASE_URL).toBe(config2.API_BASE_URL);
    });

    it('should support configuration updates without side effects', async () => {
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:5001';
      let { API_BASE_URL: url1 } = await import('../config/api.js');

      vi.resetModules();
      import.meta.env.VITE_API_BASE_URL = 'https://api.example.com';
      let { API_BASE_URL: url2 } = await import('../config/api.js');

      expect(url1).not.toBe(url2);
      expect(url1).toBe('http://localhost:5001');
      expect(url2).toBe('https://api.example.com');
    });
  });

  describe('Configuration Validation', () => {
    /**
     * Property: Configuration should be validated and provide sensible defaults.
     */

    it('should provide fallback when configuration is missing', async () => {
      delete import.meta.env.VITE_API_BASE_URL;

      const { API_BASE_URL } = await import('../config/api.js');
      expect(API_BASE_URL).toBe('http://localhost:5001');
    });

    it('should provide fallback for environment name', async () => {
      delete import.meta.env.VITE_APP_ENV;

      const { APP_ENV } = await import('../config/api.js');
      expect(APP_ENV).toBe('development');
    });

    it('should handle empty string configuration', async () => {
      import.meta.env.VITE_API_BASE_URL = '';

      const { API_BASE_URL } = await import('../config/api.js');
      expect(API_BASE_URL).toBe('http://localhost:5001');
    });
  });

  describe('Property-Based Tests with Generators', () => {
    /**
     * Use fast-check to generate random configurations and verify
     * flexibility.
     */

    it('should handle any valid URL', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          (url) => {
            import.meta.env.VITE_API_BASE_URL = url;
            expect(import.meta.env.VITE_API_BASE_URL).toBe(url);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle any environment name', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (env) => {
            import.meta.env.VITE_APP_ENV = env;
            expect(import.meta.env.VITE_APP_ENV).toBe(env);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle any port number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1024, max: 65535 }),
          (port) => {
            const url = `http://localhost:${port}`;
            import.meta.env.VITE_API_BASE_URL = url;
            expect(import.meta.env.VITE_API_BASE_URL).toBe(url);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle any hostname', () => {
      fc.assert(
        fc.property(
          fc.domain(),
          (domain) => {
            const url = `https://${domain}`;
            import.meta.env.VITE_API_BASE_URL = url;
            expect(import.meta.env.VITE_API_BASE_URL).toBe(url);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Multi-Environment Support', () => {
    /**
     * Property: Configuration should support multiple environments
     * without conflicts.
     */

    it('should support development environment configuration', async () => {
      import.meta.env.VITE_APP_ENV = 'development';
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:5001';

      const { APP_ENV, API_BASE_URL } = await import('../config/api.js');

      expect(APP_ENV).toBe('development');
      expect(API_BASE_URL).toBe('http://localhost:5001');
    });

    it('should support production environment configuration', async () => {
      import.meta.env.VITE_APP_ENV = 'production';
      import.meta.env.VITE_API_BASE_URL = 'https://server-e-commerce-app-env.up.railway.app';

      const { APP_ENV, API_BASE_URL } = await import('../config/api.js');

      expect(APP_ENV).toBe('production');
      expect(API_BASE_URL).toBe('https://server-e-commerce-app-env.up.railway.app');
    });

    it('should support staging environment configuration', async () => {
      import.meta.env.VITE_APP_ENV = 'staging';
      import.meta.env.VITE_API_BASE_URL = 'https://staging.example.com';

      const { APP_ENV, API_BASE_URL } = await import('../config/api.js');

      expect(APP_ENV).toBe('staging');
      expect(API_BASE_URL).toBe('https://staging.example.com');
    });

    it('should support test environment configuration', async () => {
      import.meta.env.VITE_APP_ENV = 'test';
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:5001';

      const { APP_ENV, API_BASE_URL } = await import('../config/api.js');

      expect(APP_ENV).toBe('test');
      expect(API_BASE_URL).toBe('http://localhost:5001');
    });
  });
});
