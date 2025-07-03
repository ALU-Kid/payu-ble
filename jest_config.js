module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file locations
  roots: ['<rootDir>/src', '<rootDir>/test', '<rootDir>/platform'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // TypeScript transformation
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    'platform/**/*.ts',
    '!src/**/*.d.ts',
    '!platform/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  
  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/index.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output for CI
  verbose: process.env.CI === 'true',
  
  // Test result processor for CI
  testResultsProcessor: process.env.CI ? 'jest-junit' : undefined,
  
  // Watch mode settings
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ]
};