-- SQL Script with table creation statements for shared database
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    number_of_tickets INTEGER NOT NULL CHECK(number_of_tickets >= 0),
    tickets_sold INTEGER NOT NULL DEFAULT 0 CHECK(tickets_sold >= 0),
    location TEXT NOT NULL,
    description TEXT
);
