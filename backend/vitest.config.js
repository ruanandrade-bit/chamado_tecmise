import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    pool: 'forks',          // isolates each test file in its own process
    testTimeout: 10000,
    reporters: ['verbose'],
  }
})
