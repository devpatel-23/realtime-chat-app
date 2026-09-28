import React, { useState } from 'react';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { Header } from '../components/Header';
import { MessageInput } from '../components/MessageInput';
import { MessageList } from '../components/MessageList';
import { Sidebar } from '../components/Sidebar';
import { TypingIndicator } from '../components/TypingIndicator';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { usePresence } from '../hooks/usePresence';
import { useSocket } from '../hooks/useSocket';

export const ChatPage: React.FC = () => {
  const { username } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hook 1: Socket lifecycle and connection status banner
  const { status: connectionStatus, reconnect } = useSocket();

  // Hook 2: Presence tracking
  const { onlineUsers, onlineCount } = usePresence();

  // Hook 3: Real-time & persistent chat
  const {
    messages,
    isLoading,
    isSending,
    typingUsers,
    sendMessage,
    notifyTyping,
  } = useChat();

  if (!username) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Main chat interface */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header with status and count */}
        <Header
          onlineCount={onlineCount}
          connectionStatus={connectionStatus}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Offline / Reconnecting Banner */}
        <ConnectionBanner status={connectionStatus} onReconnect={reconnect} />

        {/* Message history & bubbles */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
        />

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Message Input bar */}
        <MessageInput
          onSendMessage={sendMessage}
          onTyping={notifyTyping}
          isSending={isSending}
          disabled={connectionStatus === 'disconnected'}
        />
      </div>

      {/* Responsive online users sidebar */}
      <Sidebar
        onlineUsers={onlineUsers}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
};
