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
  const [hasMore, setHasMore] = useState<boolean>(true);
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
          if (history.length < 50) {
            setHasMore(false);
          }
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
          return prev.map((m) => (m.id === newMsg.id ? newMsg : m));
        }
        return [...prev, newMsg];
      });

      // Clear typing indicator for sender
      setTypingUsers((prev) => prev.filter((u) => u !== newMsg.username));

      // If the message is from someone else, notify delivery and read
      if (username && newMsg.username !== username) {
        socketService.markDelivered(newMsg.id);
        // Mark read immediately since user is on the chat view
        socketService.markRead(newMsg.id);
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
        if (socketService.getStatus() === 'connected') {
          await socketService.sendMessage(trimmed);
        } else {
          const fallbackMsg = await apiService.sendMessage(username, trimmed);
          setMessages((prev) => {
            if (prev.some((m) => m.id === fallbackMsg.id)) return prev;
            return [...prev, fallbackMsg];
          });
        }
      } catch (err: any) {
        // Fall back to REST if socket emission failed
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

  const loadMoreHistory = useCallback(async () => {
    if (messages.length === 0 || !hasMore || isLoading) return;
    const oldestTimestamp = messages[0].createdAt;

    try {
      const olderMessages = await apiService.getMessages(30, oldestTimestamp);
      if (olderMessages.length < 30) {
        setHasMore(false);
      }
      setMessages((prev) => [...olderMessages, ...prev]);
    } catch (err: any) {
      showToast(err.message || 'Failed to load older messages', 'error');
    }
  }, [messages, hasMore, isLoading, showToast]);

  return {
    messages,
    isLoading,
    hasMore,
    isSending,
    typingUsers,
    sendMessage,
    notifyTyping,
    stopTypingImmediate,
    loadMoreHistory,
  };
}
