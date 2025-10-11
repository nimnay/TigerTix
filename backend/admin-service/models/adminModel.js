// this file is responsible for interacting with the database for admin-related operations

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../shared-db/database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

exports.createEvent = (event, callback) =>
{
    const { name, date, number_of_tickets, location, description } = event;
    const sql = `INSERT INTO events (name, date, number_of_tickets, location, description)
               VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [name, date, number_of_tickets, location, description], function (err) {
        if (err) {
            console.error('Error creating event:', err);
            return callback(err);
        }
        callback(null, { id: this.lastID, ...event });
    });
}
