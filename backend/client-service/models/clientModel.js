// Connecting to SQLite and defining functions for reading events and purchasing tickets

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Connect to shared database in shared-db
const dbPath = path.resolve(__dirname, '../../shared-db/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

/**
 * Purpose: Fetch all events from shared database
 * @param {function} callback - function to call with results or error
 * @return {void} - Results are returned asynchronously via callback
 * Side effects: Executes a SQL SELECT query on the shared database 
 *                  and logs error if one occurs
 * 
 */
function getAllEvents(callback) {
    db.all("SELECT * FROM events", [], (err, rows) => {
        if (err) {
            console.error('Error fetching events', err);
            callback(err);
        } else {
            callback(null, rows);
        }
    } );
}

/**
 * Purpose: Purchase a ticket for an event, update ticket count in shared database
 * @param {number} eventId - ID of the event to purchase ticket for
 * @param {function} callback - function to call with results or error
 * @return {void} - Results are returned asynchronously via callback
 * Side effects: Executes a SQL INSERT query on the shared database
 *                 and logs error if one occurs
*/
function purchaseTicket(eventId, callback) {
    db.get("SELECT tickets FROM events WHERE id=?", [eventId], (err, row) => {
        if (err) return callback(err);
        if (!row) return callback(new Error('Event not found'));
        if (row.tickets <= 0) return callback(new Error('No tickets available'));

    db.run("BEGIN TRANSACTION");
    db.run("UPDATE events SET tickets = tickets - 1 WHERE id = ?", [eventId], function (err) {
        if (err) {
            db.run("ROLLBACK");
            return callback(err);
        }
        db.run("COMMIT");
        callback(null, { success: true, message: 'Ticket purchased successfully' });
    });
    });
}

module.exports = { getAllEvents, purchaseTicket };

