/**
 * Simple test script to verify LLM conversation works
 * Run: node test-conversation.js
 */

const { parseBookingRequest } = require('./services/llmParser');

// Test different conversation scenarios
async function testConversation() {
  console.log('Testing LLM Conversation...\n');

  const testInputs = [
    'hi',
    'Hello!',
    'which are available?',
    'show me events',
    'what events do you have?',
    'book 2 tickets for Jazz Night',
    'I want to buy tickets',
    'how does this work?',
    'thanks',
    'ok'
  ];

  for (const input of testInputs) {
    console.log(`\n📝 USER: "${input}"`);
    try {
      const result = await parseBookingRequest(input);
      console.log(`🤖 INTENT: ${result.intent}`);
      if (result.response) {
        console.log(`💬 RESPONSE: "${result.response}"`);
      }
      if (result.event) {
        console.log(`🎟️  EVENT: ${result.event}, TICKETS: ${result.tickets || 1}`);
      }
      if (result.error) {
        console.log(`❌ ERROR: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n✅ Test complete!');
}

testConversation();
