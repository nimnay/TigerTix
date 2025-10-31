const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

async function parseBookingRequest(text) {
  try {
    const prompt = `Extract booking information from: "${text}"
    Return ONLY JSON: {"event": "name", "tickets": number, "intent": "book|view|greeting"}
    Rules: greeting for hi/hello, view for listing events, book for purchases.`;

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'llama3',
      prompt: prompt,
      stream: false,
      format: 'json'
    });

    return JSON.parse(response.data.response);
  } catch (error) {
    console.error('Ollama error:', error);
    return fallbackParser(text);
  }
}

// Include the same fallbackParser function here

// COME BACK TO LOOK OVER, decided to do local llama3 thru ollama