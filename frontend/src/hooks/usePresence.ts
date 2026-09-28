import { useEffect, useState } from "react";
import { apiService } from "../services/api.service";
import { socketService } from "../services/socket.service";

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    // Fetch initial list via REST
    apiService
      .getOnlineUsers()
      .then((data) => {
        if (mounted && data?.users) {
          setOnlineUsers(data.users);
          setOnlineCount(data.count ?? data.users.length);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch initial online users:", err);
      });

    // Real-time updates via Socket.io
    const unsub = socketService.onPresence((presence) => {
      if (mounted) {
        setOnlineUsers(presence.users);
        setOnlineCount(presence.count ?? presence.users.length);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return {
    onlineUsers,
    onlineCount,
  };
}
