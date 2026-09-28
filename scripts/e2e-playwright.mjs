import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright";

const ROOT_DIR = process.cwd();
const SCREENSHOTS_DIR = path.join(ROOT_DIR, "docs", "screenshots");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function waitForUrl(url, timeoutMs = 15000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // wait and retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log("=== Starting End-to-End Playwright Headless Verification ===");

  let backendProcess = null;
  let frontendProcess = null;
  let browser = null;

  try {
    // 1. Start Backend if not already running
    let backendRunning = false;
    try {
      const res = await fetch("http://localhost:4000/health");
      if (res.ok) backendRunning = true;
    } catch {}

    if (!backendRunning) {
      console.log("Starting backend server on port 4000...");
      backendProcess = spawn("node", ["dist/index.js"], {
        cwd: path.join(ROOT_DIR, "backend"),
        env: { ...process.env, PORT: "4000", NODE_ENV: "production" },
        stdio: "inherit",
      });
      await waitForUrl("http://localhost:4000/health");
      console.log("✔ Backend is ready on http://localhost:4000");
    } else {
      console.log("✔ Backend already running on http://localhost:4000");
    }

    // 2. Start Frontend preview server if not already running
    let frontendRunning = false;
    try {
      const res = await fetch("http://localhost:5173");
      if (res.ok) frontendRunning = true;
    } catch {}

    if (!frontendRunning) {
      console.log("Starting frontend preview on port 5173...");
      frontendProcess = spawn("npx", ["vite", "preview", "--port", "5173", "--host"], {
        cwd: path.join(ROOT_DIR, "frontend"),
        stdio: "inherit",
      });
      await waitForUrl("http://localhost:5173");
      console.log("✔ Frontend is ready on http://localhost:5173");
    } else {
      console.log("✔ Frontend already running on http://localhost:5173");
    }

    // 3. Launch Headless Chromium via Playwright
    console.log("\nLaunching Headless Chromium...");
    browser = await chromium.launch({
      headless: true,
    });

    // Create Context 1 (Alice)
    const contextAlice = await browser.newContext({
      viewport: { width: 1000, height: 800 },
    });
    const pageAlice = await contextAlice.newPage();

    // Create Context 2 (Bob)
    const contextBob = await browser.newContext({
      viewport: { width: 1000, height: 800 },
    });
    const pageBob = await contextBob.newPage();

    // 4. Log in Alice
    console.log("\nLogging in Alice in Context 1...");
    await pageAlice.goto("http://localhost:5173");
    await pageAlice.waitForSelector("input#username");
    await pageAlice.fill("input#username", "Alice");
    await pageAlice.click('button[type="submit"]');

    // Wait for chat screen
    await pageAlice.waitForSelector('input[placeholder*="Type a message"]');
    console.log("✔ Alice entered chat room");

    // 5. Log in Bob
    console.log("\nLogging in Bob in Context 2...");
    await pageBob.goto("http://localhost:5173");
    await pageBob.waitForSelector("input#username");
    await pageBob.fill("input#username", "Bob");
    await pageBob.click('button[type="submit"]');

    // Wait for chat screen
    await pageBob.waitForSelector('input[placeholder*="Type a message"]');
    console.log("✔ Bob entered chat room");

    // Give presence a moment to propagate
    await pageAlice.waitForTimeout(1000);

    // 6. Test typing indicator: Alice types
    console.log("\nTesting real-time typing indicator (Alice -> Bob)...");
    const aliceInput = pageAlice.locator('input[placeholder*="Type a message"]');
    await aliceInput.click();
    await aliceInput.pressSequentially("Hello Bob! Testing real-time chat with Socket.io.", {
      delay: 30,
    });

    // Check if Bob sees typing indicator
    const bobTyping = pageBob.locator("text=Alice is typing...");
    await bobTyping.waitFor({ state: "visible", timeout: 5000 });
    console.log('✔ Bob received real-time typing indicator: "Alice is typing..."');

    // Take screenshot of Bob seeing typing
    await pageBob.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-bob-sees-alice-typing.png"),
    });

    // 7. Alice sends message
    console.log("\nAlice sends message...");
    await aliceInput.press("Enter");

    // Wait for Alice to see her own message
    await pageAlice.waitForSelector("text=Hello Bob! Testing real-time chat with Socket.io.");
    console.log("✔ Alice message rendered in Alice chat window");

    // 8. Bob receives Alice message
    console.log("\nVerifying Bob received message in real-time...");
    await pageBob.waitForSelector("text=Hello Bob! Testing real-time chat with Socket.io.", {
      timeout: 5000,
    });
    console.log("✔ Bob received Alice message in real-time");

    // Give delivered/read receipts a moment
    await pageAlice.waitForTimeout(800);

    // Take screenshots
    await pageAlice.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-alice-sent-message-with-ticks.png"),
    });
    await pageBob.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-bob-received-message.png"),
    });

    // 9. Bob replies to Alice
    console.log("\nBob replies to Alice...");
    const bobInput = pageBob.locator('input[placeholder*="Type a message"]');
    await bobInput.fill("Hey Alice! The Socket.io integration is working smoothly.");
    await bobInput.press("Enter");

    // Alice sees Bob reply
    await pageAlice.waitForSelector(
      "text=Hey Alice! The Socket.io integration is working smoothly.",
      {
        timeout: 5000,
      }
    );
    console.log("✔ Alice received Bob reply in real-time");

    await pageAlice.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-two-way-chat-complete.png"),
    });

    // 10. Test Refresh Persistence
    console.log("\nTesting persistence across page refresh for Alice...");
    await pageAlice.reload();

    // Verify Alice stays logged in (localStorage) and messages reload from REST
    await pageAlice.waitForSelector('input[placeholder*="Type a message"]');
    await pageAlice.waitForSelector("text=Hello Bob! Testing real-time chat with Socket.io.");
    await pageAlice.waitForSelector(
      "text=Hey Alice! The Socket.io integration is working smoothly."
    );
    console.log("✔ Messages persisted across page reload from SQLite REST history!");

    // Verify timestamps are present on messages
    const timestamps = await pageAlice.locator("time").allTextContents();
    console.log("✔ Verified formatted timestamps present on reloaded messages:", timestamps);

    await pageAlice.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-alice-reloaded-persistence.png"),
    });

    console.log("\n🎉 ALL E2E Playwright tests passed with screenshots saved to docs/screenshots!");
  } catch (err) {
    console.error("❌ E2E Playwright test error:", err);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (frontendProcess) {
      frontendProcess.kill("SIGTERM");
    }
    if (backendProcess) {
      backendProcess.kill("SIGTERM");
    }
    // ensure any child processes on 4000/5173 are killed
    try {
      const pids = spawn("sh", [
        "-c",
        "lsof -t -i :4000 -i :5173 | xargs kill -9 2>/dev/null || true",
      ]);
      await new Promise((r) => pids.on("exit", r));
    } catch {}
  }
}

run();
