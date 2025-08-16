/**
 * Jest Configuration for D-ID Integration Testing
 * QA Validation Engineer - Hive Mind Swarm
 */

export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ],
  
  // Module paths
  moduleDirectories: ['node_modules', 'src'],
  
  // Module name mapping for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/src/**/__tests__/**/*.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/**/*.stories.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  
  // Coverage thresholds (QA Requirements)
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    // Specific thresholds for D-ID integration
    'src/services/d-id/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    'src/components/AI/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Test timeout (important for D-ID API calls)
  testTimeout: 30000,
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Global setup
  globalSetup: '<rootDir>/tests/setup/global.setup.js',
  
  // Global teardown
  globalTeardown: '<rootDir>/tests/setup/global.teardown.js',
  
  // Test results processor for custom reporting
  testResultsProcessor: '<rootDir>/tests/setup/results-processor.js',
  
  // Custom reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'jest-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'D-ID Integration Test Report',
      logoImgPath: undefined,
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'node'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(axios|socket.io-client)/)'
  ],
  
  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Performance testing configuration
  maxWorkers: '50%',
  
  // Snapshot serializers
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ]
};