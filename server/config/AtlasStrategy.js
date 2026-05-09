const mongoose = require('mongoose');
const ConnectionStrategy = require('./ConnectionStrategy');

/**
 * MongoDB Atlas connection strategy
 * Handles connections to MongoDB Atlas cloud instances
 */
class AtlasStrategy extends ConnectionStrategy {
  /**
   * @param {string} [mongoUri] - MongoDB URI passed explicitly at registration time.
   *   Storing it on the instance ensures isAvailable() can find it even in
   *   containerised environments where process.env reads may be unreliable.
   */
  constructor(mongoUri) {
    super();
    this._mongoUri = mongoUri || null;
  }

  /**
   * Get the priority of this strategy (Atlas has high priority)
   * @returns {number} Priority value (higher = more preferred)
   */
  getPriority() {
    return 100;
  }

  /**
   * Check if Atlas strategy is available.
   * Prefers the URI stored at construction time so that the check is not
   * sensitive to the timing of process.env population in containerised
   * environments (e.g. Railway).  Falls back to process.env.MONGO_URI for
   * backwards-compatibility when the strategy is constructed without an
   * explicit URI.
   * @returns {Promise<boolean>} True if an Atlas URI is configured
   */
  async isAvailable() {
    const mongoUri = this._mongoUri || process.env.MONGO_URI;
    if (!mongoUri) return false;
    // Accept both SRV format (mongodb+srv://) and direct Atlas URIs that
    // contain the mongodb.net domain, as well as plain mongodb:// URIs that
    // carry Atlas credentials (direct connection string format used on Railway).
    return mongoUri.includes('mongodb+srv://') ||
           mongoUri.includes('mongodb.net') ||
           mongoUri.startsWith('mongodb://');
  }

  /**
   * Validate Atlas connection configuration
   * @param {Object} config - Connection configuration
   * @returns {Promise<boolean>} True if configuration is valid
   */
  async validate(config) {
    const mongoUri = config.mongoUri || this._mongoUri || process.env.MONGO_URI;
    
    if (!mongoUri) {
      return false;
    }

    // Basic Atlas URI validation — accept SRV, direct Atlas, and plain mongodb:// URIs
    const isAtlasUri = mongoUri.includes('mongodb+srv://') ||
                       mongoUri.includes('mongodb.net') ||
                       mongoUri.startsWith('mongodb://');
    const hasCredentials = mongoUri.includes('@');
    
    return isAtlasUri && hasCredentials;
  }

  /**
   * Get the Atlas connection string
   * @param {Object} config - Connection configuration
   * @returns {string} Atlas connection string
   */
  getConnectionString(config) {
    return config.mongoUri || this._mongoUri || process.env.MONGO_URI;
  }

  /**
   * Connect to MongoDB Atlas
   * @param {Object} config - Connection configuration
   * @returns {Promise<void>}
   */
  async connect(config) {
    const connectionString = this.getConnectionString(config);
    
    if (!connectionString) {
      throw this._createConnectionError(
        'MongoDB Atlas URI not configured',
        'configuration',
        null,
        [
          'Set MONGO_URI environment variable with your Atlas connection string',
          'Ensure the connection string includes credentials (username:password@)',
          'Verify the connection string format: mongodb+srv://username:password@cluster.mongodb.net/database'
        ]
      );
    }

    this._logConnectionAttempt(connectionString);

    try {
      const options = {
        ...this._getDefaultConnectionOptions(config),
        // Atlas-specific options
        retryWrites: true,
        w: 'majority'
      };

      await mongoose.connect(connectionString, options);
      this._logConnectionSuccess(connectionString);
      
    } catch (error) {
      this._logConnectionFailure(error);
      throw this._createAtlasError(error);
    }
  }

  /**
   * Create Atlas-specific error with troubleshooting suggestions
   * @param {Error} originalError - Original mongoose error
   * @returns {Error} Enhanced error with suggestions
   * @private
   */
  _createAtlasError(originalError) {
    let type = 'database';
    let suggestions = [];

    // Analyze error and provide specific suggestions
    if (originalError.message.includes('ECONNREFUSED') || originalError.message.includes('querySrv')) {
      type = 'network';
      suggestions = [
        'Check your internet connection',
        'Verify the Atlas cluster is running and accessible',
        'Confirm your IP address is whitelisted in Atlas Network Access',
        'Check if your firewall is blocking MongoDB connections (port 27017)',
        'Verify the cluster hostname in your connection string'
      ];
    } else if (originalError.message.includes('Authentication failed') || originalError.message.includes('auth')) {
      type = 'authentication';
      suggestions = [
        'Verify your MongoDB Atlas username and password',
        'Check if the database user has proper permissions',
        'Ensure the user is created for the correct database',
        'Verify the authentication database is correct'
      ];
    } else if (originalError.message.includes('timeout') || originalError.message.includes('timed out')) {
      type = 'network';
      suggestions = [
        'Check your internet connection stability',
        'Try increasing the connection timeout',
        'Verify Atlas cluster is in the nearest region',
        'Check if your ISP is blocking MongoDB connections'
      ];
    } else if (originalError.message.includes('Invalid connection string')) {
      type = 'configuration';
      suggestions = [
        'Verify the MONGO_URI format: mongodb+srv://username:password@cluster.mongodb.net/database',
        'Ensure special characters in password are URL-encoded',
        'Check that the cluster name and database name are correct',
        'Verify the connection string was copied correctly from Atlas'
      ];
    } else {
      suggestions = [
        'Check MongoDB Atlas dashboard for cluster status',
        'Verify your connection string is correct',
        'Ensure your IP is whitelisted in Network Access',
        'Try connecting from MongoDB Compass to test connectivity'
      ];
    }

    return this._createConnectionError(
      `Atlas connection failed: ${originalError.message}`,
      type,
      originalError,
      suggestions
    );
  }
}

module.exports = AtlasStrategy;