import { io } from "socket.io-client";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

async function runSocketVerification() {
  console.log(`\n=== Starting Socket.io Two-Client Verification on ${SERVER_URL} ===\n`);

  let client1, client2;
  let sentMessage = null;

  try {
    // 1. Connect Client 1 (Alice)
    console.log("1. Connecting Alice...");
    client1 = io(SERVER_URL, {
      auth: { username: "Alice" },
      transports: ["websocket"],
    });

    await new Promise((resolve, reject) => {
      client1.on("connect", resolve);
      client1.on("connect_error", reject);
    });
    console.log("✔ Alice connected successfully (id: %s)", client1.id);

    // 2. Connect Client 2 (Bob)
    console.log("\n2. Connecting Bob and verifying presence broadcast...");
    const presencePromise = new Promise((resolve) => {
      client1.on("presence:update", (data) => {
        if (data.users.includes("Alice") && data.users.includes("Bob")) {
          resolve(data);
        }
      });
    });

    client2 = io(SERVER_URL, {
      auth: { username: "Bob" },
      transports: ["websocket"],
    });

    await new Promise((resolve, reject) => {
      client2.on("connect", resolve);
      client2.on("connect_error", reject);
    });
    console.log("✔ Bob connected successfully (id: %s)", client2.id);

    const presence = await presencePromise;
    console.log("✔ Presence broadcast received by Alice:", presence);

    // 3. Test typing indicator from Alice to Bob
    console.log("\n3. Testing typing indicators (Alice -> Bob)...");
    const typingStartPromise = new Promise((resolve) => {
      client2.on("typing:start", (data) => {
        if (data.username === "Alice") resolve(data);
      });
    });

    client1.emit("typing:start");
    const typingStartData = await typingStartPromise;
    console.log("✔ Bob received typing:start:", typingStartData);

    const typingStopPromise = new Promise((resolve) => {
      client2.on("typing:stop", (data) => {
        if (data.username === "Alice") resolve(data);
      });
    });

    client1.emit("typing:stop");
    const typingStopData = await typingStopPromise;
    console.log("✔ Bob received typing:stop:", typingStopData);

    // 4. Test real-time message broadcast (Alice -> Bob)
    console.log("\n4. Testing message broadcast (Alice -> Bob)...");
    const messageReceivePromise = new Promise((resolve) => {
      client2.on("message:new", (msg) => {
        if (msg.username === "Alice") resolve(msg);
      });
    });

    client1.emit("message:new", { text: "Hello Bob! This is real-time Socket.io." });
    sentMessage = await messageReceivePromise;
    console.log("✔ Bob received message:new:", {
      id: sentMessage.id,
      username: sentMessage.username,
      text: sentMessage.text,
      status: sentMessage.status,
      createdAt: sentMessage.createdAt,
    });

    // 5. Test message:delivered receipt (Bob -> Alice)
    console.log("\n5. Testing message:delivered event...");
    const deliveredPromise = new Promise((resolve) => {
      client1.on("message:delivered", (data) => {
        if (data.ids && data.ids.includes(sentMessage.id)) resolve(data);
      });
    });

    client2.emit("message:delivered", { messageId: sentMessage.id });
    const deliveredData = await deliveredPromise;
    console.log("✔ Alice received message:delivered confirmation:", deliveredData);

    // 6. Test message:read receipt (Bob -> Alice)
    console.log("\n6. Testing message:read event...");
    const readPromise = new Promise((resolve) => {
      client1.on("message:read", (data) => {
        if (data.ids && data.ids.includes(sentMessage.id)) resolve(data);
      });
    });

    client2.emit("message:read", { messageId: sentMessage.id });
    const readData = await readPromise;
    console.log("✔ Alice received message:read confirmation:", readData);

    // 7. Test graceful disconnect and presence update
    console.log("\n7. Testing graceful disconnect (Bob leaves)...");
    const disconnectPresencePromise = new Promise((resolve) => {
      client1.on("presence:update", (data) => {
        if (!data.users.includes("Bob") && data.users.includes("Alice")) {
          resolve(data);
        }
      });
    });

    client2.disconnect();
    const presenceAfterLeave = await disconnectPresencePromise;
    console.log("✔ Alice received updated presence after Bob disconnected:", presenceAfterLeave);

    console.log("\n🎉 ALL Socket.io events verified successfully!\n");
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exitCode = 1;
  } finally {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
  }
}

runSocketVerification();
