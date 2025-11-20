/**
 * Integration Tests for Authentication Service
 * Tests end-to-end authentication flows including:
 * - User registration with password hashing
 * - Login and JWT generation
 * - Protected route access with JWT validation
 * - Token expiration handling
 * - Cookie vs Bearer token authentication
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

// Set test environment BEFORE requiring db-dependent modules
process.env.NODE_ENV = "test";

const authRoutes = require("../../routers/authRouter");
const authMiddleware = require("../../middleware/authMiddleware");
const { initializeDatabase } = require("../../db");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const TEST_DB_PATH = path.join(__dirname, "test-auth.db");

describe("Authentication Integration Tests", () => {
  let app;
  let db;

  beforeAll(async () => {
    // Delete existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Initialize database (will use test database due to NODE_ENV)
    db = await initializeDatabase();

    // Create test Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Mount auth routes
    app.use("/api/auth", authRoutes);

    // Mock protected Admin routes
    app.get("/api/admin/events", authMiddleware, (req, res) => {
      res.json({
        message: "Admin events accessed",
        userId: req.userId,
      });
    });

    // Mock protected Client routes
    app.post("/api/events/:id/purchase", authMiddleware, (req, res) => {
      res.json({
        message: "Purchase successful",
        eventId: req.params.id,
        userId: req.userId,
      });
    });
  });

  beforeEach(async () => {
    // Clear users table before each test
    await db.run("DELETE FROM users");
  });

  afterAll(async () => {
    // Close database connection
    if (db) {
      await db.close();
    }

    // Wait a bit for the database to fully close
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Clean up test database file
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (err) {
        // Ignore cleanup errors
        console.warn("Could not delete test database:", err.message);
      }
    }
  });

  // ===== POST /api/auth/register - User Registration =====
  describe("POST /api/auth/register - User Registration", () => {
    test("should register a new user and hash password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          password: "Password123!",
          email: "test@example.com",
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          message: "User registered successfully",
        })
      );
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("username", "testuser");

      // Verify user was created in database
      const user = await db.get(
        "SELECT * FROM users WHERE username = ?",
        "testuser"
      );
      expect(user).toBeDefined();
      expect(user.email).toBe("test@example.com");
      expect(user.password_hash).not.toBe("Password123!");
      expect(user.password_hash).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });

    test("should reject registration with missing fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          password: "Password123!",
          // missing email
        })
        .expect(400);

      expect(response.body).toEqual({
        message: "All fields are required",
      });
    });

    test("should reject duplicate username", async () => {
      // Register first user
      await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "Password123!",
        email: "test1@example.com",
      });

      // Try to register with same username
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          password: "DifferentPass123!",
          email: "test2@example.com",
        })
        .expect(409);

      expect(response.body.message).toContain("already exists");
    });
  });

  describe("POST /api/auth/login - User Login", () => {
    beforeEach(async () => {
      // Register a test user before each login test
      await request(app).post("/api/auth/register").send({
        username: "loginuser",
        password: "Password123!",
        email: "login@example.com",
      });
    });

    test("should login with valid credentials and return JWT", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "loginuser",
          password: "Password123!",
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("message", "Login successful");

      // Verify JWT is valid
      const decoded = jwt.verify(response.body.token, JWT_SECRET);
      expect(decoded).toHaveProperty("id");
      expect(decoded).toHaveProperty("iat");
      expect(decoded).toHaveProperty("exp");
    });

    test("should set JWT expiration to 30 minutes", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "loginuser",
          password: "Password123!",
        })
        .expect(200);

      const decoded = jwt.verify(response.body.token, JWT_SECRET);
      const tokenLifetime = decoded.exp - decoded.iat;

      // Should be exactly 30 minutes (1800 seconds)
      expect(tokenLifetime).toBe(30 * 60);
    });

    test("should reject login with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "loginuser",
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid credentials",
      });
      expect(response.body).not.toHaveProperty("token");
    });

    test("should reject login with non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "nonexistent",
          password: "Password123!",
        })
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid credentials",
      });
    });
  });

  describe("Protected Routes - JWT Authentication", () => {
    let validToken;
    let userId;

    beforeEach(async () => {
      // Register and login to get a valid token
      await request(app).post("/api/auth/register").send({
        username: "protecteduser",
        password: "Password123!",
        email: "protected@example.com",
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        username: "protecteduser",
        password: "Password123!",
      });

      validToken = loginResponse.body.token;
      const decoded = jwt.verify(validToken, JWT_SECRET);
      userId = decoded.id;
    });

    describe("Admin Routes - GET /api/admin/events", () => {
      test("should access admin route with valid Bearer token", async () => {
        const response = await request(app)
          .get("/api/admin/events")
          .set("Authorization", `Bearer ${validToken}`)
          .expect(200);

        expect(response.body).toEqual({
          message: "Admin events accessed",
          userId: userId,
        });
      });

      test("should access admin route with valid cookie", async () => {
        const response = await request(app)
          .get("/api/admin/events")
          .set("Cookie", [`token=${validToken}`])
          .expect(200);

        expect(response.body).toEqual({
          message: "Admin events accessed",
          userId: userId,
        });
      });

      test("should reject admin route without token", async () => {
        const response = await request(app)
          .get("/api/admin/events")
          .expect(401);

        expect(response.body).toEqual({
          message: "Authentication token missing",
        });
      });

      test("should reject admin route with invalid token", async () => {
        const response = await request(app)
          .get("/api/admin/events")
          .set("Authorization", "Bearer invalid.token.here")
          .expect(401);

        expect(response.body).toEqual({
          message: "Invalid or expired token",
        });
      });

      test("should reject admin route with expired token", async () => {
        const expiredToken = jwt.sign(
          { id: userId },
          JWT_SECRET,
          { expiresIn: "-1s" } // Already expired
        );

        const response = await request(app)
          .get("/api/admin/events")
          .set("Authorization", `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body).toEqual({
          message: "Invalid or expired token",
        });
      });
    });

    describe("Client Routes - POST /api/events/:id/purchase", () => {
      test("should access purchase route with valid Bearer token", async () => {
        const response = await request(app)
          .post("/api/events/123/purchase")
          .set("Authorization", `Bearer ${validToken}`)
          .send({ quantity: 2 })
          .expect(200);

        expect(response.body).toEqual({
          message: "Purchase successful",
          eventId: "123",
          userId: userId,
        });
      });

      test("should access purchase route with valid cookie", async () => {
        const response = await request(app)
          .post("/api/events/456/purchase")
          .set("Cookie", [`token=${validToken}`])
          .send({ quantity: 1 })
          .expect(200);

        expect(response.body).toEqual({
          message: "Purchase successful",
          eventId: "456",
          userId: userId,
        });
      });

      test("should reject purchase route without token", async () => {
        const response = await request(app)
          .post("/api/events/123/purchase")
          .send({ quantity: 2 })
          .expect(401);

        expect(response.body).toEqual({
          message: "Authentication token missing",
        });
      });

      test("should reject purchase route with malformed Authorization header", async () => {
        const response = await request(app)
          .post("/api/events/123/purchase")
          .set("Authorization", validToken) // Missing "Bearer " prefix
          .send({ quantity: 2 })
          .expect(401);

        expect(response.body).toEqual({
          message: "Authentication token missing",
        });
      });
    });
  });

  describe("Token Expiration (30 minutes)", () => {
    test("should trigger 401 when token expires", async () => {
      // Create a token that expires in 1 second
      const shortLivedToken = jwt.sign({ id: 999 }, JWT_SECRET, {
        expiresIn: "1s",
      });

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = await request(app)
        .get("/api/admin/events")
        .set("Authorization", `Bearer ${shortLivedToken}`)
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid or expired token",
      });
    });

    test("should accept token just before expiration", async () => {
      // Register and login
      await request(app).post("/api/auth/register").send({
        username: "expiryuser",
        password: "Password123!",
        email: "expiry@example.com",
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        username: "expiryuser",
        password: "Password123!",
      });

      const token = loginResponse.body.token;
      const decoded = jwt.verify(token, JWT_SECRET);

      // Verify token is valid and has proper expiration
      const timeUntilExpiry = decoded.exp - Math.floor(Date.now() / 1000);
      expect(timeUntilExpiry).toBeGreaterThan(29 * 60); // More than 29 minutes
      expect(timeUntilExpiry).toBeLessThanOrEqual(30 * 60); // Less than or equal to 30 minutes

      // Token should still work
      const response = await request(app)
        .get("/api/admin/events")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.userId).toBe(decoded.id);
    });
  });

  describe("Cookie vs Bearer Token Consistency", () => {
    let token;
    let userId;

    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        username: "consistencyuser",
        password: "Password123!",
        email: "consistency@example.com",
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        username: "consistencyuser",
        password: "Password123!",
      });

      token = loginResponse.body.token;
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    });

    test("should behave identically with Bearer token vs cookie", async () => {
      // Request with Bearer token
      const bearerResponse = await request(app)
        .get("/api/admin/events")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Request with cookie
      const cookieResponse = await request(app)
        .get("/api/admin/events")
        .set("Cookie", [`token=${token}`])
        .expect(200);

      // Both should return the same data
      expect(bearerResponse.body).toEqual(cookieResponse.body);
      expect(bearerResponse.body.userId).toBe(userId);
    });

    test("should prioritize Bearer token over cookie when both present", async () => {
      const bearerToken = jwt.sign({ id: 100 }, JWT_SECRET, {
        expiresIn: "30m",
      });
      const cookieToken = jwt.sign({ id: 200 }, JWT_SECRET, {
        expiresIn: "30m",
      });

      const response = await request(app)
        .get("/api/admin/events")
        .set("Authorization", `Bearer ${bearerToken}`)
        .set("Cookie", [`token=${cookieToken}`])
        .expect(200);

      // Should use Bearer token (id: 100)
      expect(response.body.userId).toBe(100);
    });

    test("should reject invalid Bearer token even with valid cookie", async () => {
      const response = await request(app)
        .get("/api/admin/events")
        .set("Authorization", "Bearer invalid.token")
        .set("Cookie", [`token=${token}`])
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid or expired token",
      });
    });

    test("should fallback to cookie when Bearer token missing", async () => {
      const response = await request(app)
        .get("/api/admin/events")
        .set("Cookie", [`token=${token}`])
        .expect(200);

      expect(response.body.userId).toBe(userId);
    });
  });

  describe("POST /api/auth/logout", () => {
    test("should clear token cookie on logout", async () => {
      const response = await request(app).post("/api/auth/logout").expect(200);

      expect(response.body).toEqual({
        message: "Logout successful on client side",
      });

      // Check that Set-Cookie header clears the token
      const setCookieHeader = response.headers["set-cookie"];
      if (setCookieHeader) {
        expect(setCookieHeader[0]).toContain("token=");
        expect(setCookieHeader[0]).toMatch(/Max-Age=0|Expires=/); // CHANGED
      }
    });
  });

  describe("End-to-End Authentication Flow", () => {
    test("should complete full registration -> login -> protected access flow", async () => {
      // Step 1: Register
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          username: "e2euser",
          password: "E2EPassword123!",
          email: "e2e@example.com",
        })
        .expect(201);

      expect(registerResponse.body.message).toBe(
        "User registered successfully"
      );

      // Step 2: Login
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          username: "e2euser",
          password: "E2EPassword123!",
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty("token");
      const token = loginResponse.body.token;

      // Step 3: Access protected admin route
      const adminResponse = await request(app)
        .get("/api/admin/events")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(adminResponse.body.message).toBe("Admin events accessed");

      // Step 4: Access protected client route
      const clientResponse = await request(app)
        .post("/api/events/999/purchase")
        .set("Authorization", `Bearer ${token}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(clientResponse.body.message).toBe("Purchase successful");
      expect(clientResponse.body.eventId).toBe("999");

      // Step 5: Logout
      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .expect(200);

      expect(logoutResponse.body.message).toContain("Logout successful");
    });
  });
});
