// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

export { API_BASE_URL, APP_ENV };