import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  isConnectionError,
  isCorsError,
  isAuthError,
  logError,
  handleError,
} from '../error-handler';

describe('Error Handler Utilities', () => {
  describe('getErrorMessage', () => {
    it('should return connection error message for connection errors', () => {
      const error = new Error('Network Error');
      error.connectionError = true;
      
      const message = getErrorMessage(error);
      expect(message).toContain('Unable to connect to the server');
    });

    it('should return CORS error message for CORS errors', () => {
      const error = new Error('Network Error');
      error.corsError = true;
      error.response = { status: 0 }; // Add response to distinguish from connection error
      
      const message = getErrorMessage(error);
      expect(message).toContain('Server configuration error');
    });

    it('should return auth error message for auth errors', () => {
      const error = new Error('Unauthorized');
      error.authError = true;
      
      const message = getErrorMessage(error);
      expect(message).toContain('Your session has expired');
    });

    it('should return server error message for 5xx errors', () => {
      const error = new Error('Server Error');
      error.serverError = true;
      
      const message = getErrorMessage(error);
      expect(message).toContain('Server error');
    });

    it('should return generic error message for unknown errors', () => {
      const error = new Error('Unknown error');
      
      const message = getErrorMessage(error);
      expect(message).toContain('An unexpected error occurred');
    });

    it('should return custom error message from response data', () => {
      const error = new Error('Bad Request');
      error.response = {
        status: 400,
        data: {
          message: 'Invalid input provided',
        },
      };
      
      const message = getErrorMessage(error);
      expect(message).toBe('Invalid input provided');
    });
  });

  describe('isConnectionError', () => {
    it('should detect connection error flag', () => {
      const error = new Error('Connection failed');
      error.connectionError = true;
      
      expect(isConnectionError(error)).toBe(true);
    });

    it('should detect ECONNREFUSED error code', () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      
      expect(isConnectionError(error)).toBe(true);
    });

    it('should detect ENOTFOUND error code', () => {
      const error = new Error('Not found');
      error.code = 'ENOTFOUND';
      
      expect(isConnectionError(error)).toBe(true);
    });

    it('should detect network error with no response', () => {
      const error = new Error('Network Error');
      error.message = 'Network Error';
      error.response = undefined;
      
      expect(isConnectionError(error)).toBe(true);
    });

    it('should return false for non-connection errors', () => {
      const error = new Error('Some other error');
      
      expect(isConnectionError(error)).toBe(false);
    });
  });

  describe('isCorsError', () => {
    it('should detect CORS error flag', () => {
      const error = new Error('CORS error');
      error.corsError = true;
      
      expect(isCorsError(error)).toBe(true);
    });

    it('should detect CORS in error message', () => {
      const error = new Error('CORS policy violation');
      
      expect(isCorsError(error)).toBe(true);
    });

    it('should detect Cross-Origin in error message', () => {
      const error = new Error('Cross-Origin request blocked');
      
      expect(isCorsError(error)).toBe(true);
    });

    it('should detect network error with no response as CORS', () => {
      const error = new Error('Network Error');
      error.message = 'Network Error';
      error.response = undefined;
      
      expect(isCorsError(error)).toBe(true);
    });

    it('should return false for non-CORS errors', () => {
      const error = new Error('Some other error');
      
      expect(isCorsError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should detect auth error flag', () => {
      const error = new Error('Auth error');
      error.authError = true;
      
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect 401 Unauthorized status', () => {
      const error = new Error('Unauthorized');
      error.response = {
        status: 401,
      };
      
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect 403 Forbidden status', () => {
      const error = new Error('Forbidden');
      error.response = {
        status: 403,
      };
      
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect Unauthorized in error message', () => {
      const error = new Error('Unauthorized access');
      
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect Token in error message', () => {
      const error = new Error('Invalid token');
      
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for non-auth errors', () => {
      const error = new Error('Some other error');
      
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('logError', () => {
    it('should create error log with all details', () => {
      const error = new Error('Test error');
      error.code = 'ECONNREFUSED';
      error.config = {
        url: '/api/test',
        method: 'GET',
      };
      
      const context = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123',
      };
      
      const log = logError(error, context);
      
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('errorType');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('userMessage');
      expect(log).toHaveProperty('request');
      expect(log).toHaveProperty('response');
      expect(log).toHaveProperty('context');
      expect(log.context.component).toBe('TestComponent');
      expect(log.context.action).toBe('testAction');
      expect(log.context.userId).toBe('user123');
    });

    it('should classify error type correctly', () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      
      const log = logError(error);
      
      expect(log.errorType).toBe('ConnectionError');
    });

    it('should include request details', () => {
      const error = new Error('Test error');
      error.config = {
        url: '/api/products',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };
      
      const log = logError(error);
      
      expect(log.request.url).toBe('/api/products');
      expect(log.request.method).toBe('POST');
    });

    it('should include response details', () => {
      const error = new Error('Server error');
      error.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Database error' },
      };
      
      const log = logError(error);
      
      expect(log.response.status).toBe(500);
      expect(log.response.statusText).toBe('Internal Server Error');
    });
  });

  describe('handleError', () => {
    it('should return error details and user message', () => {
      const error = new Error('Connection failed');
      error.connectionError = true;
      
      const result = handleError(error);
      
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('isConnectionError');
      expect(result).toHaveProperty('isCorsError');
      expect(result).toHaveProperty('isAuthError');
      expect(result).toHaveProperty('log');
      expect(result.isConnectionError).toBe(true);
    });

    it('should include context in error log', () => {
      const error = new Error('Test error');
      const context = {
        component: 'TestComponent',
        action: 'testAction',
      };
      
      const result = handleError(error, context);
      
      expect(result.log.context.component).toBe('TestComponent');
      expect(result.log.context.action).toBe('testAction');
    });
  });
});
