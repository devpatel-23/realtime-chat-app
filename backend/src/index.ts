import { createServer } from "node:http";
import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { closeDatabase, getDatabase } from "./db/index.js";
import { initSocketServer } from "./sockets/index.js";

async function startServer() {
  try {
    // Initialize Database
    getDatabase();
    console.log(`[DB] SQLite database initialized at ${config.dbPath}`);

    // Create Express App & HTTP Server
    const app = createApp();
    const server = createServer(app);

    // Initialize Socket.io
    const io = initSocketServer(server, config.clientOrigin);
    app.set("io", io);
    console.log(`[Socket.io] Real-time engine attached`);

    // Start listening on process.env.PORT
    server.listen(config.port, "0.0.0.0", () => {
      console.log(`[Server] Chat backend listening on http://localhost:${config.port}`);
      console.log(`[Server] Allowed client origin: ${config.clientOrigin}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log("\n[Server] Shutting down gracefully...");
      server.close(() => {
        closeDatabase();
        console.log("[Server] Database closed and server terminated");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Server] Fatal error on startup:", error);
    process.exit(1);
  }
}

startServer();
