/**
 * concurrency.test.js
 * Database Concurrency Tests for Ticket Booking
 * Tests concurrent booking requests to ensure data integrity
 */
const request = require("supertest");
const app = require("../../server");
const jwt = require("jsonwebtoken");

// Generate a test JWT token using the same secret as the middleware
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const testToken = jwt.sign({ userId: 1 }, JWT_SECRET, { expiresIn: "30m" });

describe("Database Concurrency Tests", () => {
  test("should handle concurrent booking requests", async () => {
    const eventId = 1001;

    // Get initial ticket count
    const initialResponse = await request(app)
      .post("/api/llm/parse")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ text: "Show available events" });

    const initialEvent = initialResponse.body.events.find(
      (e) => e.id === eventId
    );
    const initialSold = initialEvent.tickets_sold;

    // Try to book 3 tickets concurrently
    const promises = Array(3)
      .fill(null)
      .map(() =>
        request(app)
          .post("/api/llm/confirm")
          .set("Authorization", `Bearer ${testToken}`)
          .send({ eventId, tickets: 1 })
      );

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.body.success).length;

    // Check final state
    const finalResponse = await request(app)
      .post("/api/llm/parse")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ text: "Show available events" });

    const finalEvent = finalResponse.body.events.find((e) => e.id === eventId);

    // Verify tickets were sold correctly
    expect(finalEvent.tickets_sold).toBe(initialSold + successful);
    expect(successful).toBeGreaterThan(0);
    expect(successful).toBeLessThanOrEqual(3);
  }, 10000);
});
