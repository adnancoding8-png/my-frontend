/**
 * Simple validation script for error-handler utilities
 * This script validates that the error-handler functions work correctly
 * without requiring a full test framework setup.
 */

import {
  getErrorMessage,
  isConnectionError,
  isCorsError,
  isAuthError,
  logError,
  handleError,
} from '../error-handler.js';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

console.log('=== Validating Error Handler Utilities ===\n');

// Test isConnectionError
console.log('Testing isConnectionError()...');
const connError = new Error('Connection refused');
connError.code = 'ECONNREFUSED';
assert(isConnectionError(connError), 'Should detect ECONNREFUSED error');

const connError2 = new Error('Network Error');
connError2.connectionError = true;
assert(isConnectionError(connError2), 'Should detect connectionError flag');

const notConnError = new Error('Some error');
assert(!isConnectionError(notConnError), 'Should not detect non-connection errors');

// Test isCorsError
console.log('\nTesting isCorsError()...');
const corsError = new Error('CORS policy violation');
assert(isCorsError(corsError), 'Should detect CORS in error message');

const corsError2 = new Error('Error');
corsError2.corsError = true;
assert(isCorsError(corsError2), 'Should detect corsError flag');

const notCorsError = new Error('Some error');
assert(!isCorsError(notCorsError), 'Should not detect non-CORS errors');

// Test isAuthError
console.log('\nTesting isAuthError()...');
const authError = new Error('Unauthorized');
authError.response = { status: 401 };
assert(isAuthError(authError), 'Should detect 401 Unauthorized');

const authError2 = new Error('Token expired');
assert(isAuthError(authError2), 'Should detect Token in message');

const authError3 = new Error('Error');
authError3.authError = true;
assert(isAuthError(authError3), 'Should detect authError flag');

const notAuthError = new Error('Some error');
notAuthError.response = { status: 500 };
assert(!isAuthError(notAuthError), 'Should not detect non-auth errors');

// Test getErrorMessage
console.log('\nTesting getErrorMessage()...');
const msg1 = getErrorMessage(connError);
assert(msg1.includes('Unable to connect'), 'Should return connection error message');

const msg2 = getErrorMessage(corsError);
assert(msg2.includes('Server configuration error'), 'Should return CORS error message');

const msg3 = getErrorMessage(authError);
assert(msg3.includes('session has expired'), 'Should return auth error message');

const serverError = new Error('Error');
serverError.serverError = true;
const msg4 = getErrorMessage(serverError);
assert(msg4.includes('Server error'), 'Should return server error message');

// Test logError
console.log('\nTesting logError()...');
const error = new Error('Connection refused');
error.code = 'ECONNREFUSED';
error.config = { url: '/api/products', method: 'GET' };
const log = logError(error, { component: 'ProductList' });

assert(log.errorType === 'ConnectionError', 'Should classify as ConnectionError');
assert(log.timestamp !== undefined, 'Should include timestamp');
assert(log.context.component === 'ProductList', 'Should include context');
assert(log.request.url === '/api/products', 'Should include request details');

// Test handleError
console.log('\nTesting handleError()...');
const result = handleError(error, { component: 'ProductList' });

assert(result.message !== undefined, 'Should include user message');
assert(result.type === 'ConnectionError', 'Should include error type');
assert(result.isConnectionError === true, 'Should set isConnectionError flag');
assert(result.log !== undefined, 'Should include log');

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✓ All validations passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some validations failed!');
  process.exit(1);
}
