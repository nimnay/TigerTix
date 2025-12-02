# TigerTix
CPSC 3720 Project

## Live Deployment

**Frontend:** https://tiger-tix-omega.vercel.app/

**Backend Services:**
- Auth Service: https://tigertix-user-auth-service.onrender.com
- Admin Service: https://tigertix-admin-service-crsf.onrender.com
- Client Service: https://tigertix-client-service-cqc8.onrender.com
- LLM Service: https://tigertix-llm-service-ks8e.onrender.com

## LLM Setup Instructions

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