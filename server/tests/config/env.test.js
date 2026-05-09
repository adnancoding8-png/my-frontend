const {
    validateEnvVar,
    validateEnvironment,
    generateErrorMessage,
    requiredServerEnvVars
} = require('../../config/env');

// Mock process.env for testing
const originalEnv = process.env;

describe('Environment Validation', () => {
    beforeEach(() => {
        // Reset process.env before each test
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        // Restore original process.env
        process.env = originalEnv;
    });

    describe('validateEnvVar', () => {
        test('should validate required string variable successfully', () => {
            const result = validateEnvVar('TEST_VAR', 'test_value', {
                type: 'string',
                required: true
            });

            expect(result.isValid).toBe(true);
            expect(result.value).toBe('test_value');
            expect(result.errors).toHaveLength(0);
        });

        test('should fail validation for missing required variable', () => {
            const result = validateEnvVar('TEST_VAR', undefined, {
                type: 'string',
                required: true
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('TEST_VAR is required but not provided');
        });

        test('should use default value when variable is not provided', () => {
            const result = validateEnvVar('TEST_VAR', undefined, {
                type: 'string',
                default: 'default_value'
            });

            expect(result.isValid).toBe(true);
            expect(result.value).toBe('default_value');
        });

        test('should validate number type correctly', () => {
            const result = validateEnvVar('PORT', '5001', {
                type: 'number',
                default: 3000
            });

            expect(result.isValid).toBe(true);
            expect(result.value).toBe(5001);
        });

        test('should fail validation for invalid number', () => {
            const result = validateEnvVar('PORT', 'invalid_number', {
                type: 'number',
                required: true
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('PORT must be a valid number, got: invalid_number');
        });

        test('should validate string length requirement', () => {
            const result = validateEnvVar('JWT_SECRET', 'short', {
                type: 'string',
                required: true,
                minLength: 32
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('JWT_SECRET must be at least 32 characters long, got 5 characters');
        });

        test('should validate enum values', () => {
            const result = validateEnvVar('NODE_ENV', 'invalid_env', {
                type: 'string',
                enum: ['development', 'production', 'test']
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('NODE_ENV must be one of: development, production, test, got: invalid_env');
        });

        test('should pass enum validation with valid value', () => {
            const result = validateEnvVar('NODE_ENV', 'production', {
                type: 'string',
                enum: ['development', 'production', 'test']
            });

            expect(result.isValid).toBe(true);
            expect(result.value).toBe('production');
        });
    });

    describe('validateEnvironment', () => {
        test('should pass validation with all required variables', () => {
            // Set up valid environment
            process.env.PORT = '5001';
            process.env.MONGO_URI = 'mongodb://localhost:27017/test';
            process.env.JWT_SECRET = 'this_is_a_very_long_jwt_secret_key_for_testing_purposes';
            process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
            process.env.CLOUDINARY_API_KEY = 'test_api_key';
            process.env.CLOUDINARY_API_SECRET = 'test_api_secret';
            process.env.NODE_ENV = 'development';

            const result = validateEnvironment();

            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.validatedEnv.PORT).toBe(5001);
            expect(result.validatedEnv.MONGO_URI).toBe('mongodb://localhost:27017/test');
        });

        test('should fail validation with missing required variables', () => {
            // Only set some variables, leave others missing
            process.env.PORT = '5001';
            // Missing MONGO_URI, JWT_SECRET, etc.

            const result = validateEnvironment();

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);

            // Check that missing variables are reported
            const missingVars = result.errors.filter(e =>
                e.errors.some(err => err.includes('is required but not provided'))
            );
            expect(missingVars.length).toBeGreaterThan(0);
        });

        test('should use default values for optional variables', () => {
            // Set only required variables
            process.env.MONGO_URI = 'mongodb://localhost:27017/test';
            process.env.JWT_SECRET = 'this_is_a_very_long_jwt_secret_key_for_testing_purposes';
            process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
            process.env.CLOUDINARY_API_KEY = 'test_api_key';
            process.env.CLOUDINARY_API_SECRET = 'test_api_secret';
            // Don't set PORT and NODE_ENV to test defaults

            const result = validateEnvironment();

            expect(result.success).toBe(true);
            expect(result.validatedEnv.PORT).toBe(5001); // Default value
            expect(result.validatedEnv.NODE_ENV).toBe('development'); // Default value
        });

        test('should handle invalid variable formats', () => {
            // Set up environment with invalid values
            process.env.PORT = 'not_a_number';
            process.env.MONGO_URI = 'mongodb://localhost:27017/test';
            process.env.JWT_SECRET = 'short'; // Too short
            process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
            process.env.CLOUDINARY_API_KEY = 'test_api_key';
            process.env.CLOUDINARY_API_SECRET = 'test_api_secret';
            process.env.NODE_ENV = 'invalid_env';

            const result = validateEnvironment();

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);

            // Check for specific validation errors
            const portError = result.errors.find(e => e.variable === 'PORT');
            expect(portError).toBeDefined();

            const jwtError = result.errors.find(e => e.variable === 'JWT_SECRET');
            expect(jwtError).toBeDefined();

            const nodeEnvError = result.errors.find(e => e.variable === 'NODE_ENV');
            expect(nodeEnvError).toBeDefined();
        });
    });

    describe('generateErrorMessage', () => {
        test('should generate helpful error message for missing variables', () => {
            const validationResult = {
                errors: [
                    {
                        variable: 'JWT_SECRET',
                        errors: ['JWT_SECRET is required but not provided']
                    },
                    {
                        variable: 'MONGO_URI',
                        errors: ['MONGO_URI is required but not provided']
                    }
                ]
            };

            const errorMessage = generateErrorMessage(validationResult);

            expect(errorMessage.type).toBe('ENVIRONMENT_ERROR');
            expect(errorMessage.missing).toContain('JWT_SECRET');
            expect(errorMessage.missing).toContain('MONGO_URI');
            expect(errorMessage.suggestions).toContain('Copy server/.env.example to server/.env and fill in the required values');
        });

        test('should generate specific suggestions for JWT_SECRET', () => {
            const validationResult = {
                errors: [
                    {
                        variable: 'JWT_SECRET',
                        errors: ['JWT_SECRET is required but not provided']
                    }
                ]
            };

            const errorMessage = generateErrorMessage(validationResult);

            expect(errorMessage.suggestions).toContain('Generate a secure JWT_SECRET with at least 32 characters');
        });

        test('should generate specific suggestions for Cloudinary variables', () => {
            const validationResult = {
                errors: [
                    {
                        variable: 'CLOUDINARY_API_KEY',
                        errors: ['CLOUDINARY_API_KEY is required but not provided']
                    }
                ]
            };

            const errorMessage = generateErrorMessage(validationResult);

            expect(errorMessage.suggestions).toContain('Sign up for Cloudinary and get your API credentials from the dashboard');
        });

        test('should handle invalid variable formats', () => {
            const validationResult = {
                errors: [
                    {
                        variable: 'PORT',
                        value: 'abc',
                        errors: ['PORT must be a valid number, got: abc']
                    }
                ]
            };

            const errorMessage = generateErrorMessage(validationResult);

            expect(errorMessage.invalid).toHaveLength(1);
            expect(errorMessage.invalid[0].variable).toBe('PORT');
            expect(errorMessage.invalid[0].value).toBe('abc');
        });
    });

    describe('requiredServerEnvVars schema', () => {
        test('should have all expected environment variables defined', () => {
            const expectedVars = [
                'PORT',
                'MONGO_URI',
                'JWT_SECRET',
                'CLOUDINARY_CLOUD_NAME',
                'CLOUDINARY_API_KEY',
                'CLOUDINARY_API_SECRET',
                'NODE_ENV'
            ];

            expectedVars.forEach(varName => {
                expect(requiredServerEnvVars).toHaveProperty(varName);
                expect(requiredServerEnvVars[varName]).toHaveProperty('type');
                expect(requiredServerEnvVars[varName]).toHaveProperty('description');
            });
        });

        test('should have correct schema for JWT_SECRET', () => {
            const jwtSchema = requiredServerEnvVars.JWT_SECRET;

            expect(jwtSchema.type).toBe('string');
            expect(jwtSchema.required).toBe(true);
            expect(jwtSchema.minLength).toBe(32);
        });

        test('should have correct schema for PORT', () => {
            const portSchema = requiredServerEnvVars.PORT;

            expect(portSchema.type).toBe('number');
            expect(portSchema.default).toBe(5001);
        });

        test('should have correct schema for NODE_ENV', () => {
            const nodeEnvSchema = requiredServerEnvVars.NODE_ENV;

            expect(nodeEnvSchema.type).toBe('string');
            expect(nodeEnvSchema.default).toBe('development');
            expect(nodeEnvSchema.enum).toEqual(['development', 'production', 'test']);
        });
    });
});