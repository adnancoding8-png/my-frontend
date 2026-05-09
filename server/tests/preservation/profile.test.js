/**
 * Preservation Property Tests for Profile Functionality
 * 
 * GOAL: Ensure existing profile management functionality is preserved after bug fixes
 */

const fs = require('fs');
const path = require('path');

describe('Preservation: Existing Profile Functionality', () => {
  describe('Test 6.1: Profile Controller Functions', () => {
    it('should verify getUserProfile function exists', () => {
      const controllerPath = path.join(__dirname, '../../controllers/shop/profile-controller.js');
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      
      const hasGetUserProfile = controllerContent.includes('const getUserProfile = async');
      const findsUser = controllerContent.includes('User.findById(userId)');
      const excludesPassword = controllerContent.includes("select('-password')");
      
      expect(hasGetUserProfile).toBe(true);
      expect(findsUser).toBe(true);
      expect(excludesPassword).toBe(true);
    });

    it('should verify updateUserProfile function exists', () => {
      const controllerPath = path.join(__dirname, '../../controllers/shop/profile-controller.js');
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      
      const hasUpdateProfile = controllerContent.includes('const updateUserProfile = async');
      const validatesInput = controllerContent.includes('if (!userName || !email)');
      const checksDuplicates = controllerContent.includes('existingUser');
      
      expect(hasUpdateProfile).toBe(true);
      expect(validatesInput).toBe(true);
      expect(checksDuplicates).toBe(true);
    });

    it('should verify getUserStats function exists', () => {
      const controllerPath = path.join(__dirname, '../../controllers/shop/profile-controller.js');
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      
      const hasGetStats = controllerContent.includes('const getUserStats = async');
      const calculatesStats = controllerContent.includes('totalOrders');
      const calculatesSpent = controllerContent.includes('totalSpent');
      
      expect(hasGetStats).toBe(true);
      expect(calculatesStats).toBe(true);
      expect(calculatesSpent).toBe(true);
    });
  });

  describe('Test 6.2: Profile Statistics Calculation', () => {
    it('should verify statistics include order aggregation', () => {
      const controllerPath = path.join(__dirname, '../../controllers/shop/profile-controller.js');
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      
      const findsOrders = controllerContent.includes('Order.find({ userId: userId })');
      const calculatesTotal = controllerContent.includes('orders.length');
      const calculatesAmount = controllerContent.includes('reduce((sum, order)');
      
      expect(findsOrders).toBe(true);
      expect(calculatesTotal).toBe(true);
      expect(calculatesAmount).toBe(true);
    });
  });
});
