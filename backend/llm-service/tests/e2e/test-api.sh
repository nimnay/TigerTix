#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# LLM Service URL
LLM_SERVICE_URL="http://localhost:7001"

# Function to make API calls and format output
call_api() {
    local endpoint=$1
    local payload=$2
    local test_name=$3

    echo -e "\n${BLUE}Testing: ${test_name}${NC}"
    echo "Endpoint: ${endpoint}"
    echo "Payload: ${payload}"
    echo -e "\nResponse:"
    
    response=$(curl -s -X POST "${LLM_SERVICE_URL}${endpoint}" \
        -H "Content-Type: application/json" \
        -d "${payload}")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}$(echo $response | json_pp)${NC}"
        echo -e "${GREEN}✓ Test completed${NC}"
    else
        echo -e "${RED}✗ Request failed${NC}"
        return 1
    fi
    echo "----------------------------------------"
}

# Check if LLM service is running
echo "Checking LLM service..."
if ! curl -s "${LLM_SERVICE_URL}/health" > /dev/null; then
    echo -e "${RED}Error: LLM service is not running on ${LLM_SERVICE_URL}${NC}"
    echo "Please start the service first with 'npm start' in the backend directory"
    exit 1
fi

echo -e "${GREEN}LLM service is running${NC}"
echo "Starting API tests..."

# 1. Parse Endpoint Tests
echo -e "\n${BLUE}=== Testing /parse endpoint ===${NC}"

# Test 1: Greeting
call_api "/api/llm/parse" \
    '{"text": "Hello!"}' \
    "Greeting message"

# Test 2: View Events
call_api "/api/llm/parse" \
    '{"text": "Show me available events"}' \
    "List available events"

# Test 3: Book Tickets
call_api "/api/llm/parse" \
    '{"text": "Book 2 tickets for Jazz Night"}' \
    "Book tickets request"

# Test 4: Empty Input (should return error)
call_api "/api/llm/parse" \
    '{"text": ""}' \
    "Empty input validation"

# Test 5: Invalid Booking Request
call_api "/api/llm/parse" \
    '{"text": "Book -1 tickets"}' \
    "Invalid ticket quantity"

# 2. Confirm Endpoint Tests
echo -e "\n${BLUE}=== Testing /confirm endpoint ===${NC}"

# Test 6: Confirm Valid Booking
call_api "/api/llm/confirm" \
    '{"eventId": 1001, "tickets": 2}' \
    "Confirm valid booking"

# Test 7: Confirm with Invalid Event ID
call_api "/api/llm/confirm" \
    '{"eventId": 999999, "tickets": 1}' \
    "Confirm with invalid event ID"

# Test 8: Confirm with Invalid Ticket Count
call_api "/api/llm/confirm" \
    '{"eventId": 1001, "tickets": 0}' \
    "Confirm with invalid ticket count"

echo -e "\n${BLUE}=== Test Suite Complete ===${NC}"