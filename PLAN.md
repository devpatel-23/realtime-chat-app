# Execution Plan: Real-time Chat Web Application

## Overview
This plan defines the step-by-step implementation and verification strategy for the Real-time Chat Web Application with Node.js/Express/Socket.io backend, SQLite persistence, and React + Vite + TypeScript frontend.

---

## Phase 1: Project Scaffolding & Root Configuration
1. Initialize root `package.json` with scripts:
   - `npm run dev`: concurrent execution of backend and frontend.
   - `npm run test`: execute backend and frontend test suites.
   - `npm run build`: compile backend TypeScript and build Vite production bundle.
2. Initialize backend directory structure:
   - `backend/src/{config,routes,controllers,services,repositories,sockets,middleware,db,utils}`
   - `backend/tests`
   - `backend/.env.example`
   - `backend/Dockerfile`
3. Initialize frontend directory structure:
   - `frontend/src/{pages,components,hooks,services,context,utils,types}`
   - `frontend/.env.example`
4. Setup ESLint and Prettier across workspaces.

---

## Phase 2: Backend Development (Node.js + Express + Socket.io + SQLite)
1. **Database & Repository Layer**:
   - SQLite initialization via `better-sqlite3` (with fallback to `node:sqlite` or `sqlite3` if native build fails on Node 26).
   - `IMessageRepository` interface and SQLite implementation (`SQLiteMessageRepository`).
   - SQLite schema migration for `messages`: `id`, `username`, `text`, `createdAt`, `status` (`sent` | `delivered` | `read`).
2. **Services**:
   - `MessageService`: sanitization, length/content validation, persistence, status updates.
   - `PresenceService`: multi-tab connection tracking (`Map<username, Set<socketId>>`), online status querying.
   - `TypingService`: in-memory debounce/expiry tracking for typing users.
3. **REST API**:
   - Centralized JSON responses: `{ success: true, data: ... }` / `{ success: false, error: ... }`.
   - `POST /api/login`: dummy username login validation.
   - `POST /api/messages`: post message, persist, broadcast via Socket.io.
   - `GET /api/messages?limit=&before=`: paginated history (oldest to newest).
   - `GET /api/users/online`: active online usernames list.
   - `GET /health`: system health check.
   - Centralized error handling and CORS middleware.
4. **Socket.io Layer**:
   - Handshake authentication by username.
   - Event handlers with try/catch emitting `error` event on failures:
     - `message:new`: broadcast message to all clients.
     - `typing:start` and `typing:stop`: notify other users.
     - `presence:update`: multi-tab safe user presence broadcast.
     - `message:delivered` and `message:read`: update persistence and notify participants.
     - `disconnect`: remove socket, update presence, clear typing state.
5. **Testing**:
   - Automated integration tests with Vitest & Supertest for all REST endpoints and error cases.

---

## Phase 3: Frontend Development (React + Vite + TypeScript + Tailwind)
1. **Design System & Styling**:
   - Responsive, modern Tailwind CSS layout.
   - Clean dark/light neutral palette, chat bubbles, avatar indicators, connection banner, and toast alerts.
2. **State & Architecture**:
   - `AuthContext`: handles login, localStorage persistence, logout.
   - `SocketService`: singleton connection lifecycle manager.
   - `ApiService`: centralized HTTP client.
   - Hooks: `useSocket`, `useChat`, `usePresence`.
3. **Components**:
   - `LoginPage`: username input, form validation, submit action.
   - `ChatPage`:
     - Header with online user counter & connection status indicator.
     - Disconnected / Reconnecting banner.
     - Online users sidebar with active indicators.
     - Message list with auto-scroll, empty state, and loading skeletons.
     - Message bubbles (own vs others) with sender name, formatted timestamps ("10:42 AM"), delivered/read tick marks.
     - Typing indicator with animated dots ("Alice is typing...").
     - Message input with Enter-to-send and send button.
     - Error toast notifications for REST and Socket errors.

---

## Phase 4: Verification & Real Runs
1. Start backend server and test every REST endpoint with `curl`.
2. Execute Node.js automated Socket.io client script simulating two simultaneous users (Presence, Typing, Messaging, Delivery/Read ticks).
3. Run frontend TypeScript checks (`npx tsc --noEmit`) and production build (`npm run build`).
4. Execute headless Playwright test with two browser contexts:
   - User A and User B log in.
   - Exchange messages in real-time.
   - Verify typing indicators and presence.
   - Verify delivery and read status.
   - Refresh browser and verify history persistence and timestamps.
   - Capture screenshots in `/docs/screenshots/`.
5. Stop background test servers.

---

## Phase 5: Documentation & Artifacts
1. `render.yaml` and `backend/Dockerfile`.
2. `/docs/SCREEN_RECORDING_GUIDE.md`: step-by-step instructions for demonstrating all features.
3. `README.md`: comprehensive documentation with Mermaid architecture diagram, API documentation, Socket events, and deployment guides.
4. `FINAL_REPORT.md`: thorough summary of accomplishments, test verification results, limitations, and manual next steps.
