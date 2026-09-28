export type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  username: string;
  text: string;
  createdAt: string;
  status: MessageStatus;
}

export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected";

export interface PresenceData {
  users: string[];
  count: number;
}

export interface ToastMessage {
  id: string;
  type: "error" | "warning" | "info" | "success";
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string | null;
}
