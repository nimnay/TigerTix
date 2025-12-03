# TigerTix
CPSC 3720 Project

TigerTix is a campus event ticketing platform designed to make it easy for students to discover events, create accounts, and purchase tickets. The system provides a simple and intuative user experience that also supports more advanced interaction through natural language and voice based bookings. TigerTx aims to provide a fast, accessible, and user friendly ticket purchasing experience.

The platform includes the usual account features such as registration, login, and authentication as well as an event browsing interface where users can view ticket availability. TigerTix also has an AI-assisted booking flow powered by Gemini. This allows users to ask for events conversationally and confirm purchases through a guided dialogue. 

The application is intended for:
- **Students** who want a simple interface to browse and buy campus events tickets
- **General Users** who prefer natural-language or voice interaction
- **Admins** who manage the event listings and ticket availability



## Live Deployment

**Frontend:** https://tiger-tix-omega.vercel.app/

**Backend Services:**
- Auth Service: https://tigertix-user-auth-service.onrender.com
- Admin Service: https://tigertix-admin-service-crsf.onrender.com
- Client Service: https://tigertix-client-service-cqc8.onrender.com
- LLM Service: https://tigertix-llm-service-ks8e.onrender.com




## Tech Stack
TigerTix is built using a combination of frontend, backend, database, and AI technology to create a responsive, secure and intelligent ticketing platform.

### Frontend
- **React** - Provides a dynamic, component based user interface.
- **Web Speech API** Enables voice input and text to speech for an accessible and conversational booking experience
- **CCS Styled Components** Ensures responsive and accessible design

### Backend
- **Node.JS + Express** - Handles RESTful APIs for each microservice:
   - **Auth Service**: Registration, login, and JWT authentication.
   - **Admin Service**: Event management and validation.
   - **Client Service**: Event browsing and ticket purchasing.
   - **LLM Service**: Natural language parsing, confirmation workflows, and database updates.

### Database
- **SQLite** - Shared relational database storing users, events, and ticket availability.
   - Serialized transactions prevent race conditions during concerrent ticket purchases.

### LLM / AI Integration
 - **Gemini 2.5 Flash API** - Interprents natural language booking requests from users
 - **Regex based fallback parser** - Ensures reliable operation even if LLM API is temporarily unavailable

### Security & Authentication
- **bcyptjs** - Hashes passwords securely before database storage
- **jsonwebtoekn (JWT)** - Handles token based authentication for secure session management across microservices. 

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

# FILL IN LATER

## Environment Variables Setup
# FILL IN LATER

<br>
<br>
<br>
<br>
<br>

### LLM Setup Instructions

1. Clone the repository
2. Navigate to `llm-service` directory
3. Install dependencies: `npm install`
4. Create `.env` file from template:
```bash
   cp .env.example .env
```
5. Add your Gemini API key to `.env`:
```
   GEMINI_API_KEY=your_actual_key_here
```
6. Start the service: `npm start`


<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

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
npm test
```




### 2. Frontend Tests
info on how the frontend tests are ran







## Team Members
Fill in the table with what you think you did the most <br>

Instructor: Julian Brinkley <br>
TAs: Atik Enam and Colt Doster <br> 

| Name | Role(s) | Responsibilities |
|------|---------|------------------|
| Angie Diaz | role | work done |
| Nimra Nayyar | role | work done |
| Diana Sanchez | role | work done |



