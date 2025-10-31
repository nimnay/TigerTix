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
        const model = genAI.getGenerativeModel({model: "gemini-pro"});

        //Create the prompt...
        // Create the prompt (optimized for token efficiency)
    const systemPrompt = `Extract ticket booking info. Return ONLY JSON, no markdown:
    {"event":"name","tickets":number,"intent":"book"|"view"|"greeting"}

    Rules:
    - greeting: hi/hello -> {"intent":"greeting"}
    - view: show/list events -> {"intent":"view"}  
    - book: extract event name + count (default 1)
    - unclear -> {"error":"Could not parse"}

    Input: "${text}"`;

    //Generate a response
    const result = await model.generateContent(systemPrompt);
    const response = await result.response; 
    let content = response.text().trim(); 

    //Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    //Parse the JSOn
    const parsed = JSON.parse(content); 

    // Validate correct response recieved
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
    return { intent: "greeting" };
  }
  
  // View events detection
  if (/\b(show|list|view|see|display|what|available|all)\b.*\b(event|concert|show|ticket)/i.test(lowerText) ||
      /\b(event|concert|show|ticket)s?\b.*\b(available|list|show)/i.test(lowerText)) {
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
        intent: "book" 
      };
    } else {
      return { 
        error: "Could not identify event name. Try: 'Book 2 tickets for Jazz Night'" 
      };
    }
  }
  
  // Default: could not parse
  return { 
    error: "Could not parse request. Try: 'Show available events' or 'Book 2 tickets for Jazz Night'" 
  };
}

module.exports = { 
  parseBookingRequest, 
  fallbackParser 
};