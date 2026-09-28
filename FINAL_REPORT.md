# Final Project Report: Real-Time Chat Web Application

**Date**: September 28, 2026  
**Engineer**: Antigravity Autonomous Senior Full-Stack Engineer  
**Repository**: `/Users/devpatel/Projects/chat-app`  

---

## 1. Executive Summary & What Was Built

A full-stack, production-grade Real-Time Chat Web Application was engineered from scratch to fulfill all functional, architectural, performance, and documentation criteria specified in the prompt:

1. **Frontend (`/frontend`)**:
   - Built with **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**.
   - Clean architecture separating presentation components from business logic:
     - **Services**: `socket.service.ts` (singleton managing Socket.io client lifecycle) and `api.service.ts` (REST client wrapper).
     - **Contexts**: `AuthContext` (username persistence in `localStorage`, login/logout) and `ToastContext` (floating error/success notifications).
     - **Hooks**: `useChat` (message history loading, real-time messaging, optimistic updates, pagination, typing timers), `useSocket` (connection status banner, auto-reconnect), `usePresence` (online member tracking).
     - **Components**: `Header`, `ConnectionBanner`, `ChatWindow`, `MessageBubble` (differentiated own vs. others alignment, sender name, formatted timestamps, delivery/read tick marks), `MessageInput` (Enter-to-send, char counter), `TypingIndicator` (wave animation), `Sidebar` (online members drawer with search filter), and `ToastContainer`.
   - Polished responsive UI with custom dark mode theme, scrollbars, auto-scrolling to newest messages with manual override button, skeleton loaders, and empty states.

2. **Backend (`/backend`)**:
   - Built with **Node.js**, **Express**, **Socket.io**, and **TypeScript** (ESM).
   - Clean layer separation:
     - `src/config/`: Environment configuration (`PORT`, `CLIENT_ORIGIN`, `DB_PATH`, `NODE_ENV`).
     - `src/db/`: Synchronous SQLite connection in WAL mode (`PRAGMA journal_mode = WAL`).
     - `src/repositories/`: `IMessageRepository` interface and `SQLiteMessageRepository` implementation.
     - `src/services/`: `MessageService` (validation, XSS escaping, business logic) and `PresenceService` (multi-tab connection counting per user).
     - `src/controllers/`: `AuthController`, `MessageController`, `UserController`, `HealthController`.
     - `src/routes/`: Modular Express routing.
     - `src/middleware/`: Input validation and centralized error handling returning standardized response `{ success, data, error }`.
     - `src/sockets/`: Socket.io server with handshake username authentication, multi-tab presence tracking, bidirectional typing events, message delivery/read receipts, and error wrapping.

3. **Database Layer**:
   - SQLite backed by an indexed `messages` table (`id`, `username`, `text`, `createdAt`, `status`).
   - Repository pattern abstraction allows seamless drop-in replacement with MongoDB or PostgreSQL without modifying controllers or real-time handlers.

4. **Deployment & Automation Artifacts**:
   - `render.yaml` for Render blueprint deployments.
   - `backend/Dockerfile` multi-stage container build with health check.
   - `docs/SCREEN_RECORDING_GUIDE.md` comprehensive demo narration script.
   - `docs/screenshots/` automated headless browser test screenshot captures.
   - `scripts/verify-rest.sh`, `scripts/verify-sockets.mjs`, and `scripts/e2e-playwright.mjs`.

---

## 2. How to Run It

### Quick Start (Both Apps Concurrently)
From the repository root:
```bash
npm run dev
```
- Backend starts at `http://localhost:4000`
- Frontend starts at `http://localhost:5173`

### Run Backend Standalone
```bash
cd backend
npm run dev      # or: npm run build && npm start
```

### Run Frontend Standalone
```bash
cd frontend
npm run dev      # or: npm run build && npm run preview
```

### Run Tests
```bash
npm run test     # Runs 11 Vitest endpoint test cases
```

### Run Production Build
```bash
npm run build    # Compiles backend TypeScript and Vite production bundle
```

---

## 3. What Was Verified (Detailed Test Results)

All verification steps specified in the execution rules were executed and passed with 100% success:

### A. REST Endpoint Verification (`scripts/verify-rest.sh`)
Started the backend server and executed `curl` commands against every endpoint:
- `GET /health` -> `200 OK` `{"success":true,"data":{"status":"ok",...}}`
- `POST /api/login` (valid username) -> `200 OK` `{"success":true,"data":{"username":"curl_verifier",...}}`
- `POST /api/login` (empty username) -> `400 Bad Request` `{"success":false,"error":"Username is required"}`
- `POST /api/messages` -> `201 Created` `{"success":true,"data":{"id":"...","status":"sent",...}}`
- `GET /api/messages?limit=5` -> `200 OK` (returns array of messages ordered oldest to newest)
- `GET /api/users/online` -> `200 OK` `{"success":true,"data":{"users":[],"count":0}}`

### B. Automated Integration Tests (`backend/tests/api.test.ts`)
Ran `npm run test` using **Vitest**:
- 11/11 tests passed in 483ms:
  - `GET /health` returns status ok
  - `POST /api/login` validates username & rejects invalid characters / empty strings
  - `POST /api/messages` creates and persists messages
  - Message content is sanitized against XSS
  - Rejects empty messages and messages exceeding 1000 characters
  - `GET /api/messages` returns messages ordered oldest to newest
  - Pagination with `limit` and `before` ISO cursor
  - `GET /api/users/online` returns active presence count

