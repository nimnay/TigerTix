# TigerTix
CPSC 3720 Project

TigerTix is a campus event ticketing platform designed to make it easy for students to discover events, create accounts, and purchase tickets. The system provides a simple and intuative user experience that also supports more advanced interaction through natural language and voice based bookings. TigerTx aims to provide a fast, accessible, and user friendly ticket purchasing experience.

The platform includes the usual account features such as registration, login, and authentication as well as an event browsing interface where users can view ticket availability. TigerTix also has an AI-assisted booking flow powered by Gemini. This allows users to ask for events conversationally and confirm purchases through a guided dialogue. 

The application is intended for:
- **Students** who want a simple interface to browse and buy campus events tickets
- **General Users** who prefer natural-language or voice interaction
- **Admins** who manage the event listings and ticket availability

## Demo Video
Link to demo video: https://drive.google.com/file/d/1QrX7Nd8v-GWypvkg45oDz7kOhT9KWZuL/view?usp=drive_link

## Live Deployment

**Frontend:** https://tiger-tix-omega.vercel.app/

**Backend Services:**
- Auth Service: https://tigertix-user-auth-service.onrender.com
- Admin Service: https://tigertix-admin-service-crsf.onrender.com
- Client Service: https://tigertix-client-service-cqc8.onrender.com
- LLM Service: https://tigertix-llm-service-ks8e.onrender.com




## Tech Stack
TigerTix is built using a combination of frontend, backend, database, and AI technology. The stack emphasizes security, accessibility, and concurrency safe ticket purchasing.

### Frontend
- **React**
   -  Provides a dynamic, component based user interface
   - Handles conditional rendering based on authentication and ticket availability
   
- **Web Speech API** 
   - Enables speech-to-text for voice controlled booking
   - Uses text-to-speech to read back confirmations, improving accessibility and UX
- **CSS Styled Components** 
   - Responsive layout for desktop users
   - Accessibility conscious styles (focus indicators, ARIA tags, contract, keyboard navigation)
<br>

### Backend
- **Node.JS + Express** - Handles RESTful APIs for each microservice:
Each backend subsystem is implememted as its own logical service, simplifying debugging, testing, and scalability
   - **Auth Service**:
      - Handles registration, login, and logout
      - Hashes passwords, issues tokens, and validates protected route access.
   - **Admin Service**:
      - Event creation, updating, and validation
      - Prevents invalid event state (negative ticket stock, missing fields)
   - **Client Service**: 
      - Event Discovery and ticket purchasing
      - Executes concurrency safe SQL transactions to prevent overselling
      - returns updates stock and purchase confirmations
   - **LLM Service**: 
      - Communicates with Gemini API
      - Processes user messages into structured intents
      - Enforces human in the loop confirmations before committing database writes

### Database
- **SQLite**
    - Shared relational database storing users, events, and ticket availability.
   - Serialized transactions prevent race conditions during concurrent ticket purchases.

### LLM / AI Integration
 - **Gemini 2.5 Flash API** 
   - Interprets natural language booking requests
   - Detects user intent (find events, request tickets)
 - **Regex based fallback parser** 
   - Ensures reliable operation even if LLM API is temporarily unavailable

### Security & Authentication
- **bcyptjs** 
   - Hashes passwords securely before database storage
- **jsonwebtoken (JWT)** 
   - Handles token based authentication for secure session management across microservices. 

This stack enables a fully functional, concurrent safe, and accessible ticketing system with integrated voice and natural language interactions



## Architecture Summary

TigerTix uses a **microservice-inspired architecture** in which each major concern (auth, browsing, purchasing, LLM processing) is encapsulated into logical services that communicate through the backend API and a shared database.

### **Service Responsibilities**

#### **1. Frontend Client (React)**
- Renders the entire user-facing interface.
- Manages session state using JWT tokens stored in memory (not localStorage for security).
- Sends authenticated API calls for protected actions (purchasing tickets, viewing user info).
- Handles voice recognition and passes transcribed text to the LLM Service.
- Displays confirmation dialogs before purchases are finalized.

#### **2. Auth Service (Express)**
- Handles:
  - user registration
  - password hashing
  - login and token signing (JWT)
- Validates tokens on protected routes.
- Ensures session expiration and identity verification.

#### **3. Client / Ticket Service (Express)**
- Exposes endpoints for:
  - event discovery
  - ticket availability
  - purchase requests
- Performs concurrency-safe ticket updates using controlled SQL writes.

#### **4. LLM Service Module**
- Communicates with the Gemini LLM API.
- Parses user messages to determine intent:
  - “Find events”
  - “Book two tickets”
  - “Is there anything happening tonight?”
- Converts LLM output into **machine-readable commands**.
- Requires explicit user confirmation before triggering any database write.

