export class PresenceService {
  private userSockets: Map<string, Set<string>> = new Map();
  private socketToUser: Map<string, string> = new Map();
  private typingSockets: Map<string, Set<string>> = new Map();

  /**
   * Registers a socket connection for a username.
   * Multi-tab safe: tracks connection count per username.
   */
  public addConnection(username: string, socketId: string): { isFirstConnection: boolean; onlineUsers: string[] } {
    this.socketToUser.set(socketId, username);

    let sockets = this.userSockets.get(username);
    let isFirstConnection = false;

    if (!sockets) {
      sockets = new Set();
      this.userSockets.set(username, sockets);
      isFirstConnection = true;
    }

    sockets.add(socketId);

    return {
      isFirstConnection,
      onlineUsers: this.getOnlineUsers()
    };
  }

  /**
   * Removes a socket connection.
   */
  public removeConnection(socketId: string): {
    username: string | null;
    isLastConnection: boolean;
    onlineUsers: string[];
    stoppedTyping: boolean;
  } {
    const username = this.socketToUser.get(socketId);
    if (!username) {
      return {
        username: null,
        isLastConnection: false,
        onlineUsers: this.getOnlineUsers(),
        stoppedTyping: false
      };
    }

    this.socketToUser.delete(socketId);

    // Clean up typing
    const stoppedTyping = this.stopTyping(username, socketId);

    const sockets = this.userSockets.get(username);
    let isLastConnection = false;

    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(username);
        this.typingSockets.delete(username);
        isLastConnection = true;
      }
    }

    return {
      username,
      isLastConnection,
      onlineUsers: this.getOnlineUsers(),
      stoppedTyping
    };
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys()).sort();
  }

  public isOnline(username: string): boolean {
    const sockets = this.userSockets.get(username);
    return Boolean(sockets && sockets.size > 0);
  }

  public getUserForSocket(socketId: string): string | null {
    return this.socketToUser.get(socketId) || null;
  }

  public startTyping(username: string, socketId: string): boolean {
    let sockets = this.typingSockets.get(username);
    let becameTyping = false;

    if (!sockets) {
      sockets = new Set();
      this.typingSockets.set(username, sockets);
      becameTyping = true;
    }

    sockets.add(socketId);
    return becameTyping;
  }

  public stopTyping(username: string, socketId: string): boolean {
    const sockets = this.typingSockets.get(username);
    if (!sockets) return false;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.typingSockets.delete(username);
      return true; // No longer typing anywhere
    }
    return false;
  }

  public getTypingUsers(): string[] {
    return Array.from(this.typingSockets.keys()).sort();
  }

  public clear(): void {
    this.userSockets.clear();
    this.socketToUser.clear();
    this.typingSockets.clear();
  }
}

export const presenceService = new PresenceService();
