/**
 * Preservation Property Tests for Error Handling and Authentication
 * 
 * GOAL: Ensure existing error handling and auth functionality is preserved
 */

const fs = require('fs');
const path = require('path');

describe('Preservation: Existing Error Handling and Authentication', () => {
  describe('Test 7.1: Error Handler Utilities', () => {
    it('should verify error handler utilities exist', () => {
      const utilPath = path.join(__dirname, '../../utils/errorHandler.js');
      const exists = fs.existsSync(utilPath);
      
      if (exists) {
        const utilContent = fs.readFileSync(utilPath, 'utf8');
        const hasHandleError = utilContent.includes('handleError');
        const hasSendSuccess = utilContent.includes('sendSuccessResponse');
        const hasSendError = utilContent.includes('sendErrorResponse');
        
        expect(hasHandleError).toBe(true);
        expect(hasSendSuccess).toBe(true);
        expect(hasSendError).toBe(true);
      } else {
        // If utils don't exist, check inline error handling in server.js
        const serverPath = path.join(__dirname, '../../server.js');
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        const hasErrorMiddleware = serverContent.includes('app.use((err, req, res, next)');
        expect(hasErrorMiddleware).toBe(true);
      }
    });
  });

  describe('Test 7.2: CORS Configuration', () => {
    it('should verify CORS is configured', () => {
      const serverPath = path.join(__dirname, '../../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const usesCors = serverContent.includes('app.use(') && serverContent.includes('cors(');
      const hasOrigins = serverContent.includes('origin:');
      const allowsLocalhost = serverContent.includes('localhost');
      
      expect(usesCors).toBe(true);
      expect(hasOrigins).toBe(true);
      expect(allowsLocalhost).toBe(true);
    });

    it('should verify CORS allows credentials', () => {
      const serverPath = path.join(__dirname, '../../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const allowsCredentials = serverContent.includes('credentials: true');
      
      expect(allowsCredentials).toBe(true);
    });
  });

  describe('Test 7.3: Authentication Middleware', () => {
    it('should verify auth routes exist', () => {
      const serverPath = path.join(__dirname, '../../server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const hasAuthRouter = serverContent.includes('authRouter') || 
                            serverContent.includes('auth-routes');
      const usesAuthRouter = serverContent.includes('app.use("/api/auth"');
      
      expect(hasAuthRouter).toBe(true);
      expect(usesAuthRouter).toBe(true);
    });
  });
});
