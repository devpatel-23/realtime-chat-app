import { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";
import { socketService } from "../services/socket.service";
import type { ConnectionStatus } from "../types";

export function useSocket() {
  const [status, setStatus] = useState<ConnectionStatus>(socketService.getStatus());
  const { showToast } = useToast();

  useEffect(() => {
    const unsubStatus = socketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubError = socketService.onError((err) => {
      showToast(err.message, "error");
    });

    return () => {
      unsubStatus();
      unsubError();
    };
  }, [showToast]);

  const reconnect = () => {
    socketService.reconnect();
  };

  return {
    status,
    isConnected: status === "connected",
    isReconnecting: status === "reconnecting",
    isDisconnected: status === "disconnected",
    reconnect,
  };
}
