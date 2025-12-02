# Deployment Instructions - TicketSystem

Follow these steps exactly in order. Check off each step as you complete it.

## Phase 1: Prepare Frontend for Deployment

### Step 1.1: Create Environment File
```bash
cd C:\Users\nimra\Documents\Clemson\CPSC 3720\TicketSystem\frontend
```

Create a new file `.env` with this content:
```
REACT_APP_API_URL=http://localhost:6001
REACT_APP_AUTH_URL=http://localhost:3001
REACT_APP_LLM_URL=http://localhost:7001
REACT_APP_ADMIN_URL=http://localhost:5001
```

### Step 1.2: Update TicketingChat.js to use config
Open `frontend/src/components/TicketingChat.js`

Add this import at the top (after other imports):
```javascript
import API_CONFIG from '../config';
```

Replace line ~30:
```javascript
const res = await fetch("http://localhost:7001/api/llm/parse", {
```
With:
```javascript
const res = await fetch(`${API_CONFIG.LLM_SERVICE}/api/llm/parse`, {
```

Replace line ~56:
```javascript
const res = await fetch("http://localhost:7001/api/llm/confirm", {
```
With:
```javascript
const res = await fetch(`${API_CONFIG.LLM_SERVICE}/api/llm/confirm`, {
```

### Step 1.3: Update LoginForm.js to use config
Open `frontend/src/components/LoginForm.js`

Add this import at the top:
```javascript
import API_CONFIG from '../config';
```

