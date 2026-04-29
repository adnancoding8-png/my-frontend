const { EventEmitter } = require('events');
const mongoose = require('mongoose');

/**
 * Central database connection orchestrator
 * Manages connection lifecycle, strategy selection, and event emission
 */
class DatabaseManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      healthCheckInterval: 30000,
      connectionTimeout: 10000,
      serverSelectionTimeout: 5000,
      socketTimeout: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      environment: process.env.NODE_ENV || 'development',
      ...config
    };
    
    this.connectionStatus = {
      status: 'disconnected',
      strategy: null,
      host: null,
      database: null,
      lastConnected: null,
      lastError: null,
      retryCount: 0,
      healthCheck: {
        lastCheck: null,
        isHealthy: false,
        latency: null
      }
    };
    
    this.strategies = [];
    this.currentStrategy = null;
    this.healthMonitor = null;
    this.retryHandler = null;
  }

  /**
   * Register a connection strategy
   * @param {ConnectionStrategy} strategy - Strategy instance to register
   */
  registerStrategy(strategy) {
    this.strategies.push(strategy);
    // Sort strategies by priority (higher priority first)
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Attempt to connect to database using available strategies
   * @returns {Promise<void>}
   */
  async connect() {
    this.connectionStatus.status = 'connecting';
    this.emit('connecting');

    try {
      // Find the first available strategy
      for (const strategy of this.strategies) {
        if (await strategy.isAvailable()) {
          this.currentStrategy = strategy;
          break;
        }
      }

      if (!this.currentStrategy) {
        throw new Error('No available connection strategies found');
      }

      // Attempt connection with retry logic
      await this._connectWithRetry();
      
      // Validate connection
      await this._validateConnection();
      
      // Start health monitoring
      this._startHealthMonitoring();
      
      this.connectionStatus.status = 'connected';
      this.connectionStatus.lastConnected = new Date();
      this.connectionStatus.strategy = this.currentStrategy.constructor.name.toLowerCase().replace('strategy', '');
      
      this.emit('connected', this.getConnectionInfo());
      
    } catch (error) {
      this.connectionStatus.status = 'error';
      this.connectionStatus.lastError = error;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from database and cleanup resources
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      this.connectionStatus.status = 'disconnecting';
      this.emit('disconnecting');

      // Stop health monitoring
      if (this.healthMonitor) {
        this.healthMonitor.stop();
        this.healthMonitor = null;
      }

      // Close mongoose connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }

      this.connectionStatus.status = 'disconnected';
      this.connectionStatus.strategy = null;
      this.connectionStatus.host = null;
      this.connectionStatus.database = null;
      
      this.emit('disconnected');
      
    } catch (error) {
      this.connectionStatus.lastError = error;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get current connection information
   * @returns {Object} Connection status and information
   */
  getConnectionInfo() {
    return {
      ...this.connectionStatus,
      mongooseState: mongoose.connection.readyState,
      mongooseStateString: this._getMongooseStateString(),
      config: {
        environment: this.config.environment,
        maxPoolSize: this.config.maxPoolSize,
        minPoolSize: this.config.minPoolSize
      }
    };
  }

  /**
   * Check if database is connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connectionStatus.status === 'connected' && 
           mongoose.connection.readyState === 1;
  }

  /**
   * Attempt connection with retry logic
   * @private
   */
  async _connectWithRetry() {
    const maxAttempts = this.config.retryAttempts;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.connectionStatus.retryCount = attempt - 1;
        
        if (attempt > 1) {
          const delay = this._calculateRetryDelay(attempt - 1);
          console.log(`Retrying database connection (attempt ${attempt}/${maxAttempts}) in ${delay}ms...`);
          await this._sleep(delay);
        }

        await this.currentStrategy.connect(this.config);
        return; // Success, exit retry loop
        
      } catch (error) {
        lastError = error;
        console.error(`Database connection attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxAttempts) {
          throw new Error(`Failed to connect after ${maxAttempts} attempts. Last error: ${error.message}`);
        }
      }
    }
  }

  /**
   * Validate the established connection
   * @private
   */
  async _validateConnection() {
    try {
      // Perform a ping to validate connection
      await mongoose.connection.db.admin().ping();
      
      // Get database information
      const dbInfo = mongoose.connection.db.databaseName;
      const host = mongoose.connection.host;
      
      this.connectionStatus.database = dbInfo;
      this.connectionStatus.host = host;
      
      console.log(`Database connection validated: ${dbInfo} on ${host}`);
      
    } catch (error) {
      throw new Error(`Connection validation failed: ${error.message}`);
    }
  }

  /**
   * Start health monitoring
   * @private
   */
  _startHealthMonitoring() {
    if (this.healthMonitor) {
      this.healthMonitor.stop();
    }

    // Import and create HealthMonitor (will be implemented in next task)
    // For now, we'll set up a basic health check
    this._setupBasicHealthCheck();
  }

  /**
   * Setup basic health check until HealthMonitor is implemented
   * @private
   */
  _setupBasicHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const startTime = Date.now();
        await mongoose.connection.db.admin().ping();
        const latency = Date.now() - startTime;
        
        this.connectionStatus.healthCheck = {
          lastCheck: new Date(),
          isHealthy: true,
          latency
        };
        
        this.emit('healthCheck', { healthy: true, latency });
        
      } catch (error) {
        this.connectionStatus.healthCheck = {
          lastCheck: new Date(),
          isHealthy: false,
          latency: null
        };
        
        this.emit('healthCheck', { healthy: false, error: error.message });
        console.error('Database health check failed:', error.message);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   * @private
   */
  _calculateRetryDelay(attempt) {
    return this.config.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get human-readable mongoose connection state
   * @returns {string} Connection state string
   * @private
   */
  _getMongooseStateString() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState] || 'unknown';
  }

  /**
   * Cleanup resources on process exit
   */
  cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.healthMonitor) {
      this.healthMonitor.stop();
      this.healthMonitor = null;
    }
  }
}

module.exports = DatabaseManager;