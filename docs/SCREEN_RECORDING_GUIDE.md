# Screen Recording Guide: Real-Time Chat Application Demo

This document provides a concise, step-by-step director's script to demonstrate the full capabilities of the Real-time Chat Web Application in a 1-to-2 minute screen recording.

---

## Preparation & Setup

1. **Terminal 1**: Start both frontend and backend concurrently from the root directory:
   ```bash
   npm run dev
   ```
   - Backend will run on `http://localhost:4000`
   - Frontend will run on `http://localhost:5173`

2. **Browser Windows**:
   - Open **two browser windows** side-by-side (Window A on the left, Window B on the right).
   - Use an incognito/private window for Window B to ensure completely isolated `localStorage` and cookie sessions.
   - Navigate both windows to `http://localhost:5173`.

---

## Recording Script & Timeline

### Step 1: Login & Presence (0:00 – 0:20)
- **Window A (Left)**:
  - Show the modern dark-themed login screen.
  - Enter username: `Alice` (or click the quick test account button).
  - Click **"Join Chat Room"** or hit Enter.
  - Note: Alice enters the chat room. The header displays `1 user online`.
- **Window B (Right)**:
  - Enter username: `Bob`.
  - Click **"Join Chat Room"**.
  - **Visual Cue**: Observe both windows immediately update the header counter in real-time to `2 users online`.
  - Click the **"Online"** button on the header to reveal the online members drawer on both sides, demonstrating multi-tab presence tracking.

### Step 2: Real-Time Typing Indicator (0:20 – 0:35)
- **Window A (Alice)**:
  - In the message input field, begin typing: *"Hey Bob, can you see this typing indicator?"* (do not press Enter yet).
- **Window B (Bob)**:
  - **Visual Cue**: Highlight the animated three-dot wave and indicator text: `Alice is typing...` appearing in real-time above Bob's input box.
- **Window A (Alice)**:
  - Stop typing for 2 seconds. The indicator automatically disappears via debounced socket emission.

### Step 3: Instant Real-Time Messaging & Status Ticks (0:35 – 0:55)
- **Window A (Alice)**:
  - Hit **Enter** to send the message.
  - **Visual Cue**: The message immediately renders on Alice's side aligned to the right in an indigo bubble.
  - Note the formatted timestamp (e.g., `10:42 AM`) and the single tick transitioning into double check marks (`delivered` and `read` in sky blue).
- **Window B (Bob)**:
  - **Visual Cue**: The message appears instantaneously on Bob's side aligned to the left with Alice's name and colored avatar initials.
- **Window B (Bob)**:
  - Type response: *"Yes! Delivered instantly without page refresh."* and press **Enter**.
  - Observe the reply instantly appear on Alice's screen on the left.

### Step 4: Refresh Persistence & History (0:55 – 1:15)
- **Window A (Alice)**:
  - Press `Cmd + R` (or browser refresh button) to reload the page.
  - **Visual Cue**: Alice remains logged in automatically via `localStorage` session persistence.
  - **Visual Cue**: The complete chat history with timestamps is fetched from the SQLite database via the REST endpoint (`GET /api/messages`) and rendered cleanly.
  - Presence is restored without orphaned sessions.

### Step 5: Disconnect Handling & Graceful Exit (1:15 – 1:30)
- **Window B (Bob)**:
  - Click the **Logout** icon on the top right.
  - Bob returns to the login screen.
- **Window A (Alice)**:
  - **Visual Cue**: Notice the header presence counter automatically drops from `2 users online` to `1 user online`.
  - In the terminal, press `Ctrl + C` to shut down gracefully.

---

## Key Features Demonstrated Checklist
- [x] Concurrent startup (`npm run dev`)
- [x] Dual-window multi-user interaction
- [x] Real-time Socket.io handshake and presence broadcasting
- [x] Real-time typing indicators with debounce
- [x] Instant two-way messaging with distinct message alignment
- [x] Message status ticks (sent, delivered, read)
- [x] Formatted timestamps on every message
- [x] Database persistence across page refresh
- [x] Graceful disconnect and presence cleanup
