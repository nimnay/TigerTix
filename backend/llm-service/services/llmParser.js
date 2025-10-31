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
        const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});

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