import React, { useEffect, useRef, useState, UIEvent } from "react";
import { ArrowDown, MessageSquareDashed } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Message } from "../types";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  hasMore = false,
  onLoadMore,
}) => {
  const { username: currentUser } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isNearBottomRef = useRef(true);

  // Auto-scroll on new message if user is near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    const isNear = distanceFromBottom < 120;
    isNearBottomRef.current = isNear;
    setShowScrollBottom(!isNear);

    // If user scrolled to very top and there's more history, trigger load older
    if (target.scrollTop === 0 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBottom(false);
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto justify-end">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} animate-pulse`}
          >
            <div
              className={`h-12 rounded-2xl bg-slate-800 ${
                i % 2 === 0 ? "w-48 sm:w-64" : "w-56 sm:w-72"
              }`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
          <MessageSquareDashed className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No messages yet</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Say hello and start the conversation! Messages are delivered in real-time.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative scroll-smooth"
    >
      {hasMore && onLoadMore && (
        <div className="flex justify-center mb-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800/70 border border-slate-700 px-3 py-1 rounded-full transition-all cursor-pointer"
          >
            {isLoading ? "Loading older messages..." : "Load older messages"}
          </button>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.username === currentUser}
        />
      ))}

      <div ref={bottomRef} />

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-20 right-6 sm:right-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-2.5 shadow-xl transition-all animate-bounce flex items-center gap-1.5 text-xs font-semibold cursor-pointer z-10"
          aria-label="Scroll to newest messages"
        >
          <ArrowDown className="w-4 h-4" />
          <span className="hidden sm:inline">New messages</span>
        </button>
      )}
    </div>
  );
};
