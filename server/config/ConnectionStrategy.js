/**
 * Base class for database connection strategies
 * Defines the interface that all connection strategies must implement
 */
class ConnectionStrategy {
  constructor() {
    if (this.constructor === ConnectionStrategy) {
      throw new Error('ConnectionStrategy is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Attempt to connect to the database using this strategy
   * @param {Object} config - Connection configuration
   * @returns {Promise<void>}
   * @abstract
   */
  async connect(config) {
    throw new Error('connect() method must be implemented by subclass');
  }

  /**
   * Validate the connection configuration for this strategy
   * @param {Object} config - Connection configuration
   * @returns {Promise<boolean>} True if configuration is valid
   * @abstract
   */
  async validate(config) {
    throw new Error('validate() method must be implemented by subclass');
  }

  /**
   * Get the connection string for this strategy
   * @param {Object} config - Connection configuration
   * @returns {string} Connection string
   * @abstract
   */
  getConnectionString(config) {
    throw new Error('getConnectionString() method must be implemented by subclass');
  }

  /**
   * Get the priority of this strategy (higher numbers = higher priority)
   * @returns {number} Priority value
   * @abstract
   */
  getPriority() {
    throw new Error('getPriority() method must be implemented by subclass');
  }

  /**
   * Check if this strategy is available for use
   * @returns {Promise<boolean>} True if strategy is available
   * @abstract
   */
  async isAvailable() {
    throw new Error('isAvailable() method must be implemented by subclass');
  }

  /**
   * Get the name of this strategy
   * @returns {string} Strategy name
   */
  getName() {
    return this.constructor.name.replace('Strategy', '').toLowerCase();
  }

  /**
   * Get default mongoose connection options for this strategy
   * @param {Object} config - Connection configuration
   * @returns {Object} Mongoose connection options
   * @protected
   */
  _getDefaultConnectionOptions(config) {
    return {
      serverSelectionTimeoutMS: config.serverSelectionTimeout || 5000,
      socketTimeoutMS: config.socketTimeout || 45000,
      connectTimeoutMS: config.connectionTimeout || 10000,
      maxPoolSize: config.maxPoolSize || 10,
      minPoolSize: config.minPoolSize || 1,
      maxIdleTimeMS: 30000,
      bufferCommands: false
    };
  }

  /**
   * Sanitize connection string for logging (remove credentials)
   * @param {string} connectionString - Full connection string
   * @returns {string} Sanitized connection string
   * @protected
   */
  _sanitizeConnectionString(connectionString) {
    if (!connectionString) return 'undefined';
    
    try {
      // Replace credentials in MongoDB connection strings
      return connectionString.replace(
        /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
        'mongodb$1://***:***@'
      );
    } catch (error) {
      return '[invalid connection string]';
    }
  }

  /**
   * Create a standardized error for connection failures
   * @param {string} message - Error message
   * @param {string} type - Error type (network, authentication, configuration, database)
   * @param {Error} originalError - Original error object
   * @param {Array} suggestions - Troubleshooting suggestions
   * @returns {Error} Standardized error
   * @protected
   */
  _createConnectionError(message, type = 'database', originalError = null, suggestions = []) {
    const error = new Error(message);
    error.type = type;
    error.strategy = this.getName();
    error.originalError = originalError;
    error.suggestions = suggestions;
    error.timestamp = new Date();
    
    if (originalError) {
      error.code = originalError.code;
      error.stack = originalError.stack;
    }
    
    return error;
  }

  /**
   * Log connection attempt
   * @param {string} connectionString - Connection string (will be sanitized)
   * @protected
   */
  _logConnectionAttempt(connectionString) {
    console.log(`[${this.getName()}] Attempting connection to: ${this._sanitizeConnectionString(connectionString)}`);
  }

  /**
   * Log successful connection
   * @param {string} connectionString - Connection string (will be sanitized)
   * @protected
   */
  _logConnectionSuccess(connectionString) {
    console.log(`[${this.getName()}] Successfully connected to: ${this._sanitizeConnectionString(connectionString)}`);
  }

  /**
   * Log connection failure
   * @param {Error} error - Connection error
   * @protected
   */
  _logConnectionFailure(error) {
    console.error(`[${this.getName()}] Connection failed:`, error.message);
    if (error.suggestions && error.suggestions.length > 0) {
      console.log(`[${this.getName()}] Suggestions:`);
      error.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
    }
  }
}

module.exports = ConnectionStrategy;