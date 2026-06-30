module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['./src/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',
    '!src/server.ts',
    '!src/worker.ts'
  ],
//   coverageThreshold: {
//     global: {
//       lines: 8,
//       statements: 8
//     }
//   },
  testTimeout: 15000,
  forceExit: true,
  clearMocks: true
}