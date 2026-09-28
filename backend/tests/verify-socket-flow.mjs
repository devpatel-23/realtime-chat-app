import { io } from 'socket.io-client';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

console.log(`\n======================================================`);
console.log(`Starting Socket.io Multi-Client Verification Test`);
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`======================================================\n`);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVerification() {
  let aliceSocket = null;
  let bobSocket = null;

  try {
    // 1. Connect Alice
    console.log('[Step 1] Connecting Alice with handshake authentication...');
    aliceSocket = io(BACKEND_URL, {
      auth: { username: 'Alice' },
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      aliceSocket.on('connect', () => {
        console.log('✓ Alice connected successfully with socket id:', aliceSocket.id);
        resolve();
      });
      aliceSocket.on('connect_error', (err) => reject(new Error('Alice connection failed: ' + err.message)));
    });

    // 2. Connect Bob and verify presence broadcast
    console.log('\n[Step 2] Connecting Bob and testing presence broadcast...');
    let aliceReceivedBobPresence = false;
    let bobReceivedPresence = false;

    aliceSocket.on('presence:update', (data) => {
      console.log(`  -> Alice received presence:update:`, data.users);
      if (data.users.includes('Alice') && data.users.includes('Bob')) {
        aliceReceivedBobPresence = true;
      }
    });

    bobSocket = io(BACKEND_URL, {
      auth: { username: 'Bob' },
      transports: ['websocket'],
    });

    bobSocket.on('presence:update', (data) => {
      console.log(`  -> Bob received presence:update:`, data.users);
      if (data.users.includes('Alice') && data.users.includes('Bob')) {
        bobReceivedPresence = true;
      }
    });

    await new Promise((resolve, reject) => {
      bobSocket.on('connect', () => {
        console.log('✓ Bob connected successfully with socket id:', bobSocket.id);
        resolve();
      });
      bobSocket.on('connect_error', (err) => reject(new Error('Bob connection failed: ' + err.message)));
    });

    await wait(600);
    if (!aliceReceivedBobPresence || !bobReceivedPresence) {
      throw new Error(`Presence verification failed. Alice: ${aliceReceivedBobPresence}, Bob: ${bobReceivedPresence}`);
    }
    console.log('✓ Presence verification PASSED: Both clients see Alice and Bob online.');

    // 3. Test typing indicator
    console.log('\n[Step 3] Testing typing:start and typing:stop events...');
    let bobReceivedTypingStart = false;
    let bobReceivedTypingStop = false;

    bobSocket.on('typing:start', (data) => {
      console.log('  -> Bob received typing:start from:', data.username);
      if (data.username === 'Alice') {
        bobReceivedTypingStart = true;
      }
    });

    bobSocket.on('typing:stop', (data) => {
      console.log('  -> Bob received typing:stop from:', data.username);
      if (data.username === 'Alice') {
        bobReceivedTypingStop = true;
      }
    });

    aliceSocket.emit('typing:start');
    await wait(400);

    aliceSocket.emit('typing:stop');
    await wait(400);

    if (!bobReceivedTypingStart || !bobReceivedTypingStop) {
      throw new Error(`Typing verification failed. Start: ${bobReceivedTypingStart}, Stop: ${bobReceivedTypingStop}`);
    }
    console.log('✓ Typing verification PASSED: Bob successfully received Alice typing:start and typing:stop.');

    // 4. Test real-time message broadcast
    console.log('\n[Step 4] Testing real-time message:new broadcast...');
    let aliceReceivedMessage = null;
    let bobReceivedMessage = null;

    aliceSocket.on('message:new', (msg) => {
      console.log('  -> Alice received message:new:', msg.id, msg.username, msg.text);
      aliceReceivedMessage = msg;
    });

    bobSocket.on('message:new', (msg) => {
      console.log('  -> Bob received message:new:', msg.id, msg.username, msg.text);
      bobReceivedMessage = msg;
    });

    const testMessageText = 'Hello Alice, real-time Socket.io is functional!';
    bobSocket.emit('message:new', { text: testMessageText });

    await wait(600);

    if (!aliceReceivedMessage || !bobReceivedMessage) {
      throw new Error('Message broadcast failed: one or both clients did not receive message:new');
    }
    if (aliceReceivedMessage.text !== testMessageText || aliceReceivedMessage.username !== 'Bob') {
      throw new Error('Message content mismatch');
    }
    console.log('✓ Message broadcast PASSED: Both sender and receiver received the message.');

    // 5. Test message:delivered status
    console.log('\n[Step 5] Testing message:delivered status update...');
    let bobReceivedDelivered = false;

    bobSocket.on('message:delivered', (data) => {
      console.log('  -> Bob received message:delivered:', data);
      if (data.messageId === aliceReceivedMessage.id || data.ids?.includes(aliceReceivedMessage.id)) {
        bobReceivedDelivered = true;
      }
    });

    aliceSocket.emit('message:delivered', { messageId: aliceReceivedMessage.id });
    await wait(400);

    if (!bobReceivedDelivered) {
      throw new Error('Delivered status update failed: Bob did not receive message:delivered');
    }
    console.log('✓ Delivered status PASSED: Sender received delivered tick.');

    // 6. Test message:read status
    console.log('\n[Step 6] Testing message:read status update...');
    let bobReceivedRead = false;

    bobSocket.on('message:read', (data) => {
      console.log('  -> Bob received message:read:', data);
      if (data.messageId === aliceReceivedMessage.id || data.ids?.includes(aliceReceivedMessage.id)) {
        bobReceivedRead = true;
      }
    });

    aliceSocket.emit('message:read', { messageId: aliceReceivedMessage.id });
    await wait(400);

    if (!bobReceivedRead) {
      throw new Error('Read status update failed: Bob did not receive message:read');
    }
    console.log('✓ Read status PASSED: Sender received read tick.');

    // 7. Test disconnect and presence update
    console.log('\n[Step 7] Testing graceful disconnect and presence cleanup...');
    let aliceSawBobDisconnect = false;

    aliceSocket.on('presence:update', (data) => {
      console.log('  -> Alice received updated presence:', data.users);
      if (!data.users.includes('Bob') && data.users.includes('Alice')) {
        aliceSawBobDisconnect = true;
      }
    });

    bobSocket.disconnect();
    await wait(600);

    if (!aliceSawBobDisconnect) {
      throw new Error('Disconnect presence update failed: Alice still sees Bob online');
    }
    console.log('✓ Disconnect presence PASSED: Bob removed from active users.');

    console.log('\n======================================================');
    console.log('🎉 ALL SOCKET.IO FLOWS SUCCESSFULLY VERIFIED!');
    console.log('======================================================\n');
  } finally {
    if (aliceSocket) aliceSocket.disconnect();
    if (bobSocket) bobSocket.disconnect();
  }
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
  });
