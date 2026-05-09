import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

/**
 * Create and configure axios instance for API communication
 * 
 * Features:
 * - Configured with baseURL from environment variables
 * - Supports authentication via tokens in localStorage
 * - Handles CORS and connection errors
 * - Maintains credentials for cookie-based auth
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: Add authentication tokens from localStorage
 * 
 * This interceptor runs before each request is sent to the backend.
 * If an auth token exists in localStorage, it's added to the Authorization header.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // If request setup fails, reject the promise
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle errors and detect connection issues
 * 
 * This interceptor runs after each response is received from the backend.
 * It classifies different types of errors (CORS, connection, auth, server)
 * and adds flags to the error object for easier handling in components.
 */
apiClient.interceptors.response.use(
  (response) => {
    // If response is successful, return it as-is
    return response;
  },
  (error) => {
    // Detect CORS errors: Network error with no response
    if (error.message === 'Network Error' && !error.response) {
      console.error('CORS or Network Error:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      error.corsError = true;
    }

    // Detect connection errors: Connection refused or not found
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Connection Error:', {
        url: error.config?.url,
        method: error.config?.method,
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      error.connectionError = true;
    }

    // Detect timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request Timeout:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      error.timeoutError = true;
    }

    // Detect authentication errors: 401 Unauthorized
    if (error.response?.status === 401) {
      console.error('Authentication Error:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        message: 'Unauthorized - Token may be expired or invalid',
        timestamp: new Date().toISOString(),
      });
      error.authError = true;
    }

    // Detect server errors: 5xx status codes
    if (error.response?.status >= 500) {
      console.error('Server Error:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
        timestamp: new Date().toISOString(),
      });
      error.serverError = true;
    }

    // Log all errors for debugging
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
        timestamp: new Date().toISOString(),
      });
    }

    // Reject the promise with the enhanced error object
    return Promise.reject(error);
  }
);

export default apiClient;
