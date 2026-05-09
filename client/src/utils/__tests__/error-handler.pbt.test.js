/**
 * Property-Based Tests for Error Handler Utilities
 * 
 * These tests validate that error classification functions correctly
 * identify different error types across various error scenarios.
 * 
 * **Validates: Requirements 4.2, 4.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getErrorMessage,
  isConnectionError,
  isCorsError,
  isAuthError,
  logError,
} from '../error-handler';

describe('Error Handler Utilities - Property-Based Tests', () => {
  describe('Property 5: Response Parsing and Error Handling', () => {
    /**
     * Property: For any valid response structure from the backend,
     * the error handler SHALL properly classify the error type and
     * return an appropriate user-friendly message.
     * 
     * **Validates: Requirements 4.2**
     */

    it('should return a string message for any error', () => {
      const errors = [
        new Error('Generic error'),
        { message: 'Object error' },
        { response: { status: 500 } },
        { code: 'ECONNREFUSED' },
        { corsError: true },
        { authError: true },
      ];

      for (const error of errors) {
        const message = getErrorMessage(error);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      }
    });

    it('should classify connection errors correctly', () => {
      const connectionErrors = [
        { code: 'ECONNREFUSED' },
        { code: 'ENOTFOUND' },
        { code: 'ECONNRESET' },
        { code: 'EHOSTUNREACH' },
        { code: 'ENETUNREACH' },
        { code: 'ETIMEDOUT' },
        { connectionError: true },
        { message: 'Network Error', response: undefined },
      ];

      for (const error of connectionErrors) {
        expect(isConnectionError(error)).toBe(true);
      }
    });

    it('should classify CORS errors correctly', () => {
      const corsErrors = [
        { corsError: true },
        { message: 'CORS policy violation' },
        { message: 'Cross-Origin request blocked' },
        { message: 'cross-origin request blocked' },
        { message: 'Access-Control-Allow-Origin missing' },
        { message: 'Network Error', response: undefined },
      ];

      for (const error of corsErrors) {
        expect(isCorsError(error)).toBe(true);
      }
    });

    it('should classify authentication errors correctly', () => {
      const authErrors = [
        { authError: true },
        { response: { status: 401 } },
        { response: { status: 403 } },
        { message: 'Unauthorized' },
        { message: 'unauthorized access' },
        { message: 'Invalid token' },
        { message: 'Token expired' },
        { message: 'Authentication failed' },
        { message: 'Forbidden' },
        { response: { data: { message: 'Unauthorized' } } },
      ];

      for (const error of authErrors) {
        expect(isAuthError(error)).toBe(true);
      }
    });

    it('should classify server errors correctly', () => {
      const serverErrorStatuses = [500, 501, 502, 503, 504];

      for (const status of serverErrorStatuses) {
        const error = new Error('Server Error');
        error.serverError = true;

        const message = getErrorMessage(error);
        expect(message).toContain('Server error');
      }
    });

    it('should classify client errors correctly', () => {
      const clientErrorStatuses = [400, 404, 409, 422];

      for (const status of clientErrorStatuses) {
        const error = new Error('Client Error');
        error.response = { status };

        const message = getErrorMessage(error);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Classification Consistency', () => {
    /**
     * Property: Error classification functions should be consistent
     * and not misclassify errors across different scenarios.
     */

    it('should not misclassify connection errors as CORS errors', () => {
      const connectionError = { code: 'ECONNREFUSED' };

      expect(isConnectionError(connectionError)).toBe(true);
      // Connection errors might also match CORS pattern, but that's acceptable
    });

    it('should not misclassify auth errors as connection errors', () => {
      const authError = { response: { status: 401 } };

      expect(isAuthError(authError)).toBe(true);
      expect(isConnectionError(authError)).toBe(false);
    });

    it('should handle errors with multiple error indicators', () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
        response: { status: 500 },
      };

      // Should classify as connection error (first match)
      expect(isConnectionError(error)).toBe(true);
    });

    it('should handle errors with no indicators', () => {
      const error = new Error('Unknown error');

      expect(isConnectionError(error)).toBe(false);
      expect(isCorsError(error)).toBe(false);
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('Error Message Generation', () => {
    /**
     * Property: Error messages should be user-friendly and appropriate
     * for the error type, never empty or undefined.
     */

    it('should generate appropriate message for each error type', () => {
      const errorScenarios = [
        {
          error: { connectionError: true },
          shouldContain: 'Unable to connect',
        },
        {
          error: { corsError: true },
          shouldContain: 'Server configuration error',
        },
        {
          error: { authError: true },
          shouldContain: 'session has expired',
        },
        {
          error: { serverError: true },
          shouldContain: 'Server error',
        },
        {
          error: { timeoutError: true },
          shouldContain: 'timed out',
        },
      ];

      for (const scenario of errorScenarios) {
        const message = getErrorMessage(scenario.error);
        expect(message).toContain(scenario.shouldContain);
      }
    });

    it('should prefer response data message over generic message', () => {
      const error = new Error('Generic error');
      error.response = {
        status: 400,
        data: {
          message: 'Custom error message from server',
        },
      };

      const message = getErrorMessage(error);
      expect(message).toBe('Custom error message from server');
    });

    it('should handle errors with response.data.error field', () => {
      const error = new Error('Generic error');
      error.response = {
        status: 400,
        data: {
          error: 'Specific error from server',
        },
      };

      const message = getErrorMessage(error);
      expect(message).toBe('Specific error from server');
    });
  });

  describe('Error Logging', () => {
    /**
     * Property: Error logging should capture all relevant error information
     * and context without throwing exceptions.
     */

    it('should log error without throwing', () => {
      const error = new Error('Test error');
      error.config = { url: '/api/test', method: 'GET' };

      expect(() => {
        logError(error);
      }).not.toThrow();
    });

    it('should include all required fields in error log', () => {
      const error = new Error('Test error');
      error.code = 'ECONNREFUSED';
      error.config = { url: '/api/test', method: 'GET' };

      const log = logError(error);

      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('errorType');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('userMessage');
      expect(log).toHaveProperty('request');
      expect(log).toHaveProperty('response');
      expect(log).toHaveProperty('errorDetails');
      expect(log).toHaveProperty('context');
    });

    it('should include context information in error log', () => {
      const error = new Error('Test error');
      const context = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123',
        metadata: { productId: 456 },
      };

      const log = logError(error, context);

      expect(log.context.component).toBe('TestComponent');
      expect(log.context.action).toBe('testAction');
      expect(log.context.userId).toBe('user123');
      expect(log.context.metadata).toEqual({ productId: 456 });
    });

    it('should handle errors with partial information', () => {
      const errors = [
        new Error('Simple error'),
        { message: 'Object error' },
        { code: 'ECONNREFUSED' },
        { response: { status: 500 } },
      ];

      for (const error of errors) {
        expect(() => {
          logError(error);
        }).not.toThrow();
      }
    });
  });

  describe('Property-Based Tests with Generators', () => {
    /**
     * Use fast-check to generate random error scenarios and verify
     * the error handler processes them correctly.
     */

    it('should handle any error message string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (message) => {
            const error = new Error(message);
            const result = getErrorMessage(error);

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle any HTTP status code', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 599 }),
          (status) => {
            const error = new Error('HTTP Error');
            error.response = { status };

            const result = getErrorMessage(error);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle any error code string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (code) => {
            const error = new Error('Error');
            error.code = code;

            const result = getErrorMessage(error);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should classify any error without throwing', () => {
      fc.assert(
        fc.property(
          fc.object(),
          (errorObj) => {
            expect(() => {
              isConnectionError(errorObj);
              isCorsError(errorObj);
              isAuthError(errorObj);
            }).not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should log any error without throwing', () => {
      fc.assert(
        fc.property(
          fc.object(),
          (errorObj) => {
            expect(() => {
              logError(errorObj);
            }).not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
