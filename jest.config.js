/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: parseInt(process.env.TEST_TIMEOUT, 10) || 60000, // Smoke test takes a long time
  // There are test cases that change the process working directory, and that does
  // not work with multiple workers.
  maxWorkers: 1,
};
