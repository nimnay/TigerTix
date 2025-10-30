// checkDB.js — quick script to see what's inside the shared database
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// path to shared DB (adjust if your structure differs)
const dbPath = path.resolve(__dirname, "./shared-db/database.sqlite");

// connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// query all events
db.all("SELECT * FROM events", [], (err, rows) => {
  if (err) {
    console.error("❌ Error reading events:", err.message);
  } else if (rows.length === 0) {
    console.log("📭 No events found in DB.");
  } else {
    console.log("📋 Current events in DB:");
    console.table(rows);
  }
  db.close();
});
