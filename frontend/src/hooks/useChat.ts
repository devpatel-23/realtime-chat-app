import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/api.service';
import { socketService } from '../services/socket.service';
import type { Message, MessageStatus } from '../types';

export function useChat() {
  const { username } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // Load message history on startup
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    apiService
      .getMessages(50)
      .then((history) => {
        if (mounted) {
          setMessages(history);
          setIsLoading(false);

          // Mark incoming unread messages as read
          if (username) {
            history.forEach((msg) => {
              if (msg.username !== username && msg.status !== 'read') {
                socketService.markRead(msg.id);
              }
            });
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          setIsLoading(false);
          showToast(err.message || 'Failed to load message history', 'error');
        }
      });

    return () => {
      mounted = false;
    };
  }, [username, showToast]);

  // Socket event subscriptions
  useEffect(() => {
    // 1. Listen for new messages
    const unsubMsg = socketService.onMessage((newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });

      // If the message is from someone else, notify delivery and read
      if (username && newMsg.username !== username) {
        socketService.markDelivered(newMsg.id);
        // If tab is active, mark read immediately
        if (!document.hidden) {
          socketService.markRead(newMsg.id);
        }
      }
    });

    // 2. Listen for delivery status updates
    const unsubDelivered = socketService.onDelivered((data) => {
      const targetIds = new Set(data.ids || (data.messageId ? [data.messageId] : []));
      setMessages((prev) =>
        prev.map((msg) => {
          if (targetIds.has(msg.id) && msg.status === 'sent') {
            return { ...msg, status: 'delivered' as MessageStatus };
          }
          return msg;
        })
      );
    });

    // 3. Listen for read status updates
    const unsubRead = socketService.onRead((data) => {
      const targetIds = new Set(data.ids || (data.messageId ? [data.messageId] : []));
      setMessages((prev) =>
        prev.map((msg) => {
          if (targetIds.has(msg.id)) {
            return { ...msg, status: 'read' as MessageStatus };
          }
          return msg;
        })
      );
    });

    // 4. Typing indicators
    const unsubTypingStart = socketService.onTypingStart(({ username: typer }) => {
      if (typer !== username) {
        setTypingUsers((prev) => (prev.includes(typer) ? prev : [...prev, typer]));
      }
    });

    const unsubTypingStop = socketService.onTypingStop(({ username: typer }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== typer));
    });

    return () => {
      unsubMsg();
      unsubDelivered();
      unsubRead();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [username]);

  // Handle typing debounce
  const notifyTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.startTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketService.stopTyping();
    }, 2000);
  }, []);

  const stopTypingImmediate = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.stopTyping();
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !username) return;

      stopTypingImmediate();
      setIsSending(true);

      try {
        // Try socket emission first for instant bidirectional responsiveness
        await socketService.sendMessage(trimmed);
      } catch (err: any) {
        // Fall back to REST if socket failed
        try {
          const fallbackMsg = await apiService.sendMessage(username, trimmed);
          setMessages((prev) => {
            if (prev.some((m) => m.id === fallbackMsg.id)) return prev;
            return [...prev, fallbackMsg];
          });
        } catch (restErr: any) {
          showToast(restErr.message || 'Failed to send message', 'error');
        }
      } finally {
        setIsSending(false);
      }
    },
    [username, stopTypingImmediate, showToast]
  );

  return {
    messages,
    isLoading,
    isSending,
    typingUsers,
    sendMessage,
    notifyTyping,
    stopTypingImmediate,
  };
}
