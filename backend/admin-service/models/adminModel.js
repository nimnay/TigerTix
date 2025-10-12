/**
 * adminModel.js
 * Handles database operation for the event table in the shared database.
 * Uses SQLite3 for database interactions.
 * Creates a new event in the events table.
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../shared-db/database.sqlite");
// Connects to the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

/**
 * Creates a new event in the events table.
 * @param {Object} event - The event object containing event details.
 * Properties: name, date, number_of_tickets, location, description
 * @param {Function} callback - Callback function to handle the result or error.
 * @returns {void} - Inserts a row into the events table, connects to sqlite3 database.
 * Side effect: Adds a new event to the events table in the database.
 */
exports.createEvent = (event, callback) => {
    const { name, date, number_of_tickets, location, description } = event;
    const sql = `INSERT INTO events (name, date, number_of_tickets, location, description)
               VALUES (?, ?, ?, ?, ?)`;

    // Use a transaction to ensure data integrity
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const sql = `INSERT INTO events (name, date, number_of_tickets, location, description)
            VALUES (?, ?, ?, ?, ?)`;

        // Execute the insert statement
        db.run(sql, [name, date, number_of_tickets, location, description], function (err) {
            if (err) {
                console.error("Error creating event:", err);
                db.run("ROLLBACK");
                return callback(err);
            }

            // Commit the transaction
            db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                    console.error("Commit failed:", commitErr);
                    return callback(commitErr);
                }
                callback(null, { id: this.lastID, ...event });
            });
        });
    });
}
