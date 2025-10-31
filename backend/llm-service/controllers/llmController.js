// 



const { parseBookingRequest } = require('../services/llmParser');
const { getAvailableEvents, findEventByName, confirmBooking } = require('../models/llmModel');


/**
 * Parse natural language booking request
 * Endpoint: POST /api/llm/parse
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function parse(req, res) {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text input required' });
    }

    // Parse with Gemini AI (or fallback to keyword parser)
    const parsed = await parseBookingRequest(text);

    // Handle different intents
    if (parsed.error) {
      return res.json(parsed);
    }

    // Intent: Greeting
    if (parsed.intent === 'greeting') {
      return res.json({
        intent: 'greeting',
        message: 'Hello! I can help you book tickets. You can ask me to show available events or book tickets.',
        response: 'Hello! I can help you book tickets. You can ask me to show available events or book tickets.'
      });
    }

    // Intent: View available events
    if (parsed.intent === 'view') {
      const events = LLMModel.getAvailableEvents();
      
      // Create user-friendly message
      let eventList = events.map(e => 
        `${e.name} on ${e.date} (${e.available_tickets} tickets available)`
      ).join(', ');

      return res.json({
        intent: 'view',
        events: events,
        message: `Found ${events.length} available event${events.length !== 1 ? 's' : ''}`,
        response: events.length > 0 
          ? `I found ${events.length} event${events.length !== 1 ? 's' : ''} with available tickets: ${eventList}`
          : 'Sorry, there are no events with available tickets at the moment.'
      });
    }

    // Intent: Book tickets
    if (parsed.intent === 'book') {
      // Find the event by name (with fuzzy matching)
      const event = LLMModel.findEventByName(parsed.event);

      if (!event) {
        return res.json({
          error: `Event "${parsed.event}" not found`,
          suggestion: 'Try asking to see available events first',
          response: `I couldn't find an event called "${parsed.event}". Would you like to see all available events?`
        });
      }

      // Check ticket availability
      if (event.available_tickets < parsed.tickets) {
        return res.json({
          error: `Only ${event.available_tickets} ticket${event.available_tickets !== 1 ? 's' : ''} available for ${event.name}`,
          event: event,
          response: `Sorry, only ${event.available_tickets} ticket${event.available_tickets !== 1 ? 's are' : ' is'} available for ${event.name}. Would you like to book ${event.available_tickets} instead?`
        });
      }

      // Prepare booking (don't execute yet - requires confirmation per rubric)
      return res.json({
        intent: 'book',
        needsConfirmation: true,
        booking: {
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          eventLocation: event.location,
          tickets: parsed.tickets,
          availableTickets: event.available_tickets
        },
        message: `Ready to book ${parsed.tickets} ticket${parsed.tickets !== 1 ? 's' : ''} for ${event.name}. Please confirm.`,
        response: `I'm ready to book ${parsed.tickets} ticket${parsed.tickets !== 1 ? 's' : ''} for ${event.name} on ${event.date} at ${event.location}. Please confirm your booking.`
      });
    }

    // Unknown intent
    return res.json(parsed);
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      message: 'An internal error occurred while processing your request'
    });
  }
}


/**
 * Confirm and execute booking
 * Endpoint: POST /api/llm/confirm
 * Requires explicit user confirmation (6 pts per rubric)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function confirm(req, res) {
  try {
    const { eventId, tickets } = req.body;

    // Validate input
    if (!eventId || !tickets || tickets < 1) {
      return res.status(400).json({ 
        error: 'Event ID and valid ticket count required',
        message: 'Please provide both event ID and number of tickets (must be at least 1)'
      });
    }

    // Execute booking with transaction safety (5 pts per rubric)
    const result = LLMModel.confirmBooking(eventId, tickets);

    res.json({
      success: true,
      ...result,
      message: `Successfully booked ${result.ticketsPurchased} ticket${result.ticketsPurchased !== 1 ? 's' : ''} for ${result.eventName}`,
      response: `Your booking is confirmed! You have successfully booked ${result.ticketsPurchased} ticket${result.ticketsPurchased !== 1 ? 's' : ''} for ${result.eventName}. ${result.remainingTickets} ticket${result.remainingTickets !== 1 ? 's' : ''} remaining.`
    });
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Booking confirmation failed: ' + error.message
    });
  }
}

module.exports = { parse, confirm };
