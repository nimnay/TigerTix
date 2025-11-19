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
  await page.getByLabel(/confirm password/i).fill(password);
  await page.click('button[type="submit"]');
}

async function loginUser(page, username, password) {
  await page.goto('http://localhost:3000/login');
  await page.getByLabel(/email|username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
}

function generateTestUser() {
  const randomId = Math.random().toString(36).substring(2, 8); // 6-char ID
  return {
    username: `test${randomId}`,       // total < 15 chars
    email: `test${randomId}@example.com`,
    password: 'Test123!'
  };
}

async function createAndLogin(page) {
  const user = generateTestUser();
  await registerUser(page, user.username, user.email, user.password, user.password);
  return user; // Return credentials for later use
}

test.describe('Authentication E2E Tests', () => {
  
  test('User can register and immediately access protected content', async ({ page }) => {
    const user = generateTestUser();
    await registerUser(page, user.username, user.email, user.password, user.password);
    
    await expect(page.getByRole('heading', { name: /Clemson Campus Events/i })).toBeVisible();
    await expect(page.locator(`text=Logged in as ${user.username}`)).toBeVisible();
    
    await page.goto('http://localhost:3000/events');
    await expect(page).not.toHaveURL(/login/);
  });

  test('User can register, log out, then log back in and access protected routes', async ({ page }) => {
    const user = generateTestUser();

    // Register the user first
    await registerUser(page, user.username, user.email, user.password, user.password);

    // (Optional) Log out if your app requires it before testing login
    await page.goto('http://localhost:3000/logout');

    // Now log back in using the login function
    await loginUser(page, user.username, user.password);

    // Assertion: Username appears after login
    await expect(page.locator(`text=Logged in as ${user.username}`)).toBeVisible();

    // Confirm access to a protected route
    await page.goto('http://localhost:3000/admin');
    await expect(page).not.toHaveURL(/login/);
  });

  test('Logout clears token and blocks protected routes', async ({ page }) => {
    const user = await createAndLogin(page);
    
    await page.click('text=Logout');
    await expect(page).toHaveURL(/(login|\/$)/);
    
    await page.goto('http://localhost:3000/admin');
    await expect(page).toHaveURL(/login|localhost:3000/);
  });

  test('Invalid credentials show error message', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await loginUser(page, 'wronguser', 'WrongPass123!');
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible({ timeout: 3000 });
    await expect(page).toHaveURL(/login/);
  });
});