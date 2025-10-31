// Connecting to database via LLM 

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('LLM Service connected to SQLite database');
  }
});

/**
 * Get all events with available tickets
 * Calculates available tickets as: number_of_tickets - tickets_sold
 * @param {Function} callback - Callback function(err, events)
 * @returns {void}
 */
function getAvailableEvents(callback) {
  const query = `
    SELECT 
      id, 
      name, 
      date, 
      location, 
      description,
      number_of_tickets,
      tickets_sold,
      (number_of_tickets - tickets_sold) as available_tickets
    FROM events
    WHERE (number_of_tickets - tickets_sold) > 0
    ORDER BY date ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching events:', err);
      return callback(err);
    }
    callback(null, rows);
  });
}


/**
 * Find event by name with fuzzy matching
 * @param {string} eventName - Event name to search for
 * @param {Function} callback - Callback function(err, event)
 * @returns {void}
 */
function findEventByName(eventName, callback) {
  const exactQuery = `
    SELECT 
      id, 
      name, 
      date, 
      location, 
      description,
      number_of_tickets,
      tickets_sold,
      (number_of_tickets - tickets_sold) as available_tickets
    FROM events
    WHERE LOWER(name) = LOWER(?)
  `;

  // Try exact match first
  db.get(exactQuery, [eventName], (err, event) => {
    if (err) {
      console.error('Error finding event:', err);
      return callback(err);
    }

    // If exact match found, return it
    if (event) {
      return callback(null, event);
    }

    // Try fuzzy match
    const fuzzyQuery = `
      SELECT 
        id, 
        name, 
        date, 
        location, 
        description,
        number_of_tickets,
        tickets_sold,
        (number_of_tickets - tickets_sold) as available_tickets
      FROM events
      WHERE LOWER(name) LIKE LOWER(?)
      ORDER BY LENGTH(name) ASC
      LIMIT 1
    `;

    db.get(fuzzyQuery, [`%${eventName}%`], (err, fuzzyEvent) => {
      if (err) {
        console.error('Error in fuzzy search:', err);
        return callback(err);
      }
      callback(null, fuzzyEvent);
    });
  });
}

/**
 * Confirm booking with transaction safety
 * Uses BEGIN TRANSACTION -> COMMIT pattern to prevent overselling
 * @param {number} eventId - Event ID to book
 * @param {number} ticketCount - Number of tickets to book
 * @param {Function} callback - Callback function(err, result)
 * @returns {void}
 */
function confirmBooking(eventId, ticketCount, callback) {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Transaction start error:', err);
        return callback(err);
      }

      // Check event exists and get current availability
      const checkQuery = `
        SELECT 
          id, 
          name, 
          number_of_tickets,
          tickets_sold,
          (number_of_tickets - tickets_sold) as available_tickets
        FROM events
        WHERE id = ?
      `;

      db.get(checkQuery, [eventId], (err, event) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Event lookup error:', err);
          return callback(err);
        }

        if (!event) {
          db.run('ROLLBACK');
          return callback(new Error('Event not found'));
        }

        // Validate sufficient tickets available
        if (event.available_tickets < ticketCount) {
          db.run('ROLLBACK');
          return callback(new Error(`Only ${event.available_tickets} tickets available for ${event.name}`));
        }

        // Update tickets_sold (atomic operation)
        const updateQuery = `
          UPDATE events
          SET tickets_sold = tickets_sold + ?
          WHERE id = ? 
            AND (number_of_tickets - tickets_sold) >= ?
        `;

        db.run(updateQuery, [ticketCount, eventId, ticketCount], function(err) {
          if (err) {
            db.run('ROLLBACK');
            console.error('Update error:', err);
            return callback(err);
          }

          // Verify update succeeded
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return callback(new Error('Booking failed - tickets may have been sold by another user'));
          }

          // Commit transaction
          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.error('Commit error:', err);
              return callback(err);
            }

            // Calculate remaining tickets after this booking
            const remainingTickets = event.available_tickets - ticketCount;

            callback(null, {
              success: true,
              eventName: event.name,
              ticketsPurchased: ticketCount,
              remainingTickets: remainingTickets
            });
          });
        });
      });
    });
  });
}

/**
 * Get event by ID
 * @param {number} eventId - Event ID
 * @param {Function} callback - Callback function(err, event)
 * @returns {void}
 */
function getEventById(eventId, callback) {
  const query = `
    SELECT 
      id, 
      name, 
      date, 
      location, 
      description,
      number_of_tickets,
      tickets_sold,
      (number_of_tickets - tickets_sold) as available_tickets
    FROM events
    WHERE id = ?
  `;

  db.get(query, [eventId], (err, event) => {
    if (err) {
      console.error('Error fetching event:', err);
      return callback(err);
    }
    callback(null, event);
  });
}


module.exports = { 
  getAvailableEvents, 
  findEventByName, 
  confirmBooking, 
  getEventById 
};