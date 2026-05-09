/**
 * Error Handler Utilities
 * 
 * Provides functions to classify errors and generate user-friendly messages
 * for different types of API errors (connection, CORS, auth, server, etc.)
 * 
 * **Validates: Requirements 4.3, 4.4**
 */

/**
 * Classify and return a user-friendly error message
 * 
 * Takes an error object and returns an appropriate message based on the error type.
 * This function handles various error scenarios:
 * - Connection errors (network unreachable)
 * - CORS errors (cross-origin policy violations)
 * - Authentication errors (expired/invalid tokens)
 * - Server errors (5xx status codes)
 * - Client errors (4xx status codes)
 * - Generic errors (unknown)
 * 
 * @param {Error} error - The error object from axios or other sources
 * @returns {string} User-friendly error message
 * 
 * @example
 * try {
 *   await apiClient.get('/api/products');
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   console.log(message); // "Unable to connect to the server..."
 * }
 */
export function getErrorMessage(error) {
  // Connection errors: Network is unreachable or backend is down
  if (isConnectionError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // CORS errors: Frontend origin not allowed by backend
  if (isCorsError(error)) {
    return 'Server configuration error. Please contact support.';
  }

  // Authentication errors: Token expired or invalid
  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again.';
  }

  // Database connection errors: Service unavailable (503)
  if (error.response?.status === 503) {
    return 'Service temporarily unavailable. Database connection issue. Please try again in a moment.';
  }

  // Server errors: Backend returned 5xx status
  if (error.serverError) {
    return error.response?.data?.message || 'Server error. Please try again later.';
  }

  // Client errors: Backend returned 4xx status (except 401)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    // Try to get error message from response data
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    return `Request failed with status ${error.response.status}. Please try again.`;
  }

  // Timeout errors: Request took too long
  if (error.timeoutError) {
    return 'Request timed out. Please check your connection and try again.';
  }

  // Generic error: Unknown error type
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Detect if an error is a connection error
 * 
 * Connection errors occur when:
 * - Network is unreachable
 * - Backend server is down or not responding
 * - DNS resolution fails
 * - Connection is refused
 * 
 * @param {Error} error - The error object to check
 * @returns {boolean} True if error is a connection error
 * 
 * @example
 * if (isConnectionError(error)) {
 *   console.log('Backend is unreachable');
 * }
 */
export function isConnectionError(error) {
  // Flag set by axios interceptor
  if (error.connectionError) {
    return true;
  }

  // Check for specific error codes
  const connectionErrorCodes = [
    'ECONNREFUSED',  // Connection refused
    'ENOTFOUND',     // DNS resolution failed
    'ECONNRESET',    // Connection reset by peer
    'EHOSTUNREACH',  // Host is unreachable
    'ENETUNREACH',   // Network is unreachable
    'ETIMEDOUT',     // Connection timed out
  ];

  if (connectionErrorCodes.includes(error.code)) {
    return true;
  }

  // Check for network error with no response
  if (error.message === 'Network Error' && !error.response) {
    return true;
  }

  return false;
}

/**
 * Detect if an error is a CORS error
 * 
 * CORS errors occur when:
 * - Frontend origin is not in backend's allowed origins list
 * - Backend doesn't send required CORS headers
 * - Credentials are not properly configured
 * 
 * @param {Error} error - The error object to check
 * @returns {boolean} True if error is a CORS error
 * 
 * @example
 * if (isCorsError(error)) {
 *   console.log('CORS policy violation');
 * }
 */
export function isCorsError(error) {
  // Flag set by axios interceptor
  if (error.corsError) {
    return true;
  }

  // Check for CORS-related error messages
  const corErrorMessages = [
    'CORS',
    'Cross-Origin',
    'cross-origin',
    'Access-Control-Allow-Origin',
  ];

  if (corErrorMessages.some(msg => error.message?.includes(msg))) {
    return true;
  }

  // Network error with no response often indicates CORS issue
  if (error.message === 'Network Error' && !error.response) {
    return true;
  }

  return false;
}

/**
 * Detect if an error is an authentication error
 * 
 * Authentication errors occur when:
 * - JWT token is expired
 * - JWT token is invalid or malformed
 * - User is not authenticated (401 Unauthorized)
 * - User lacks required permissions (403 Forbidden)
 * 
 * @param {Error} error - The error object to check
 * @returns {boolean} True if error is an authentication error
 * 
 * @example
 * if (isAuthError(error)) {
 *   // Redirect to login page
 *   window.location.href = '/login';
 * }
 */
