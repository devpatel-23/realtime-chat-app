import React from "react";

interface TypingIndicatorProps {
  typingUsers: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
        : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400 animate-fade-in">
      <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
        <span className="ml-1 text-[11px] font-medium text-slate-300">{text}</span>
      </div>
    </div>
  );
};
