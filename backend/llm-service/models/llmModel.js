// NOTE : IS NOT FOLLOWING DOCUMENTATION RIGHT NOW 


const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');
const db = new Database(dbPath);

class LLMModel {
  // Get all events with available tickets
  static getAvailableEvents() {
    try {
      const events = db.prepare(`
        SELECT id, name, date, location, total_tickets, available_tickets, price
        FROM events
        WHERE available_tickets > 0
        ORDER BY date ASC
      `).all();
      
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  // Find event by name (fuzzy matching)
  static findEventByName(eventName) {
    try {
      // Try exact match first
      let event = db.prepare(`
        SELECT id, name, date, location, total_tickets, available_tickets, price
        FROM events
        WHERE LOWER(name) = LOWER(?)
      `).get(eventName);

      // If no exact match, try partial match
      if (!event) {
        event = db.prepare(`
          SELECT id, name, date, location, total_tickets, available_tickets, price
          FROM events
          WHERE LOWER(name) LIKE LOWER(?)
          ORDER BY LENGTH(name) ASC
          LIMIT 1
        `).get(`%${eventName}%`);
      }

      return event;
    } catch (error) {
      console.error('Error finding event:', error);
      throw error;
    }
  }

  // Confirm booking with transaction safety
  static confirmBooking(eventId, ticketCount) {
    try {
      // Start transaction
      const transaction = db.transaction(() => {
        // Check availability
        const event = db.prepare(`
          SELECT id, name, available_tickets
          FROM events
          WHERE id = ?
        `).get(eventId);

        if (!event) {
          throw new Error('Event not found');
        }

        if (event.available_tickets < ticketCount) {
          throw new Error(`Only ${event.available_tickets} tickets available`);
        }

        // Update available tickets
        const result = db.prepare(`
          UPDATE events
          SET available_tickets = available_tickets - ?
          WHERE id = ? AND available_tickets >= ?
        `).run(ticketCount, eventId, ticketCount);

        if (result.changes === 0) {
          throw new Error('Booking failed - tickets may have been sold');
        }

        return {
          success: true,
          eventName: event.name,
          ticketsPurchased: ticketCount,
          remainingTickets: event.available_tickets - ticketCount
        };
      });

      return transaction();
    } catch (error) {
      console.error('Booking error:', error);
      throw error;
    }
  }
}

module.exports = LLMModel;