Replace line ~32:
```javascript
const res = await fetch(`http://localhost:3001/auth/login`, {
```
With:
```javascript
const res = await fetch(`${API_CONFIG.AUTH_SERVICE}/auth/login`, {
```

### Step 1.4: Update Registration.js to use config
Open `frontend/src/components/Registration.js`

Add this import at the top:
```javascript
import API_CONFIG from '../config';
```

Replace line ~58:
```javascript
const res = await fetch(`http://localhost:3001/auth/register`, {
```
With:
```javascript
const res = await fetch(`${API_CONFIG.AUTH_SERVICE}/auth/register`, {
```

### Step 1.5: Update App.js to use config
Open `frontend/src/App.js`

Add this import at the top:
```javascript
import API_CONFIG from './config';
```

Find and replace:
- `'http://localhost:6001/api/events'` → `${API_CONFIG.CLIENT_SERVICE}/api/events`
- `http://localhost:6001/api/events/${eventId}/purchase` → `${API_CONFIG.CLIENT_SERVICE}/api/events/${eventId}/purchase`

### Step 1.6: Test frontend locally
```bash
cd frontend
npm start
```
Verify everything still works locally, then stop the server (Ctrl+C).

---

## Phase 2: Prepare Backend for Deployment

### Step 2.1: Create .env.example files
For each backend service, create `.env.example`:

**In `backend/user-authentication/.env.example`:**
```
PORT=3001
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=production
DATABASE_PATH=./database.db
```

**In `backend/admin-service/.env.example`:**
```
PORT=5001
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=production
DATABASE_PATH=./database.db
```

**In `backend/client-service/.env.example`:**
```
PORT=6001
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=production
DATABASE_PATH=./database.db
```

**In `backend/llm-service/.env.example`:**
```
PORT=7001
JWT_SECRET=your-secure-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=production
DATABASE_PATH=./database.db
```

### Step 2.2: Update CORS in all backend services
For each service's `server.js`, update CORS configuration:

**In `backend/user-authentication/server.js`:**
Find:
```javascript
app.use(cors());
```
Replace with:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ticketsystem.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));
```

Repeat for:
- `backend/admin-service/server.js`
- `backend/client-service/server.js`
- `backend/llm-service/server.js`

### Step 2.3: Create .gitignore in project root
Create `TicketSystem/.gitignore` with this content:
```
# Dependencies
node_modules/
**/node_modules/

# Environment variables
.env
.env.local
.env.production

# Database files
*.db
*.sqlite
*.sqlite3

# Logs
*.log
npm-debug.log*

# Build outputs
build/
dist/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Testing
coverage/

# Misc
.cache/
```

---

## Phase 3: Push to GitHub

### Step 3.1: Initialize Git (if not done)
```bash
cd C:\Users\nimra\Documents\Clemson\CPSC 3720\TicketSystem
git init
```

### Step 3.2: Add all files
```bash
git add .
```

### Step 3.3: Commit
```bash
git commit -m "Prepared for deployment - Sprint 3"
```

### Step 3.4: Create GitHub repository
1. Go to https://github.com/new
2. Repository name: `TicketSystem`
3. Make it Public
4. DO NOT initialize with README (you already have one)
5. Click "Create repository"

### Step 3.5: Push to GitHub
```bash
git remote add origin https://github.com/nimnay/TicketSystem.git
git branch -M main
git push -u origin main
```

---

## Phase 4: Deploy Backend to Render

### Step 4.1: Sign up for Render
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 4.2: Deploy User Authentication Service
1. Click "New +" → "Web Service"
2. Connect to `nimnay/TicketSystem` repository
3. Configure:
   - **Name:** `ticketsystem-auth`
   - **Region:** Choose closest to you (e.g., Oregon)
   - **Branch:** `main`
   - **Root Directory:** `backend/user-authentication`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

4. Click "Advanced" → Add Environment Variables:
   ```
   PORT=3001
   JWT_SECRET=Generate-A-Strong-Random-32-Character-Secret-Key-Here
   NODE_ENV=production
   DATABASE_PATH=/opt/render/project/src/database.db
   ```

5. Click "Create Web Service"
6. Wait for deployment to complete
7. **Save the URL** (e.g., `https://ticketsystem-auth.onrender.com`)

### Step 4.3: Deploy Admin Service
Repeat Step 4.2 with these changes:
- **Name:** `ticketsystem-admin`
- **Root Directory:** `backend/admin-service`
- **Environment Variables:**
  ```
  PORT=5001
  JWT_SECRET=Use-The-Same-Secret-As-Auth-Service
  NODE_ENV=production
  DATABASE_PATH=/opt/render/project/src/database.db
  ```
- **Save the URL**

### Step 4.4: Deploy Client Service
Repeat Step 4.2 with these changes:
- **Name:** `ticketsystem-client`
- **Root Directory:** `backend/client-service`
- **Environment Variables:**
  ```
  PORT=6001
  JWT_SECRET=Use-The-Same-Secret-As-Auth-Service
  NODE_ENV=production
  DATABASE_PATH=/opt/render/project/src/database.db
  ```
- **Save the URL**

### Step 4.5: Deploy LLM Service
Repeat Step 4.2 with these changes:
- **Name:** `ticketsystem-llm`
- **Root Directory:** `backend/llm-service`
- **Environment Variables:**
  ```
  PORT=7001
  JWT_SECRET=Use-The-Same-Secret-As-Auth-Service
  GEMINI_API_KEY=Your-Actual-Gemini-API-Key
  NODE_ENV=production
  DATABASE_PATH=/opt/render/project/src/database.db
  ```
- **Save the URL**

### Step 4.6: Initialize Databases
For EACH service (auth, admin, client, llm):
1. Go to service in Render dashboard
2. Click "Shell" tab
3. Run:
   ```bash
   node setup.js
   ```
4. Verify:
   ```bash
   ls -la *.db
   ```
   You should see `database.db`

### Step 4.7: Test Backend Endpoints
Use your browser or Postman to test:

1. **Test Events (should work without auth):**
   ```
   GET https://ticketsystem-client.onrender.com/api/events
   ```

2. **Test Register:**
   ```
   POST https://ticketsystem-auth.onrender.com/auth/register
   Body: {"username":"testuser","email":"test@example.com","password":"Test1234"}
   ```

3. **Test Login:**
   ```
   POST https://ticketsystem-auth.onrender.com/auth/login
   Body: {"identity":"testuser","password":"Test1234"}
   ```
   Copy the token from response.

4. **Test LLM (with token):**
   ```
   POST https://ticketsystem-llm.onrender.com/api/llm/parse
   Headers: Authorization: Bearer YOUR_TOKEN_HERE
   Body: {"text":"Show me available events"}
   ```

---

## Phase 5: Deploy Frontend to Vercel

### Step 5.1: Sign up for Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel

### Step 5.2: Import Project
1. Click "Add New..." → "Project"
2. Import `nimnay/TicketSystem`
3. When prompted for framework, select "Create React App"
4. Click "Edit" next to Root Directory
5. Set Root Directory to: `frontend`

### Step 5.3: Configure Build Settings
```
Framework Preset: Create React App
Build Command: npm run build
Output Directory: build
Install Command: npm install
Node Version: 18.x
```

### Step 5.4: Add Environment Variables
Click "Environment Variables" and add:
```
REACT_APP_API_URL = https://ticketsystem-client.onrender.com
REACT_APP_AUTH_URL = https://ticketsystem-auth.onrender.com
REACT_APP_LLM_URL = https://ticketsystem-llm.onrender.com
REACT_APP_ADMIN_URL = https://ticketsystem-admin.onrender.com
```
(Use your actual Render URLs from Phase 4)

### Step 5.5: Deploy
1. Click "Deploy"
2. Wait 2-5 minutes for build
3. **Save your Vercel URL** (e.g., `https://ticketsystem-abc123.vercel.app`)

---

## Phase 6: Update Backend CORS with Production URL

### Step 6.1: Update CORS in all services
For each backend service, you need to update the CORS configuration:

1. Open local file (e.g., `backend/user-authentication/server.js`)
2. Update CORS to include your Vercel URL:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:3000',
       'https://ticketsystem-abc123.vercel.app',  // Your actual Vercel URL
       'https://*.vercel.app'
     ],
     credentials: true
   }));
   ```
3. Repeat for all 4 services
4. Commit and push:
   ```bash
   git add .
   git commit -m "Updated CORS for production"
   git push origin main
   ```
5. Render will automatically redeploy (wait 2-3 minutes)

---

## Phase 7: Final Testing

### Step 7.1: Test Registration Flow
1. Open your Vercel URL in browser
2. Click "Register"
3. Fill in: username, email, password
4. Submit
5. You should be logged in automatically

### Step 7.2: Test Login Flow
1. Logout
2. Click "Login"
3. Enter credentials
4. Should login successfully

### Step 7.3: Test Booking Flow
1. While logged in, open chat
2. Type: "Show me available events"
3. Should see event list
4. Type: "Book 2 tickets for [event name]"
5. Should see confirmation prompt
6. Click "Confirm Booking"
7. Should see success message

### Step 7.4: Check Browser Console
1. Press F12
2. Go to Console tab
3. Should see NO red errors
4. If you see CORS errors, repeat Phase 6

### Step 7.5: Test Token Expiration
1. Login
2. Wait 30 minutes (or manually set system time forward)
3. Try to book a ticket
4. Should redirect to login screen

---

## Troubleshooting

### Issue: "CORS policy" error in browser console
**Fix:** Make sure you updated CORS in Phase 6.1 with your exact Vercel URL

### Issue: "Cannot connect to database"
**Fix:** Run `node setup.js` in Render Shell for that service

### Issue: "Invalid or expired token"
**Fix:** Verify all backend services use the SAME JWT_SECRET

### Issue: Frontend shows blank page
**Fix:** Check Vercel build logs. May need to fix import errors.

### Issue: 502 Bad Gateway on Render
**Fix:** Service may be sleeping (free tier). Wait 30 seconds and try again.

### Issue: LLM service not working
**Fix:** Verify GEMINI_API_KEY is set correctly in Render environment variables

---

## Verification Checklist

Once all steps complete, verify:
- [ ] All 4 backend services show "Live" in Render
- [ ] Frontend deployed successfully on Vercel
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Can see events list
- [ ] Can send chat message
- [ ] Can book tickets via chat
- [ ] Token expires after 30 minutes
- [ ] Logout works
- [ ] No CORS errors in console
- [ ] All backend URLs are HTTPS
- [ ] Frontend URL is HTTPS

---

## Your Deployed URLs

Write down your URLs here for reference:

- **Frontend (Vercel):** ___________________________________
- **Auth Service (Render):** ________________________________
- **Admin Service (Render):** _______________________________
- **Client Service (Render):** ______________________________
- **LLM Service (Render):** _________________________________

---

**Estimated Time:** 1-2 hours
**Cost:** $0 (all free tiers)

Good luck! Execute one phase at a time and check off each step.
