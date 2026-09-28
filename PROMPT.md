You are an autonomous senior full-stack engineer running headless in a macOS terminal via the Antigravity CLI. No one can answer questions, so NEVER ask anything and never wait for approval. Whenever something is ambiguous, choose the most sensible default, keep going, and record the decision in the README under "Assumptions". If a command fails, debug and retry with alternatives (several attempts) instead of stopping. Work only inside the current directory. Never use sudo, never push to any remote, never log in to any service. Only stop when everything in the "Definition of Done" is finished.

## PROJECT: Real-time Chat Web Application

### Fixed stack (do not ask)
- Frontend: React + Vite + TypeScript, clean modern responsive UI (plain CSS modules or Tailwind, stay consistent).
- Backend: Node.js + Express + Socket.io (TypeScript, ESM).
- Database: SQLite via better-sqlite3 behind a repository layer (swappable for MongoDB later). If it fails to install, fall back to node:sqlite or sqlite3 and note it in the README.
- Socket.io is MANDATORY for real-time messaging. No polling, no Firebase.

### Structure
/backend  src/{config,routes,controllers,services,repositories,sockets,middleware,db,utils}, tests/, .env.example, Dockerfile
/frontend src/{pages,components,hooks,services,context,utils,types}, .env.example
/docs, render.yaml, README.md, PLAN.md, FINAL_REPORT.md
Root package.json scripts: `npm run dev` (backend + frontend together via concurrently), `npm run test`, `npm run build`.

### Backend
REST (JSON, validation, centralized error middleware, CORS, response shape {success, data, error}):
- POST /api/login: dummy username login, no password
- POST /api/messages: send message {username, text}; persist and broadcast via Socket.io
- GET /api/messages?limit=&before=: paginated history, returned oldest to newest
- GET /api/users/online
- GET /health
Socket.io:
- Authenticate by username in handshake; mark online on connect and broadcast presence
- Events: message:new, typing:start, typing:stop, presence:update, message:delivered, message:read, error
- Graceful disconnect/reconnect, clear typing state on disconnect, multi-tab safe presence (connection count per user), all handlers in try/catch emitting `error` to the client
Message model: id, username, text, createdAt (ISO), status (sent|delivered|read). Validate: non-empty, trimmed, max 1000 chars, sanitized. Config via dotenv (PORT, CLIENT_ORIGIN, DB_PATH).

### Frontend
- Login page (username only), persisted in localStorage
- Chat page: bubbles (own vs others aligned differently), sender name, timestamp on every message (e.g. "10:42 AM"), auto-scroll, input with send button and Enter-to-send, empty and loading states, online users sidebar/header count
- Loads history from REST on startup so messages persist across refresh
- Receives messages instantly via socket.io-client
- Also implement: typing indicator, online/offline status, delivered/read ticks, connection status banner with auto-reconnect, error toasts for API and socket failures
- Clean architecture: socket service singleton, API service layer, hooks (useChat, useSocket, usePresence), auth context. No business logic in UI components.
- API/socket URL from VITE_API_URL, default http://localhost:4000

### Code quality
Meaningful folders, small reusable functions/components, ESLint + Prettier, tests for REST endpoints (Vitest or Jest + Supertest).

### README.md (thorough)
Overview, features, tech stack, Mermaid architecture diagram, setup, run backend, run frontend, env vars for both (with examples), API docs with sample requests/responses, socket event reference, design decisions, assumptions, known limitations (SQLite on Render free tier has ephemeral disk; mention persistent disk or MongoDB), deployment steps for Render/Railway (backend) and Vercel/Netlify (frontend).

### Deployment
Create render.yaml and backend Dockerfile only. Do not deploy.

### Execution rules
1. Write a brief PLAN.md, then immediately execute.
2. Commit to git locally in logical steps.
3. Verify by actually running things:
   - Start the backend, curl every REST endpoint, confirm responses.
   - Write and run a Node script with two Socket.io clients proving broadcast, typing, presence, delivered/read events.
   - Run `npx tsc --noEmit` and a production build of the frontend.
   - Install Playwright (`npx playwright install chromium`) and run it headlessly: open two browser contexts as two users, send messages both ways, reload, confirm history persists and timestamps show. Save screenshots to /docs/screenshots.
   Fix everything that fails. Stop any servers you started when done.
4. No TODOs, placeholders, or stubbed features.
5. Write /docs/SCREEN_RECORDING_GUIDE.md: a short script for a screen recording (two browser windows, login, real-time chat, typing indicator, presence, refresh persistence, timestamps).

### Definition of Done
- `npm run dev` starts both apps from the root
- All REST and Socket.io flows verified by real runs; tests pass
- Messages persist across refresh; timestamps display; real-time delivery works between two clients
- README complete; repo clean and committed
- FINAL_REPORT.md written: what was built, how to run it, what was verified, what could not be done and why, and my exact manual next steps (create GitHub repo and push, deploy backend on Render, deploy frontend, record screen, upload to Google Drive).
