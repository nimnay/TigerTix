// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  // Only run files matching these patterns
  testMatch: /.*\.spec\.js/,
  
  // Ignore Jest tests
  testIgnore: [
    '**/node_modules/**',
    '**/backend/**/tests/**',
    '**/frontend/src/tests/**',
    '**/*.test.js',
    '**/*.unit.test.js'
  ],
  
  timeout: 30 * 1000,
  
  expect: {
    timeout: 5000
  },
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // NO webServer section - start manually
});