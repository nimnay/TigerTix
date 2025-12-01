/**
 * setup.js
 * Initializes the shared SQLite database.
 * Creates the database file if it doesn't exist and sets up the schema.
 */
const path = require('path');
const sqlite3 = require('sqlite3').verbose();   

const dbPath = path.resolve(__dirname, '../shared-db/database.sqlite');

async function setup() {
  return new Promise((resolve, reject) => {
    // Connect to shared database
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        return reject(err);
      }
      console.log('Connected to shared SQLite database');
    });

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          date TEXT NOT NULL,
          location TEXT NOT NULL,
          tickets INTEGER NOT NULL
        )`, (err) => {
        if (err) {
          console.error('Error creating events table:', err);
          db.close();
          return reject(err);
        }
        console.log('✓ Events table ensured in database');
        db.close((closeErr) => {
          if (closeErr) reject(closeErr);
          else resolve();
        });
      });
    });
  });
}

// Allow running directly or as a module
if (require.main === module) {
  setup()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}

module.exports = setup;