export function isAuthError(error) {
  // Flag set by axios interceptor
  if (error.authError) {
    return true;
  }

  // Check for 401 Unauthorized status
  if (error.response?.status === 401) {
    return true;
  }

  // Check for 403 Forbidden status (permission denied)
  if (error.response?.status === 403) {
    return true;
  }

  // Check for auth-related error messages
  const authErrorMessages = [
    'Unauthorized',
    'unauthorized',
    'Token',
    'token',
    'Authentication',
    'authentication',
    'Forbidden',
    'forbidden',
  ];

  if (authErrorMessages.some(msg => error.message?.includes(msg))) {
    return true;
  }

  if (authErrorMessages.some(msg => error.response?.data?.message?.includes(msg))) {
    return true;
  }

  return false;
}

/**
 * Log an error with context information
 * 
 * Logs error details including:
 * - Error type (connection, CORS, auth, server, etc.)
 * - Request details (URL, method, headers)
 * - Response details (status, data)
 * - Timestamp for debugging
 * - Custom context provided by caller
 * 
 * This function is useful for:
 * - Debugging API issues
 * - Monitoring error patterns
 * - Sending errors to error tracking services
 * - Creating audit logs
 * 
 * @param {Error} error - The error object to log
 * @param {Object} context - Additional context information
 * @param {string} context.component - Component where error occurred
 * @param {string} context.action - Action that triggered the error
 * @param {string} context.userId - User ID (if applicable)
 * @param {Object} context.metadata - Additional metadata
 * 
 * @example
 * try {
 *   await apiClient.get('/api/products');
 * } catch (error) {
 *   logError(error, {
 *     component: 'ProductList',
 *     action: 'fetchProducts',
 *     userId: user.id,
 *     metadata: { productId: 123 }
 *   });
 * }
 */
export function logError(error, context = {}) {
  // Determine error type
  let errorType = 'Unknown';
  if (isConnectionError(error)) {
    errorType = 'ConnectionError';
  } else if (isCorsError(error)) {
    errorType = 'CORSError';
  } else if (isAuthError(error)) {
    errorType = 'AuthenticationError';
  } else if (error.serverError) {
    errorType = 'ServerError';
  } else if (error.timeoutError) {
    errorType = 'TimeoutError';
  } else if (error.response?.status >= 400) {
    errorType = `ClientError_${error.response.status}`;
  }

  // Build comprehensive error log object
  const errorLog = {
    timestamp: new Date().toISOString(),
    errorType,
    message: error.message,
    userMessage: getErrorMessage(error),
    
    // Request details
    request: {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      data: error.config?.data,
    },

    // Response details
    response: {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
    },

    // Error details
    errorDetails: {
      code: error.code,
      connectionError: error.connectionError,
      corsError: error.corsError,
      authError: error.authError,
      serverError: error.serverError,
      timeoutError: error.timeoutError,
    },

    // Context information
    context: {
      component: context.component,
      action: context.action,
      userId: context.userId,
      metadata: context.metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    },
  };

  // Log to console in development
  try {
    if (import.meta.env.DEV) {
      console.error('Error Log:', errorLog);
    }
  } catch (e) {
    // import.meta.env not available in Node.js environment
    // In development, you can manually enable logging
  }

  // In production, you could send this to an error tracking service
  // Example: Sentry, LogRocket, Rollbar, etc.
  // sendToErrorTrackingService(errorLog);

  return errorLog;
}

/**
 * Handle error and return appropriate response
 * 
 * This is a convenience function that combines error classification,
 * message generation, and logging into a single call.
 * 
 * @param {Error} error - The error object to handle
 * @param {Object} context - Context information for logging
 * @returns {Object} Object with error details and user message
 * 
 * @example
 * try {
 *   await apiClient.get('/api/products');
 * } catch (error) {
 *   const { message, type } = handleError(error, { component: 'ProductList' });
 *   showNotification(message);
 * }
 */
export function handleError(error, context = {}) {
  const errorLog = logError(error, context);

  return {
    message: getErrorMessage(error),
    type: errorLog.errorType,
    isConnectionError: isConnectionError(error),
    isCorsError: isCorsError(error),
    isAuthError: isAuthError(error),
    log: errorLog,
  };
}

export default {
  getErrorMessage,
  isConnectionError,
  isCorsError,
  isAuthError,
  logError,
  handleError,
};
