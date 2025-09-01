/**
 * Jest Configuration for Morph Target Fix Test Suites
 * Optimized for Three.js, Babylon.js, Unity WebGL, and E2E testing
 */

export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.benchmark.js'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'mjs', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.m?js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }]
      ]
    }]
  },
  
  // Module name mapping for framework mocks
  moduleNameMapping: {
    '^three$': '<rootDir>/tests/__mocks__/three.js',
    '^@babylonjs/(.*)$': '<rootDir>/tests/__mocks__/babylonjs.js',
    '^unity-webgl$': '<rootDir>/tests/__mocks__/unity.js'
  },
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.benchmark.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/threejs/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/babylonjs/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/unity/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Test timeout
  testTimeout: 30000, // 30 seconds for complex tests
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'morph-target-test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Morph Target Fix Test Results'
    }],
    ['jest-junit', {
      outputDirectory: './test-reports',
      outputName: 'junit.xml',
      ancestorSeparator: ' › ',
      uniqueOutputName: 'false',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }]
  ],
  
  // Verbose output
  verbose: true,
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost',
    userAgent: 'Mozilla/5.0 (compatible; jsdom)',
    pretendToBeVisual: true,
    resources: 'usable'
  },
  
  // Module resolution
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>/tests'],
  
  // Globals for tests
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.JEST_WORKER_ID': '1',
    '__TEST_MODE__': true
  },
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Performance monitoring
  detectOpenHandles: true,
  detectLeaks: false,
  
  // Test sequencing
  maxWorkers: '50%', // Use half of available CPU cores
  
  // Error handling
  bail: false, // Don't stop on first test failure
  errorOnDeprecated: true,
  
  // Watch mode (for development)
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/test-reports/',
    '<rootDir>/.swarm/'
  ],
  
  // Custom test suites
  projects: [
    {
      displayName: 'Three.js Tests',
      testMatch: ['<rootDir>/tests/threejs/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-threejs.js']
    },
    {
      displayName: 'Babylon.js Tests',
      testMatch: ['<rootDir>/tests/babylonjs/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-babylonjs.js']
    },
    {
      displayName: 'Unity WebGL Tests',
      testMatch: ['<rootDir>/tests/unity/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-unity.js']
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-e2e.js'],
      testTimeout: 60000 // Longer timeout for E2E tests
    },
    {
      displayName: 'Performance Benchmarks',
      testMatch: ['<rootDir>/tests/performance/**/*.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-performance.js'],
      testTimeout: 120000, // Very long timeout for performance tests
      maxWorkers: 1 // Run performance tests sequentially
    }
  ]
};