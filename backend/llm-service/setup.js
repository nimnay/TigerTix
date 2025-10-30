const axios = require('axios');

const LLM_SERVICE_URL = 'http://localhost:7001';

async function testLLMService() {
  console.log('Testing LLM Service...\n');

  try {
    // Test 1: Greeting
    console.log('Test 1: Greeting');
    const greeting = await axios.post(`${LLM_SERVICE_URL}/api/llm/parse`, {
      text: 'Hello!'
    });
    console.log('Response:', greeting.data);
    console.log('---\n');

    // Test 2: View events
    console.log('Test 2: View Events');
    const viewEvents = await axios.post(`${LLM_SERVICE_URL}/api/llm/parse`, {
      text: 'Show me available events'
    });
    console.log('Response:', viewEvents.data);
    console.log('---\n');

    // Test 3: Book tickets
    console.log('Test 3: Book Tickets');
    const booking = await axios.post(`${LLM_SERVICE_URL}/api/llm/parse`, {
      text: 'Book 2 tickets for Jazz Night'
    });
    console.log('Response:', booking.data);
    
    if (booking.data.booking) {
      // Test 4: Confirm booking
      console.log('\nTest 4: Confirm Booking');
      const confirm = await axios.post(`${LLM_SERVICE_URL}/api/llm/confirm`, {
        eventId: booking.data.booking.eventId,
        tickets: booking.data.booking.tickets
      });
      console.log('Response:', confirm.data);
    }
    console.log('---\n');

    console.log('All tests completed!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testLLMService();
}

module.exports = { testLLMService };