/**
 * Preservation Property Tests for Server Functionality
 * 
 * GOAL: Ensure existing server lifecycle functionality is preserved
 */

const fs = require('fs');
const path = require('path');

describe('Preservation: Existing Server Functionality', () => {
  describe('Test 8.1: Database Connection', () => {
    it('should verify database connection is configured', () => {
      const serverPath = path.join(__dirname, '../../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const importsDatabase = serverContent.includes('database') || 
                              serverContent.includes('connectToDatabase');
      const callsConnect = serverContent.includes('connectToDatabase()');
      
      expect(importsDatabase).toBe(true);
      expect(callsConnect).toBe(true);
    });

    it('should verify DatabaseManager exists', () => {
      const dbPath = path.join(__dirname, '../../config/DatabaseManager.js');
      const exists = fs.existsSync(dbPath);
      
      expect(exists).toBe(true);
    });
  });

  describe('Test 8.2: Graceful Shutdown', () => {
    it('should verify graceful shutdown handler exists', () => {
      const serverPath = path.join(__dirname, '../../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const hasShutdownHandler = serverContent.includes('handleGracefulShutdown') ||
                                  serverContent.includes('SIGTERM') ||
                                  serverContent.includes('SIGINT');
      const closesConnections = serverContent.includes('disconnectFromDatabase');
      
      expect(hasShutdownHandler).toBe(true);
      expect(closesConnections).toBe(true);
    });
  });

  describe('Test 8.3: Health Check Endpoint', () => {
    it('should verify health check endpoint exists', () => {
      const serverPath = path.join(__dirname, '../../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const hasHealthCheck = serverContent.includes("app.get('/'") ||
                             serverContent.includes('app.get("/")');
      const returnsStatus = serverContent.includes('res.status(200)') ||
                            serverContent.includes('res.json');
      
      expect(hasHealthCheck).toBe(true);
      expect(returnsStatus).toBe(true);
    });
  });

  describe('Test 8.4: Express Middleware', () => {
    it('should verify cookie parser is used', () => {
      const serverPath = path.join(__dirname, '../../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const usesCookieParser = serverContent.includes('cookieParser');
      
      expect(usesCookieParser).toBe(true);
    });

    it('should verify JSON body parser is used', () => {
      const serverPath = path.join(__dirname, '../../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const usesJsonParser = serverContent.includes('express.json(') || 
                             serverContent.includes('express.json()');
      
      expect(usesJsonParser).toBe(true);
    });
  });

  describe('Test 8.5: WebSocket Server', () => {
    it('should verify WebSocket server is configured', () => {
      const serverPath = path.join(__dirname, '../../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const hasWebSocket = serverContent.includes('WebSocketServer') ||
                           serverContent.includes('ws');
      
      expect(hasWebSocket).toBe(true);
    });
  });
});
