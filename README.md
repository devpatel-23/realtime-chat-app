# Realtime Chat

A small chat app where everyone in the room sees messages the moment they are sent. The frontend is React, the backend is Node with Express and Socket.io, and messages are stored in SQLite so they are still there after a refresh.

Live app: `<add Vercel URL>`
Live API: `<add Render URL>` (check `/health`)

The backend runs on a free Render instance, so the first request after a quiet period can take about a minute while it wakes up.

## What it does

- Log in with just a username (no password)
- Send and receive messages in real time over Socket.io
- Chat history loads from the database, so it survives a page refresh
- Every message shows its sender and a timestamp
- Typing indicator, online users list, and delivered/read ticks
- Connection banner that shows when the socket drops and reconnects
- Error toasts when a request or socket event fails

## Tech stack

| Part | Tools |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, Socket.io, TypeScript (ESM) |
| Database | SQLite through Node's built-in `node:sqlite` |
| Tests | Vitest and Supertest |

## Running it locally

You need Node.js 24 or newer. The backend uses the built-in `node:sqlite` module, which older versions do not have.

```bash
git clone https://github.com/devpatel-23/realtime-chat-app.git
cd realtime-chat-app
npm install
npm run dev
```

If `npm install` at the root does not pull in the workspaces on your machine, run `npm install` inside `backend` and `frontend` as well.

This starts both apps:

- Backend on http://localhost:4000
- Frontend on http://localhost:5173

Open the frontend in two browser windows, log in as two different users, and send messages between them.

To run only one side:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Other scripts, from the repo root:

```bash
npm run test    # backend endpoint tests
npm run build   # compile the backend and build the frontend
```

## Environment variables

Copy each `.env.example` to `.env` before running.

**backend/.env**

| Variable | Example | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Port the server listens on |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed origin for CORS and Socket.io |
| `DB_PATH` | `./data/chat.db` | Where the SQLite file lives |
| `NODE_ENV` | `development` | Runtime mode |

**frontend/.env**

| Variable | Example | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:4000` | Base URL for both the REST API and the socket connection |

## Project layout

```
backend/
  src/
    config/         environment settings
    db/             SQLite connection
    repositories/   message storage behind an interface
    services/       message rules, presence tracking
    controllers/    request handlers
    routes/         Express routes
    middleware/     validation, error handling
    sockets/        Socket.io server
  tests/            API tests
frontend/
  src/
    pages/          login and chat screens
    components/     message bubbles, input, sidebar, banners
    hooks/          useChat, useSocket, usePresence
    services/       REST client and socket client
    context/        auth and toast state
scripts/            manual verification scripts
docs/               screen recording guide and screenshots
```

## API

Every response has the same shape: `{ "success": true, "data": ... }` or `{ "success": false, "error": "message" }`.

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/api/login` | Takes `{ "username": "alice" }` and returns the user |
| `POST` | `/api/messages` | Takes `{ "username", "text" }`, saves the message and broadcasts it |
| `GET` | `/api/messages` | Chat history, oldest first. Optional `limit` and `before` (an ISO timestamp) for paging |
| `GET` | `/api/users/online` | Currently online users and a count |

Example:

```bash
curl -X POST http://localhost:4000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","text":"hello"}'
```

Messages are trimmed, must not be empty, and are capped at 1000 characters. Text is escaped before it is stored.

A message looks like this:

```json
{
  "id": "…",
  "username": "alice",
  "text": "hello",
  "createdAt": "2026-09-28T09:30:00.000Z",
  "status": "sent"
}
```

`status` moves from `sent` to `delivered` to `read`.

## Socket events

The client connects with its username in the handshake.

| Event | Meaning |
| --- | --- |
| `message:new` | A new message was saved; sent to every connected client |
| `typing:start` / `typing:stop` | Someone started or stopped typing |
| `presence:update` | The online list changed; carries the users and a count |
| `message:delivered` | A client confirms it received a message |
| `message:read` | A client confirms it displayed a message |
| `error` | Something failed in a handler; sent back to that client only |

## Design decisions

- **Layers on the backend.** Controllers stay thin, rules live in services, and the database sits behind a repository interface. Swapping SQLite for MongoDB or Postgres means writing one new repository.
- **REST for history, sockets for live updates.** The socket only pushes changes. Loading history over REST keeps page loads simple and makes the data easy to test with curl.
- **Presence counts connections per user.** A user with two tabs open is one person, so they only go offline when their last connection closes.
- **`node:sqlite` instead of `better-sqlite3`.** `better-sqlite3` failed to compile on the development machine, and the built-in module needs no native build step.
- **No business logic in components.** Components render. The hooks and services own the socket, the API calls, and the message state.

## Assumptions

- The login is a username only, with no password or token. It exists to tell users apart, not to secure anything.
- There is one shared chat room for everyone.
- Usernames are treated as unique identities while they are connected.

## Limitations

- **History resets on free hosting.** Render's free web services have an ephemeral filesystem and cannot attach a persistent disk, so the SQLite file is lost when the service restarts, redeploys, or spins down. Locally, history persists normally. To keep data on a free host you would move storage to a hosted database such as MongoDB Atlas or Postgres, which only needs a new repository implementation.
- No private messages, rooms, or message editing.
- The login offers no real authentication.

## Deployment

**Backend on Render**

1. Push the repo to GitHub.
2. In Render, choose New, then Blueprint, and select the repo. It reads `render.yaml`.
3. Set `CLIENT_ORIGIN` to the frontend URL once you have it.
4. After it deploys, open `<backend-url>/health` to check it is up.

**Frontend on Vercel**

1. Import the repo in Vercel.
2. Set the root directory to `frontend`, the build command to `npm run build`, and the output directory to `dist`.
3. Add `VITE_API_URL` pointing at the Render URL, with no trailing slash.

## Verifying it works

The `scripts` folder has three checks I ran against the backend and frontend:

- `verify-rest.sh` calls each REST endpoint with curl
- `verify-sockets.mjs` connects two socket clients and checks messages, typing, presence, and delivered/read events
- `e2e-playwright.mjs` drives two browser sessions, sends messages both ways, reloads, and confirms history and timestamps

Screenshots from the browser run are in `docs/screenshots`, and `docs/SCREEN_RECORDING_GUIDE.md` lists what to show in a demo recording.