#### **5. Database Layer (SQLite / Supabase)**
- Stores:
  - users
  - events
  - ticket inventory
  - purchase history
- All services interact with the same schema, enabling coordinated logic while keeping components decoupled.





## Data Flow Overview

### **1. User Interaction**
A user browses events, logs in, or issues a natural-language booking request (typed or spoken).

### **2. Frontend → Backend Request**
React sends a request to the Express API:
- For protected actions, a **JWT token** is included in the header.
- For natural-language features, the transcribed message is forwarded to the LLM module.

### **3. Backend Processing**
The backend performs:
- authentication validation
- schema validation (e.g., ticket quantity)
- purchase logic with concurrency-safe SQL updates
- optional LLM analysis (when natural-language input is included)

### **4. Database Operations**
The database executes:
- event queries
- inventory queries
- purchase transactions
- user lookups

The backend ensures atomic updates so two users cannot purchase the same last ticket.

### **5. Response → Frontend**
The backend returns a structured JSON response containing:
- updated ticket counts
- authenticated user info
- LLM-generated suggestions or confirmations
- error messages when applicable

### **6. UI Update**
React updates:
- ticket availability
- login/session state
- confirmation prompts
- voice output (optional TTS)


## Installation & Setup Guide

### Local Set Up
1. Clone the Repository
```
git clone https://github.com/nimnay/TigerTix.git
cd TigerTix
```

2. Install dependencies
### Frontend 
```
cd frontend
npm install
```

### Backend
```
cd ..
cd backend
npm install

```
### Start Backend Services
```
cd backend
npm start
```


### Start Frontend 
```
cd frontend
npm start
```


## Environment Variables Setup


### LLM Env Setup Instructions

1. Navigate to `llm-service` directory
2. Install dependencies: `npm install`
3. Create `.env` file from template:
```bash
   cp .env.example .env
```
4. Add your Gemini API key to `.env`:
```
   GEMINI_API_KEY=your_actual_key_here
```
5. Start the service: `npm start`




## Running Regression Tests
TigerTix includes automated regression tests for both the frontend and backend. These tests ensure that authentication, API behavior, UI state updates, and event workflows continure to function correctly as the project is changed. 

### 1. Backend Tests
The backend tests cover:

- Registration & login validation  
- JWT authentication flow  
- Protected route access  
- Event fetching & ticket updates  
- Error handling and input filtering
<br> 
To run backend tests:
from root directory
```
cd backend
cd <Microservice you'd like to test>
npm install #for first time only 
npm test
```


### 2. Frontend Tests
The frontend tests cover:

- User authentication flow (register, login, logout)
- Event listing and display
- Ticket booking workflow
- Voice recognition integration
- Error handling and UI state management

To run frontend tests:

```bash
cd frontend
npm test
```

This will launch the Jest test runner in interactive mode. Press:
- `a` to run all tests
- `w` to watch for file changes
- `q` to quit

To run tests without watch mode (CI/CD):

```bash
cd frontend
npm test -- --watchAll=false --coverage
```

This will generate a coverage report in `frontend/coverage/`

### 3. E2E Tests

End-to-end tests simulate real user workflows using Playwright:

```bash
# Install Playwright browsers first (one-time setup)
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI for debugging
npx playwright test --ui

# Generate HTML report
npx playwright show-report
```

E2E tests cover:
- Full registration workflow
- Login and logout
- Event browsing and ticket purchase
- Token management and session persistence

### 4. Run All Tests (CI/CD Pipeline)

To run the complete test suite as the GitHub Actions workflow does:

```bash
# From root directory, install all dependencies
cd frontend && npm install && cd ../backend && npm install
cd user-authentication && npm install && cd ../admin-service && npm install
cd ../client-service && npm install && cd ../llm-service && npm install && cd ../..

# Run all backend unit tests
cd backend/user-authentication && npm test
cd ../admin-service && npm test
cd ../client-service && npm test
cd ../llm-service && npm test

# Run frontend tests
cd ../../frontend && npm test -- --watchAll=false

# Run E2E tests
npx playwright test
```





## Team Members
Fill in the table with what you think you did the most <br>

Instructor: Julian Brinkley <br>
TAs: Atik Enam and Colt Doster <br> 

| Name | Role(s) | Responsibilities |
|------|---------|------------------|
| Angie Diaz | Scrum Master, QA | Developed Client + LLM Services, Integration Testing and Playwright Testing, Implemented CI/CD Pipeline|
| Nimra Nayyar | Software Developer, QA | Developed Admin + User Auth Service, Unit and Integration Testing for Said Services, Integrated Voice to Text, Deployed Frontend + All Microservices |
| Diana Sanchez | Software Developer, QA | Developed the frontend UI with styles, connected frontend to backend routes |


## License
This project is licensed under the terms of the MIT license

See the full MIT License in the LICENSE file.

