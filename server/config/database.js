const DatabaseManager = require('./DatabaseManager');
const AtlasStrategy = require('./AtlasStrategy');

// Create global database manager instance
const databaseManager = new DatabaseManager({
  environment: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  retryAttempts: 3,
  retryDelay: 1000,
  healthCheckInterval: 30000
});

// Register connection strategies.
// Pass MONGO_URI explicitly so AtlasStrategy.isAvailable() can find it
// regardless of when/how process.env is populated in the Railway container.
databaseManager.registerStrategy(new AtlasStrategy(process.env.MONGO_URI));

// Set up event listeners for database events
databaseManager.on('connecting', () => {
  console.log('Connecting to database...');
});

databaseManager.on('connected', (info) => {
  console.log(`Connected to database: ${info.database} on ${info.host} using ${info.strategy} strategy`);
});

databaseManager.on('disconnecting', () => {
  console.log('Disconnecting from database...');
});

databaseManager.on('disconnected', () => {
  console.log('Disconnected from database');
});

databaseManager.on('error', (error) => {
  console.error('Database error:', error.message);
  if (error.suggestions && error.suggestions.length > 0) {
    console.log('Troubleshooting suggestions:');
    error.suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });
  }
});

databaseManager.on('healthCheck', (result) => {
  if (!result.healthy) {
    console.warn('Database health check failed:', result.error);
  }
});

/**
 * Connect to database using the new DatabaseManager
 * @returns {Promise<void>}
 */
async function connectToDatabase() {
  try {
    await databaseManager.connect();
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    throw error;
  }
}

/**
 * Disconnect from database using the new DatabaseManager
 * @returns {Promise<void>}
 */
async function disconnectFromDatabase() {
  try {
    await databaseManager.disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error.message);
    throw error;
  }
}

/**
 * Get database connection information
 * @returns {Object} Connection information
 */
function getDatabaseInfo() {
  return databaseManager.getConnectionInfo();
}

/**
 * Check if database is connected
 * @returns {boolean} True if connected
 */
function isDatabaseConnected() {
  return databaseManager.isConnected();
}

/**
 * Get the database manager instance for advanced usage
 * @returns {DatabaseManager} Database manager instance
 */
function getDatabaseManager() {
  return databaseManager;
}

// Cleanup on process exit
process.on('SIGINT', () => {
  databaseManager.cleanup();
});

process.on('SIGTERM', () => {
  databaseManager.cleanup();
});

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  getDatabaseInfo,
  isDatabaseConnected,
  getDatabaseManager
};