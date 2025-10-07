// setup.js is used to initialize the database (creating tables if they don't exist)
// and ensure the shared database file is in place.

const path = require('path');

const sqlite3 = require('sqlite3').verbose();   
const dbPath = path.resolve(__dirname, '../../shared-db/database.sqlite');

dbPath.serialize((() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            location TEXT NOT NULL,
            tickets INTEGER NOT NULL
        )`
    , (err) => {
        if (err) {
            console.error('Error creating events table', err);
        } else {
            console.log('Events table ensured in database');
        }
    });
}) );

console.log('Database setup complete');
//Export the database connection for reuse if needed
module.exports = db;

