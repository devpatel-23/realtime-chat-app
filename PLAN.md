# Execution Plan: Real-time Chat Web Application

## Overview
This document outlines the step-by-step engineering plan for building, verifying, and documenting a production-grade Real-time Chat Web Application.

---

## 1. Project Initialization & Architecture Setup
- **Root Setup**:
  - Root `package.json` with workspaces or root orchestration (`concurrently`, test runner, build scripts).
  - Git repository initialization and commit hygiene.
- **Backend Setup (`/backend`)**:
  - TypeScript, ESM (`"type": "module"`), Node.js, Express, Socket.io.
  - SQLite database layer using a clean Repository pattern (`IMessageRepository`). Test `better-sqlite3`, fallback gracefully to `node:sqlite` or `sqlite3` if native compilation issues occur on Node 26.
  - Standardized REST response wrapper `{ success: boolean, data?: any, error?: string | object }`.
  - Centralized error handler and validation middleware.
  - REST endpoints:
    - `POST /api/login`: Username-based dummy auth.
    - `POST /api/messages`: Validate, persist, broadcast message.
    - `GET /api/messages?limit=&before=`: Cursor/pagination history, returned oldest-to-newest.
    - `GET /api/users/online`: Current active online users list and count.
    - `GET /health`: Health and uptime check.
  - Socket.io Server:
    - Handshake authentication by username.
    - Multi-tab presence tracking (connection counting per username).
    - Events: `message:new`, `typing:start`, `typing:stop`, `presence:update`, `message:delivered`, `message:read`, `error`.
    - Disconnect cleanup and typing reset.
  - Tests: Vitest / Supertest for REST endpoints.
  - Config: Dotenv configuration with defaults (`PORT=4000`, `CLIENT_ORIGIN=http://localhost:5173`, `DB_PATH=./data/chat.db`).
  - Dockerfile & `.env.example`.
- **Frontend Setup (`/frontend`)**:
  - Vite + React + TypeScript + Tailwind CSS for a modern, responsive, polished UI.
  - Architecture:
    - Services: `socket.service.ts` (singleton), `api.service.ts`.
    - Context: `AuthContext` (stores user in `localStorage`).
    - Hooks: `useSocket`, `usePresence`, `useChat`.
    - Components: Header with connection status banner, Sidebar with online users, ChatWindow, MessageBubble (differentiated own vs. others, status ticks, timestamps), MessageInput (Enter-to-send, typing debounce), TypingIndicator, Toast alerts.
    - Pages: `LoginPage` and `ChatPage`.
    - Empty and loading states, auto-scroll with manual override.
  - Config: `.env.example`, Vite config with proxy/env vars.

---

## 2. Implementation Steps
1. **Root & Backend Scaffolding**:
   - Create directories and dependencies.
   - Verify SQLite setup.
   - Implement database schema, repository, service, controllers, routes, middleware, and socket handlers.
   - Write automated unit and integration tests (Vitest + Supertest).
2. **Frontend Implementation**:
   - Scaffold Vite React TS app.
   - Configure Tailwind CSS.
   - Implement API & Socket client services, Contexts, Hooks, and UI components.
   - Build login flow and real-time chat interface with delivery/read ticks, typing indicators, and presence updates.
3. **Deployment Assets**:
   - `render.yaml` configuration.
   - `backend/Dockerfile` multi-stage build.

---

## 3. Comprehensive Verification
1. **REST Verification**:
   - Start backend server and curl all endpoints (`/health`, `/api/login`, `/api/messages`, `/api/users/online`).
   - Run Vitest suite for automated validation.
2. **Socket.io Flow Verification**:
   - Create a standalone Node script with two concurrent Socket.io client instances.
   - Test login handshake, presence updates, bidirectional messaging, typing indicators, and delivered/read receipts.
3. **Frontend Build & Types**:
   - Run `tsc --noEmit` and `npm run build` in `/frontend`.
4. **End-to-End Headless Browser Verification (Playwright)**:
   - Install Playwright & Chromium.
   - Launch two browser contexts (User A and User B).
   - Test simultaneous login, message exchange, typing indicator display, presence badge updates, and message persistence after browser reload.
   - Capture screenshot artifacts in `/docs/screenshots`.

---

## 4. Documentation & Final Delivery
- Write comprehensive `README.md` including Mermaid diagrams, setup, API & socket specs, deployment instructions, assumptions, and known limitations.
- Write `/docs/SCREEN_RECORDING_GUIDE.md`.
- Write `FINAL_REPORT.md` summarizing build, verification, results, and next steps.
- Ensure all servers are stopped and git commits are clean.
