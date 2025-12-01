/**
 * setup.js
 * Initializes the user authentication SQLite database.
 * Creates the database file if it doesn't exist and sets up the schema.
 */
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the init.sql script and the database file
const initSqlPath = path.resolve(__dirname, 'init.sql');
const dbPath = path.resolve(__dirname, 'auth.sqlite');

async function setup() {
  return new Promise((resolve, reject) => {
    let initSql;

    try {
      initSql = fs.readFileSync(initSqlPath, 'utf8');
    } catch (e) {
      console.error('Cannot read init.sql:', e.message);
      console.error('Expected at:', initSqlPath);
      return reject(e);
    }

    // Open (or create) the SQLite database
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Failed to open auth DB:', err.message);
        return reject(err);
      }
    });

    /**
     * Executes the SQL commands from init.sql to set up the database schema.
     */
    db.exec(initSql, (err) => {
      if (err) {
        console.error('Error initializing auth DB:', err.message);
        db.close();
        return reject(err);
      }
      console.log('✓ User authentication database initialized successfully!');
      db.close((closeErr) => {
        if (closeErr) reject(closeErr);
        else resolve();
      });
    });
  });
}

// Allow running directly or as a module
if (require.main === module) {
  setup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}

module.exports = setup;
