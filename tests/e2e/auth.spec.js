// tests/e2e/auth.spec.js
import { test, expect } from "@playwright/test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let backendProcess;
let frontendProcess;

test.beforeAll(async () => {
  // Check if servers are already running (e.g., in CI/CD)
  let serversAlreadyRunning = false;
  try {
    const response = await fetch("http://localhost:3000");
    serversAlreadyRunning = true;
    console.log("Servers already running, skipping startup...");
  } catch (e) {
    console.log("Servers not detected, starting them...");
  }

  if (!serversAlreadyRunning) {
    console.log("Starting backend server...");
    backendProcess = exec("cd backend && npm start", (error) => {
      if (error) console.error("Backend error:", error);
    });

    console.log("Starting frontend server...");
    frontendProcess = exec("cd frontend && npm start", (error) => {
      if (error) console.error("Frontend error:", error);
    });

    // Wait for servers to be ready
    console.log("Waiting for servers to start...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check if servers are actually responding
    let retries = 0;
    while (retries < 30) {
      try {
        const response = await fetch("http://localhost:3000");
        if (response.ok || response.status === 404) break;
      } catch (e) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        retries++;
      }
    }
  }
  console.log("Servers ready!");
});

test.afterAll(async () => {
  // Only kill processes if we started them
  if (backendProcess || frontendProcess) {
    console.log("Shutting down servers...");
    if (backendProcess) backendProcess.kill();
    if (frontendProcess) frontendProcess.kill();

    // Kill any lingering processes (optional, for cleanup)
    try {
      if (process.platform === "win32") {
        await execAsync("taskkill /F /IM node.exe /T");
      } else {
        await execAsync('pkill -f "node.*backend"');
        await execAsync('pkill -f "node.*frontend"');
      }
    } catch (e) {
      // Processes already killed
    }
  } else {
    console.log("Servers were already running, not shutting them down...");
  }
});

// Helper functions
async function registerUser(page, username, email, password) {
  await page.goto("http://localhost:3000");
  await page.getByRole("button", { name: /register/i }).click();
  await page.waitForTimeout(500);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole("button", { name: /^register$/i }).click();
  await page.waitForTimeout(1000);
}

async function loginUser(page, username, password) {
  await page.goto("http://localhost:3000");
  await page.getByLabel(/email or username/i).fill(username);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();
  await page.waitForTimeout(1000);
}

function generateTestUser() {
  const randomId = Math.random().toString(36).substring(2, 8); // 6-char ID
  return {
    username: `test${randomId}`, // total < 15 chars
    email: `test${randomId}@example.com`,
    password: "Test123!",
  };
}

async function createAndLogin(page) {
  const user = generateTestUser();
  await registerUser(
    page,
    user.username,
    user.email,
    user.password,
    user.password
  );
  return user; // Return credentials for later use
}

test.describe("Authentication E2E Tests", () => {
  test("User can register and immediately access protected content", async ({
    page,
  }) => {
    const user = generateTestUser();
    await registerUser(page, user.username, user.email, user.password);

    await expect(
      page.getByRole("heading", { name: /Clemson Campus Events/i })
    ).toBeVisible();
    await expect(page.locator("text=Logged in as")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator(`strong:has-text("${user.username}")`)
    ).toBeVisible();
  });

  test("User can register, log out, then log back in", async ({ page }) => {
    const user = generateTestUser();

    // Register the user first
    await registerUser(page, user.username, user.email, user.password);
    await expect(page.locator("text=Logged in as")).toBeVisible({
      timeout: 10000,
    });

    // Log out
    await page.getByRole("button", { name: /logout/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();

    // Log back in
    await loginUser(page, user.username, user.password);

    // Assertion: Username appears after login
    await expect(page.locator("text=Logged in as")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator(`strong:has-text(\"${user.username}\")`)
    ).toBeVisible();
  });

  test("Logout clears token and blocks protected routes", async ({ page }) => {
    const user = await createAndLogin(page);

    await expect(page.locator("text=Logged in as")).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: /logout/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();
    await expect(page.locator("text=Logged in as")).not.toBeVisible();
  });

  test("Invalid credentials show error message", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await loginUser(page, "wronguser", "WrongPass123!");
    await expect(page.locator("text=/invalid credentials/i")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();
  });

  test("User can book an event successfully after logging in", async ({
    page,
  }) => {
    const user = await createAndLogin(page);

    await expect(
      page.getByRole("heading", { name: /Clemson Campus Events/i })
    ).toBeVisible();
    await expect(page.locator("text=Logged in as")).toBeVisible({
      timeout: 10000,
    });

    // Wait for events to load - look for buy ticket button
    await page.waitForSelector('button:has-text("Buy Ticket")', {
      timeout: 10000,
    });


    // Get the first event's ticket count before booking
    const firstEventText = await page.locator('li').first().textContent();
    const ticketMatch = firstEventText.match(/Tickets Available:\s*(\d+)/);
    expect(ticketMatch).not.toBeNull();
    const initialTicketCount = parseInt(ticketMatch[1], 10);
    expect(initialTicketCount).toBeGreaterThan(0);


    // Find the first Buy Ticket button and click it
    const buyButton = page.locator('button:has-text("Buy Ticket")').first();
    await buyButton.click();
    await page.waitForTimeout(1500);

    // Verify ticket count decreased by 1
    const updatedEventText = await page.locator('li').first().textContent();
    const updatedTicketMatch = updatedEventText.match(/Tickets Available:\s*(\d+)/);
    expect(updatedTicketMatch).not.toBeNull();
    const updatedTicketCount = parseInt(updatedTicketMatch[1], 10);
    
    expect(updatedTicketCount).toBe(initialTicketCount - 1);

  });
});
