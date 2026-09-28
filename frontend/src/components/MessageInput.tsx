import React, { useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTyping: () => void;
  isSending: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  isSending,
  disabled,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;

    onSendMessage(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-slate-900/95 border-t border-slate-800/80 flex items-center gap-2 backdrop-blur-md shrink-0"
    >
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={1000}
          disabled={disabled}
          placeholder="Type a message... (Press Enter to send)"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {text.length > 800 && (
          <span
            className={`absolute right-3 bottom-2 text-[10px] font-mono ${
              text.length >= 1000 ? 'text-red-400 font-bold' : 'text-slate-400'
            }`}
          >
            {1000 - text.length}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!text.trim() || isSending || disabled}
        className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all cursor-pointer"
        aria-label="Send message"
      >
        <SendHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline text-xs font-semibold">Send</span>
      </button>
    </form>
  );
};
