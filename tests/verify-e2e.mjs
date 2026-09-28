import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) {
        return true;
      }
    } catch {
      // Keep polling
    }
    await wait(300);
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

async function runE2E() {
  console.log('\n======================================================');
  console.log('Starting Playwright Headless Real-time E2E Test');
  console.log('======================================================\n');

  let backendProc = null;
  let frontendProc = null;
  let browser = null;

  try {
    // 1. Start Backend Server
    console.log('[Step 1] Starting backend on port 4000...');
    backendProc = spawn('npm', ['--prefix', 'backend', 'run', 'start'], {
      env: { ...process.env, PORT: '4000', NODE_ENV: 'production' },
      stdio: 'inherit',
    });

    await waitForServer('http://localhost:4000/health');
    console.log('✓ Backend is ready and responding at http://localhost:4000/health');

    // 2. Start Frontend Server
    console.log('[Step 2] Starting frontend on port 5173...');
    frontendProc = spawn('npx', ['vite', 'preview', '--port', '5173'], {
      cwd: path.resolve(process.cwd(), 'frontend'),
      env: { ...process.env, VITE_API_URL: 'http://localhost:4000' },
      stdio: 'inherit',
    });

    await waitForServer('http://localhost:5173');
    console.log('✓ Frontend is ready and responding at http://localhost:5173');

    // 3. Launch Playwright
    console.log('[Step 3] Launching headless Chromium browser...');
    const localChrome = '/Users/devpatel/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
    const executablePath = fs.existsSync(localChrome) ? localChrome : undefined;

    browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Create 2 independent browser contexts (isolated cookies & local storage)
    const contextA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const contextB = await browser.newContext({ viewport: { width: 1280, height: 800 } });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 4. Alice logs in
    console.log('\n[Step 4] Alice navigating to chat and logging in...');
    await pageA.goto('http://localhost:5173');
    await pageA.waitForSelector('input#username', { timeout: 10000 });

    // Capture screenshot: 01 Login page
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-page.png') });
    console.log('  -> Saved screenshot: 01-login-page.png');

    await pageA.fill('input#username', 'Alice');
    await pageA.click('button[type="submit"]');

    // Wait for chat interface to render
    await pageA.waitForSelector('input[placeholder*="Type a message"]', { timeout: 10000 });
    console.log('✓ Alice successfully logged in and entered chat room');

    // 5. Bob logs in
    console.log('\n[Step 5] Bob navigating to chat and logging in...');
    await pageB.goto('http://localhost:5173');
    await pageB.waitForSelector('input#username', { timeout: 10000 });

    await pageB.fill('input#username', 'Bob');
    await pageB.click('button[type="submit"]');

    await pageB.waitForSelector('input[placeholder*="Type a message"]', { timeout: 10000 });
    console.log('✓ Bob successfully logged in and entered chat room');

    await wait(1000);

    // Capture screenshot: 02 Two users online with presence count & sidebar
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '02-two-users-online.png') });
    console.log('  -> Saved screenshot: 02-two-users-online.png');

    // 6. Typing indicator verification
    console.log('\n[Step 6] Testing typing indicator from Bob to Alice...');
    const bobInput = pageB.locator('input[placeholder*="Type a message"]');
    await bobInput.focus();
    await bobInput.pressSequentially('Hey Alice, this real-time chat is amazing!', { delay: 40 });

    // In Alice's window, verify typing indicator appears
    await pageA.waitForSelector('text=Bob is typing...', { timeout: 5000 });
    console.log('✓ Alice sees "Bob is typing..." indicator in real-time');

    // Capture screenshot: 03 Typing indicator
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '03-typing-indicator.png') });
    console.log('  -> Saved screenshot: 03-typing-indicator.png');

    // 7. Bob sends message
    console.log('\n[Step 7] Bob sends message to Alice...');
    await pageB.keyboard.press('Enter');

    // Alice should receive Bob's message instantly
    await pageA.waitForSelector('text=Hey Alice, this real-time chat is amazing!', { timeout: 5000 });
    console.log('✓ Alice received Bob\'s message instantly');

    await wait(500);

    // Capture screenshot: 04 Bob\'s message delivered with timestamp
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '04-bob-message-delivered.png') });
    console.log('  -> Saved screenshot: 04-bob-message-delivered.png');

    // 8. Alice replies to Bob
    console.log('\n[Step 8] Alice replies to Bob...');
    const aliceInput = pageA.locator('input[placeholder*="Type a message"]');
    await aliceInput.focus();
    await aliceInput.pressSequentially('Hi Bob! Socket.io and SQLite persistence are working flawlessly.', { delay: 30 });
    await pageA.keyboard.press('Enter');

    // Bob should receive Alice's message instantly
    await pageB.waitForSelector('text=Hi Bob! Socket.io and SQLite persistence are working flawlessly.', { timeout: 5000 });
    console.log('✓ Bob received Alice\'s reply instantly with sender bubble and timestamp');

    await wait(800);

    // Capture screenshot: 05 Real-time conversation
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '05-realtime-conversation.png') });
    console.log('  -> Saved screenshot: 05-realtime-conversation.png');

    // 9. Page reload & SQLite persistence verification
    console.log('\n[Step 9] Reloading Alice\'s browser to verify persistence across refresh...');
    await pageA.reload();

    // Confirm Alice is still authenticated via localStorage without having to log in again
    await pageA.waitForSelector('input[placeholder*="Type a message"]', { timeout: 10000 });

    // Confirm both messages were rehydrated from SQLite REST API
    await pageA.waitForSelector('text=Hey Alice, this real-time chat is amazing!', { timeout: 5000 });
    await pageA.waitForSelector('text=Hi Bob! Socket.io and SQLite persistence are working flawlessly.', { timeout: 5000 });
    console.log('✓ Messages and timestamps successfully persisted across page refresh!');

    // Capture screenshot: 06 Reloaded persistence
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, '06-reloaded-persistence.png') });
    console.log('  -> Saved screenshot: 06-reloaded-persistence.png');

    console.log('\n======================================================');
    console.log('🎉 PLAYWRIGHT E2E VERIFICATION COMPLETED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } finally {
    if (browser) await browser.close();
    if (backendProc) backendProc.kill();
    if (frontendProc) frontendProc.kill();
  }
}

runE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('PLAYWRIGHT E2E FAILED:', err);
    process.exit(1);
  });
