module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'commonjs',
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Refuses to run if DATABASE_URL is not a disposable database. See the file
  // for why: these suites delete every row in the tables they touch.
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  // These are integration suites: every one of them opens a connection to the
  // hosted Postgres instance in beforeAll and seeds fixtures. Jest's default
  // 5s hook timeout is shorter than a cold Neon connection, so all nine suites
  // failed on the hook before a single assertion ran.
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};




