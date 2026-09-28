import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { presenceService } from "../services/presence.service.js";
import { messageService } from "../services/message.service.js";
import { validateUsername, validateMessageText } from "../utils/sanitize.js";

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized");
  }
  return ioInstance;
}

export function broadcastMessage(message: any): void {
  if (ioInstance) {
    ioInstance.emit("message:new", message);
  }
}

export function initSocketServer(httpServer: HttpServer, clientOrigin: string): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:
        clientOrigin === "*"
          ? "*"
          : [clientOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  ioInstance = io;

  // Handshake authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const authUsername =
        socket.handshake.auth?.username ||
        socket.handshake.query?.username ||
        socket.handshake.headers["x-username"];

      if (!authUsername || typeof authUsername !== "string") {
        return next(new Error("Authentication failed: username is required in handshake"));
      }

      const validUsername = validateUsername(authUsername);
      socket.data.username = validUsername;
      next();
    } catch (err: any) {
      next(new Error(`Authentication failed: ${err.message || "invalid username"}`));
    }
  });

  io.on("connection", (socket: Socket) => {
    const username: string = socket.data.username;

    // Register presence (multi-tab safe)
    const { isFirstConnection, onlineUsers } = presenceService.addConnection(username, socket.id);

    // Broadcast presence to all clients
    io.emit("presence:update", {
      users: onlineUsers,
      count: onlineUsers.length,
    });

    // Send initial list of currently typing users (excluding self)
    const currentlyTyping = presenceService.getTypingUsers().filter((u) => u !== username);
    if (currentlyTyping.length > 0) {
      socket.emit("typing:initial", { typingUsers: currentlyTyping });
    }

    // Helper to safely wrap event handlers and emit 'error' to socket
    const handleSafe = (handler: (...args: any[]) => Promise<void> | void) => {
      return async (...args: any[]) => {
        try {
          await handler(...args);
        } catch (err: any) {
          console.error(`Socket error for user ${username}:`, err);
          socket.emit("error", {
            message: err.message || "An unexpected socket error occurred",
          });
        }
      };
    };

    // 1. message:new
    socket.on(
      "message:new",
      handleSafe(async (data: { text: string; id?: string }, ack?: (res: any) => void) => {
        if (!data || typeof data.text !== "string") {
          socket.emit("error", { message: "Invalid message payload" });
          if (typeof ack === "function") ack({ success: false, error: "Invalid message payload" });
          return;
        }

        const validText = validateMessageText(data.text);
        const createdMessage = messageService.createMessage(username, validText, data.id);

        // Broadcast to ALL connected clients (including sender)
        io.emit("message:new", createdMessage);

        if (typeof ack === "function") {
          ack({ success: true, data: createdMessage });
        }
      })
    );

    // 2. typing:start
    socket.on(
      "typing:start",
      handleSafe(() => {
        const becameTyping = presenceService.startTyping(username, socket.id);
        if (becameTyping) {
          socket.broadcast.emit("typing:start", { username });
        }
      })
    );

    // 3. typing:stop
    socket.on(
      "typing:stop",
      handleSafe(() => {
        const stopped = presenceService.stopTyping(username, socket.id);
        if (stopped) {
          socket.broadcast.emit("typing:stop", { username });
        }
      })
    );

    // 4. message:delivered
    socket.on(
      "message:delivered",
      handleSafe(async (data: { messageId?: string; messageIds?: string[] }) => {
        const ids: string[] = [];
        if (data?.messageId) ids.push(data.messageId);
        if (Array.isArray(data?.messageIds)) ids.push(...data.messageIds);

        if (ids.length === 0) return;

        messageService.markDelivered(ids);
        io.emit("message:delivered", { messageId: ids[0], ids, status: "delivered" });
      })
    );

    // 5. message:read
    socket.on(
      "message:read",
      handleSafe(async (data: { messageId?: string; messageIds?: string[] }) => {
        const ids: string[] = [];
        if (data?.messageId) ids.push(data.messageId);
        if (Array.isArray(data?.messageIds)) ids.push(...data.messageIds);

        if (ids.length === 0) return;

        messageService.markRead(ids);
        io.emit("message:read", { messageId: ids[0], ids, status: "read" });
      })
    );

    // Disconnect
    socket.on("disconnect", () => {
      try {
        const { isLastConnection, onlineUsers, stoppedTyping } = presenceService.removeConnection(
          socket.id
        );

        if (stoppedTyping) {
          socket.broadcast.emit("typing:stop", { username });
        }

        if (isLastConnection) {
          io.emit("presence:update", {
            users: onlineUsers,
            count: onlineUsers.length,
          });
        }
      } catch (err) {
        console.error(`Error handling disconnect for ${username}:`, err);
      }
    });
  });

  return io;
}