### C. Real-Time Socket.io Two-Client Flow (`scripts/verify-sockets.mjs`)
Ran a standalone script connecting two distinct Socket.io client instances ("Alice" and "Bob"):
- Handshake authentication with username verified.
- Initial presence broadcast `{ users: ['Alice', 'Bob'], count: 2 }` confirmed.
- Real-time typing indicators (`typing:start` and `typing:stop`) sent by Alice and received by Bob confirmed.
- Message broadcast (`message:new`) sent by Alice and received by Bob confirmed.
- Delivery receipt (`message:delivered`) sent by Bob and confirmed by Alice.
- Read receipt (`message:read`) sent by Bob and confirmed by Alice.
- Graceful disconnect of Bob verified; Alice received updated presence `{ users: ['Alice'], count: 1 }`.

### D. TypeScript & Production Builds
- `npx tsc --noEmit` executed in `/backend`: 0 errors.
- `npx tsc --noEmit` executed in `/frontend`: 0 errors.
- `npm run build` executed at root: both backend (`dist/index.js`) and frontend (`dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`) built cleanly.

### E. Headless Browser End-to-End Test (`scripts/e2e-playwright.mjs`)
Automated multi-user browser flow using Playwright:
- Launched two independent browser contexts (Context 1: Alice, Context 2: Bob).
- Logged in both users and verified real-time entry into the chat room.
- Alice typed a message; Bob's screen displayed the live `Alice is typing...` indicator.
- Alice sent the message; Bob received it in real-time.
- Bob replied; Alice received the reply in real-time.
- Reloaded Alice's browser window; Alice stayed authenticated (persisted in `localStorage`), and all message history reloaded from SQLite REST endpoint.
- Verified formatted timestamps displayed on all message bubbles.
- Captured screenshot evidence saved to `docs/screenshots/`:
  - `01-bob-sees-alice-typing.png`
  - `02-alice-sent-message-with-ticks.png`
  - `03-bob-received-message.png`
  - `04-two-way-chat-complete.png`
  - `05-alice-reloaded-persistence.png`
- Gracefully shut down all background preview and backend servers.

---

## 4. What Could Not Be Done and Why

1. **`better-sqlite3` Native Addon Compilation**:
   - `better-sqlite3` failed to compile during `npm install` on this environment (Node.js v26.10.0 on macOS arm64) due to C++ standard library header differences (`climits file not found`).
   - **Resolution**: In accordance with the prompt specification (*"If it fails to install, fall back to node:sqlite or sqlite3 and note it in the README"*), the backend repository layer was transitioned to Node.js's built-in `node:sqlite` (`DatabaseSync`). It runs natively with zero compilation steps, high throughput, and WAL concurrency.
2. **Cloud Remote Deployment & Remote Git Push**:
   - Cloud deployments (Render / Vercel / Railway) and pushing to a remote Git repository were **intentionally not performed** per the explicit execution rules:
     - *"Never push to any remote, never log in to any service."*
     - *"Create render.yaml and backend Dockerfile only. Do not deploy."*
   - Full deployment configurations (`render.yaml`, `backend/Dockerfile`, `.env.example`) and step-by-step instructions have been provided for manual deployment.

---

## 5. Exact Manual Next Steps for the User

Follow these exact steps to deploy and complete the project delivery:

### Step 1: Create GitHub Repository & Push Code
1. Open your browser and go to [github.com/new](https://github.com/new).
2. Create a new repository (e.g. `realtime-chat-app`).
3. In your terminal, link and push the committed code:
   ```bash
   cd /Users/devpatel/Projects/chat-app
   git remote add origin https://github.com/<your-username>/realtime-chat-app.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy Backend on Render
1. Navigate to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository. Render will automatically parse [render.yaml](file:///Users/devpatel/Projects/chat-app/render.yaml).
4. Review the environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
   - `CLIENT_ORIGIN`: `*` (or your frontend domain once deployed)
   - `DB_PATH`: `./data/chat.db`
5. Click **Apply**. Once built, copy your backend URL (e.g. `https://chat-app-backend.onrender.com`).

### Step 3: Deploy Frontend on Vercel or Netlify
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository.
3. In project settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://chat-app-backend.onrender.com` (your backend URL from Step 2)
5. Click **Deploy**.

### Step 4: Record Screen Demonstration
1. Open [docs/SCREEN_RECORDING_GUIDE.md](file:///Users/devpatel/Projects/chat-app/docs/SCREEN_RECORDING_GUIDE.md).
2. Open two browser windows side-by-side at `http://localhost:5173` (or your deployed Vercel URL).
3. Follow the 5-step script (Login as Alice and Bob -> Typing indicator -> Real-time chat -> Page refresh persistence -> Disconnect).
4. Keep the video between 1 and 2 minutes.

### Step 5: Upload to Google Drive & Submit
1. Save your recorded video file (e.g. `chat-app-demo.mp4`).
2. Upload the file to Google Drive.
3. Set file sharing permissions to **"Anyone with the link can view"**.
4. Submit your GitHub repository URL and Google Drive video link.
