/**
 * setup.js
 * Initializes the shared SQLite database using the init.sql script.
 * Run this script before starting the admin service.
 * Creates the database file if it doesn't exist and sets up the schema.
 */
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the init.sql script and the database file
const initSqlPath = path.resolve(__dirname, '../shared-db/init.sql');
const dbPath = path.resolve(__dirname, '../shared-db/database.sqlite');

let initSql;

try {
  initSql = fs.readFileSync(initSqlPath, 'utf8');
} catch (e) {
  console.error('Cannot read init.sql:', e.message);
  console.error('Expected at:', initSqlPath);
  process.exit(1);
}

// Open (or create) the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
});

/**
 * Executes the SQL commands from init.sql to set up the database schema.
 * Logs success or error messages.
 * @param {Error|null} err - Any execution error encountered by SQLite.
 * @returns {void}
 * Side effect: Initializes the database schema.
 */
db.exec(initSql, (err) => {
  if (err) console.error('Error initializing DB:', err.message);
  else console.log(' Shared database initialized successfully!');
  db.close();
});
