import React, { useState } from 'react';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { Header } from '../components/Header';
import { MessageInput } from '../components/MessageInput';
import { MessageList } from '../components/MessageList';
import { Sidebar } from '../components/Sidebar';
import { TypingIndicator } from '../components/TypingIndicator';
import { useChat } from '../hooks/useChat';
import { usePresence } from '../hooks/usePresence';
import { useSocket } from '../hooks/useSocket';

export const ChatPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Consolidated custom hooks separating business logic from UI
  const { status, reconnect, isDisconnected } = useSocket();
  const { onlineUsers, onlineCount } = usePresence();
  const {
    messages,
    isLoading,
    isSending,
    typingUsers,
    sendMessage,
    notifyTyping,
  } = useChat();

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Application Header */}
      <Header
        onlineCount={onlineCount}
        connectionStatus={status}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Degradation / Reconnection Status Banner */}
      <ConnectionBanner status={status} onReconnect={reconnect} />

      {/* Main Content Area: Sidebar + Chat Stream */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Online Members Sidebar */}
        <Sidebar
          onlineUsers={onlineUsers}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Chat Conversation Area */}
        <main className="flex-1 flex flex-col bg-slate-950/60 overflow-hidden relative">
          {/* Scrollable Message List */}
          <MessageList messages={messages} isLoading={isLoading} />

          {/* Typing Indicator */}
          <TypingIndicator typingUsers={typingUsers} />

          {/* Message Input Box */}
          <MessageInput
            onSendMessage={sendMessage}
            onTyping={notifyTyping}
            isSending={isSending}
            disabled={isDisconnected}
          />
        </main>
      </div>
    </div>
  );
};
