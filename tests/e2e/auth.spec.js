// tests/e2e/auth.spec.js
import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let backendProcess;
let frontendProcess;

test.beforeAll(async () => {
  console.log('Starting backend server...');
  backendProcess = exec('cd backend && npm start', (error) => {
    if (error) console.error('Backend error:', error);
  });

  console.log('Starting frontend server...');
  frontendProcess = exec('cd frontend && npm start', (error) => {
    if (error) console.error('Frontend error:', error);
  });

  // Wait for servers to be ready
  console.log('Waiting for servers to start...');
  await new Promise(resolve => setTimeout(resolve, 5000)); // Adjust time as needed
  
  // Better: Check if servers are actually responding
  let retries = 0;
  while (retries < 30) {
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok || response.status === 404) break;
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }
  }
  console.log('Servers ready!');
});

test.afterAll(async () => {
  console.log('Shutting down servers...');
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
  
  // Kill any lingering processes (optional, for cleanup)
  try {
    if (process.platform === 'win32') {
      await execAsync('taskkill /F /IM node.exe /T');
    } else {
      await execAsync('pkill -f "node.*backend"');
      await execAsync('pkill -f "node.*frontend"');
    }
  } catch (e) {
    // Processes already killed
  }
});

// Helper functions
async function registerUser(page, username, email, password) {
  await page.goto('http://localhost:3000');
  await page.click('text=Register');
  await page.fill('[name="username"]', username);
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
}

async function loginUser(page, username, password) {
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="username"]', username);
  await page.fill('[name="password"]', password);
  await page.click('button:has-text("Login")');
  await page.waitForURL(/dashboard|home/, { timeout: 5000 });
}

function generateTestUser() {
  const timestamp = Date.now();
  return {
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'Test123!'
  };
}

test.describe('Authentication E2E Tests', () => {
  
  test('User can register and immediately access protected content', async ({ page }) => {
    const user = generateTestUser();
    await registerUser(page, user.username, user.email, user.password);
    
    await expect(page).toHaveURL(/dashboard|home/, { timeout: 5000 });
    await expect(page.locator('text=/logged in|welcome/i')).toBeVisible();
    
    await page.goto('http://localhost:3000/events');
    await expect(page).not.toHaveURL(/login/);
  });

  test('User can login and access protected routes', async ({ page }) => {
    await loginUser(page, 'testuser', 'Test123!');
    
    await expect(page.locator('text=/logged in/i')).toBeVisible();
    
    await page.goto('http://localhost:3000/admin');
    await expect(page).not.toHaveURL(/login/);
  });

  test('Logout clears token and blocks protected routes', async ({ page }) => {
    await loginUser(page, 'testuser', 'Test123!');
    
    await page.click('text=Logout');
    await expect(page).toHaveURL(/login|^\/$/, { timeout: 5000 });
    
    await page.goto('http://localhost:3000/admin');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('Invalid credentials show error message', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('[name="username"]', 'wronguser');
    await page.fill('[name="password"]', 'WrongPass123!');
    await page.click('button:has-text("Login")');
    
    await expect(page.locator('text=/invalid|error|wrong/i')).toBeVisible({ timeout: 3000 });
    await expect(page).toHaveURL(/login/);
  });
});