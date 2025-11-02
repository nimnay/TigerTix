/**
 * Handles natural language processing for TigerTix
 * Interface between user input and Gemini model 
 * 
 * Responsible for:
 * 1. Calls the Gemini API with user input 
 * 2. Processes the model's response into structured data
 * 3. Falls back to key-word based parsing if Gemini fails (rubric)
 * 
 * Used by: llmController.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

//Initialize chosen LLM: Gemini 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Parse booking request using Gemini AI 
 * 
 * @param {string} text - Natural language input from user
 * @returns {Promise<Object>} - Structured booking data 
 */
async function parseBookingRequest(text) { 
    try { 
        const model = genAI.getGenerativeModel({model: "gemini-2.5-flash"});

        //Create the prompt for conversational AI
        const systemPrompt = `You are TigerTix, a friendly AI assistant for Clemson University ticket booking.

Analyze this message and determine the user's intent. Respond with ONLY valid JSON (no markdown):

INTENT TYPES:

1. GREETING - User says hi/hello/hey
Return: {"intent":"greeting", "response":"Hi! I'm TigerTix, your ticket assistant. I can show you available events or help you book tickets. What would you like to do?"}

2. VIEW EVENTS - User wants to see/list/show available events or tickets
Examples: "what events are available", "show me tickets", "which are available", "list events"
Return: {"intent":"view"}

3. BOOK TICKETS - User wants to book/buy/reserve tickets
Examples: "book 2 tickets for Jazz Night", "I want to buy tickets to the concert", "reserve 3 seats"
Extract event name and ticket count (default 1)
Return: {"intent":"book", "event":"Event Name", "tickets":2, "response":"I found that event! Let me prepare your booking."}

4. GENERAL CHAT - Everything else (questions, small talk, help requests)
Return: {"intent":"chat", "response":"[Natural conversational response as TigerTix assistant]"}

RULES:
- Always include a "response" field EXCEPT for "view" intent
- Be friendly and helpful
- Keep responses concise (1-2 sentences)
- Stay in character as TigerTix

User message: "${text}"

JSON response:`;

    //Generate a response
    const result = await model.generateContent(systemPrompt);
    const response = await result.response; 
    let content = response.text().trim(); 

    //Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    //Parse the JSON
    const parsed = JSON.parse(content); 

    // Validate correct response received
    if (parsed.intent) {
        return parsed;
    } else if (parsed.error) {
        return parsed; 
    } else {
        throw new Error('Invalid response structure from Gemini');
    } 

} catch (error) {
    console.error('Gemini parsing error: ', error.message);

    //Fall back to keyword based parser 
    console.log('Falling back to keyword parser');
    return fallbackParser(text);
}

}

/**
 * Fallback keyword parser, serves two purposes:
 * 1. Backup when Gemini API fails 
 * 2. Required by rubric 
 * 
 * Uses regex pattern matching to detect:
 * - Greetings
 * - View events requests
 * - Booking requests 
 * 
 * @param {string} text - Natural language input
 * @returns {Object} - Structured booking data
 */
function fallbackParser(text) {
  const lowerText = text.toLowerCase().trim();
  
  // Greeting detection
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/.test(lowerText)) {
    return { 
      intent: "greeting",
      response: "Hi! I'm TigerTix, your ticket assistant. I can show you available events or help you book tickets. What would you like to do?"
    };
  }
  
  // View events detection
  if (/\b(show|list|view|see|display|what|available|all|which)\b.*\b(event|concert|show|ticket)/i.test(lowerText) ||
      /\b(event|concert|show|ticket)s?\b.*\b(available|list|show)/i.test(lowerText) ||
      /which are available|what.*available/i.test(lowerText)) {
    return { intent: "view" };
  }
  
  // Booking detection
  const bookMatch = lowerText.match(/\b(book|purchase|buy|get|reserve|want)\b/i);
  if (bookMatch) {
    // Extract ticket count
    const numberMatch = lowerText.match(/(\d+)\s*(?:ticket|seat|spot|reservation)?s?/i);
    const tickets = numberMatch ? parseInt(numberMatch[1]) : 1;
    
    // Extract event name - try multiple patterns
    let event = null;
    
    // Pattern 1: Quoted text
    const quoteMatch = lowerText.match(/["']([^"']+)["']/);
    if (quoteMatch) {
      event = quoteMatch[1];
    }
    
    // Pattern 2: "for [event name]"
    if (!event) {
      const forMatch = lowerText.match(/\bfor\s+(?:the\s+)?([a-z0-9\s]+?)(?:\s+concert|\s+show|\s+event|$)/i);
      if (forMatch) {
        event = forMatch[1].trim();
      }
    }
    
    // Pattern 3: "to [event name]"
    if (!event) {
      const toMatch = lowerText.match(/\bto\s+(?:the\s+)?([a-z0-9\s]+?)(?:\s+concert|\s+show|\s+event|$)/i);
      if (toMatch) {
        event = toMatch[1].trim();
      }
    }
    
    // Pattern 4: Look for capitalized words (likely event names)
    if (!event) {
      // Remove common words and numbers
      const words = text.replace(/book|purchase|buy|get|reserve|want|ticket|tickets|for|to|the|a|an/gi, '').trim();
      const remainingWords = words.replace(/\d+/g, '').trim();
      if (remainingWords.length > 0) {
        event = remainingWords;
      }
    }
    
    if (event) {
      return { 
        event: event.trim(), 
        tickets, 
        intent: "book",
        response: `Got it! Let me find tickets for ${event.trim()}.`
      };
    } else {
      return { 
        intent: "chat",
        response: "I'd love to help you book tickets! Could you tell me which event you're interested in? Try saying something like 'Book 2 tickets for Jazz Night'."
      };
    }
  }
  
  // Default: treat as general chat if no specific intent detected
  return { 
    intent: "chat",
    response: "I'm TigerTix, your ticket booking assistant! I can help you view available events or book tickets. What would you like to do?"
  };
}

module.exports = { 
  parseBookingRequest, 
  fallbackParser 
};