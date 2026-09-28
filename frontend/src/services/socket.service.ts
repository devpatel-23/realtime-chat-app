import { io, Socket } from "socket.io-client";
import type { ConnectionStatus, Message, PresenceData } from "../types";

const SOCKET_SERVER_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(
  /\/+$/,
  ""
);

type StatusChangeCallback = (status: ConnectionStatus) => void;
type ErrorCallback = (error: { message: string }) => void;
type MessageCallback = (message: Message) => void;
type PresenceCallback = (presence: PresenceData) => void;
type TypingCallback = (data: { username: string }) => void;
type StatusUpdateCallback = (data: {
  messageId?: string;
  ids?: string[];
  status: "delivered" | "read";
}) => void;

class SocketService {
  private socket: Socket | null = null;
  private currentUsername: string | null = null;
  private connectionStatus: ConnectionStatus = "disconnected";

  private statusChangeCallbacks: Set<StatusChangeCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private messageCallbacks: Set<MessageCallback> = new Set();
  private presenceCallbacks: Set<PresenceCallback> = new Set();
  private typingStartCallbacks: Set<TypingCallback> = new Set();
  private typingStopCallbacks: Set<TypingCallback> = new Set();
  private deliveredCallbacks: Set<StatusUpdateCallback> = new Set();
  private readCallbacks: Set<StatusUpdateCallback> = new Set();

  public connect(username: string): void {
    if (this.socket && this.currentUsername === username && this.socket.connected) {
      return;
    }

    if (this.socket) {
      this.disconnect();
    }

    this.currentUsername = username;
    this.setStatus("connecting");

    this.socket = io(SOCKET_SERVER_URL, {
      auth: { username },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      this.setStatus("connected");
    });

    this.socket.on("disconnect", (reason) => {
      if (reason === "io client disconnect") {
        this.setStatus("disconnected");
      } else {
        this.setStatus("reconnecting");
      }
    });

    this.socket.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
      this.setStatus("reconnecting");
      this.notifyErrors({ message: err.message || "Connection to chat server failed" });
    });

    this.socket.on("error", (err: { message: string }) => {
      this.notifyErrors(err);
    });

    this.socket.on("presence:update", (data: PresenceData) => {
      this.presenceCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on("message:new", (message: Message) => {
      this.messageCallbacks.forEach((cb) => cb(message));
    });

    this.socket.on("typing:start", (data: { username: string }) => {
      this.typingStartCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on("typing:stop", (data: { username: string }) => {
      this.typingStopCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on(
      "message:delivered",
      (data: { messageId?: string; ids?: string[]; status: "delivered" }) => {
        this.deliveredCallbacks.forEach((cb) => cb(data));
      }
    );

    this.socket.on(
      "message:read",
      (data: { messageId?: string; ids?: string[]; status: "read" }) => {
        this.readCallbacks.forEach((cb) => cb(data));
      }
    );
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUsername = null;
    this.setStatus("disconnected");
  }

  public reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    } else if (this.currentUsername) {
      this.connect(this.currentUsername);
    }
  }

  public sendMessage(text: string): Promise<Message> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error("Socket is not connected"));
        return;
      }

      this.socket.emit("message:new", { text }, (response: any) => {
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || "Failed to send message via socket"));
        }
      });
    });
  }

  public startTyping(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("typing:start");
    }
  }

  public stopTyping(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("typing:stop");
    }
  }

  public markDelivered(messageId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("message:delivered", { messageId });
    }
  }

  public markRead(messageId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("message:read", { messageId });
    }
  }

  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusChangeCallbacks.forEach((cb) => cb(status));
  }

  private notifyErrors(error: { message: string }): void {
    this.errorCallbacks.forEach((cb) => cb(error));
  }

  // Listener subscriptions
  public onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusChangeCallbacks.add(callback);
    callback(this.connectionStatus);
    return () => this.statusChangeCallbacks.delete(callback);
  }

  public onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  public onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  public onPresence(callback: PresenceCallback): () => void {
    this.presenceCallbacks.add(callback);
    return () => this.presenceCallbacks.delete(callback);
  }

  public onTypingStart(callback: TypingCallback): () => void {
    this.typingStartCallbacks.add(callback);
    return () => this.typingStartCallbacks.delete(callback);
  }

  public onTypingStop(callback: TypingCallback): () => void {
    this.typingStopCallbacks.add(callback);
    return () => this.typingStopCallbacks.delete(callback);
  }

  public onDelivered(callback: StatusUpdateCallback): () => void {
    this.deliveredCallbacks.add(callback);
    return () => this.deliveredCallbacks.delete(callback);
  }

  public onRead(callback: StatusUpdateCallback): () => void {
    this.readCallbacks.add(callback);
    return () => this.readCallbacks.delete(callback);
  }
}

export const socketService = new SocketService();
