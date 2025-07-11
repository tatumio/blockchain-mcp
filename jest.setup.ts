import 'jest';

// Global test setup
global.console = {
  ...console,
  // Suppress console.warn in tests unless explicitly needed
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';