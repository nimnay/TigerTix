//NOTE: IS NOT FOLLOWING REQUEST HANDLERS 

const { parseBookingRequest } = require('../services/llmParser');
const LLMModel = require('../models/llmModel');

class LLMController {
  // Parse natural language booking request
  static async parse(req, res) {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text input required' });
      }

      // Parse with LLM
      const parsed = await parseBookingRequest(text);

      // Handle different intents
      if (parsed.error) {
        return res.json(parsed);
      }

      if (parsed.intent === 'greeting') {
        return res.json({
          intent: 'greeting',
          message: 'Hello! I can help you book tickets. You can ask me to show available events or book tickets.',
          response: 'Hello! I can help you book tickets. You can ask me to show available events or book tickets.'
        });
      }

      if (parsed.intent === 'view') {
        const events = LLMModel.getAvailableEvents();
        return res.json({
          intent: 'view',
          events: events,
          message: `Found ${events.length} available events`,
          response: `I found ${events.length} events with available tickets: ${events.map(e => `${e.name} (${e.available_tickets} tickets available)`).join(', ')}`
        });
      }

      if (parsed.intent === 'book') {
        // Find the event
        const event = LLMModel.findEventByName(parsed.event);

        if (!event) {
          return res.json({
            error: `Event "${parsed.event}" not found`,
            suggestion: 'Try asking to see available events first'
          });
        }

        if (event.available_tickets < parsed.tickets) {
          return res.json({
            error: `Only ${event.available_tickets} tickets available for ${event.name}`,
            event: event
          });
        }

        // Prepare booking (don't execute yet)
        return res.json({
          intent: 'book',
          needsConfirmation: true,
          booking: {
            eventId: event.id,
            eventName: event.name,
            tickets: parsed.tickets,
            totalPrice: event.price * parsed.tickets,
            availableTickets: event.available_tickets
          },
          message: `Ready to book ${parsed.tickets} ticket(s) for ${event.name}. Please confirm.`,
          response: `I'm ready to book ${parsed.tickets} ticket(s) for ${event.name} at $${event.price} each, totaling $${event.price * parsed.tickets}. Please confirm your booking.`
        });
      }

      return res.json(parsed);
    } catch (error) {
      console.error('Parse error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }

  // Confirm and execute booking
  static async confirm(req, res) {
    try {
      const { eventId, tickets } = req.body;

      if (!eventId || !tickets || tickets < 1) {
        return res.status(400).json({ error: 'Event ID and ticket count required' });
      }

      // Execute booking with transaction
      const result = LLMModel.confirmBooking(eventId, tickets);

      res.json({
        success: true,
        ...result,
        message: `Successfully booked ${result.ticketsPurchased} ticket(s) for ${result.eventName}`,
        response: `Your booking is confirmed! You have successfully booked ${result.ticketsPurchased} ticket(s) for ${result.eventName}. ${result.remainingTickets} tickets remaining.`
      });
    } catch (error) {
      console.error('Confirmation error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = LLMController;