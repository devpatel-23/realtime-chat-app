import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '../types';
import { formatTimestamp, getAvatarColor, getInitials } from '../utils/format';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const time = formatTimestamp(message.createdAt);

  return (
    <div className={`flex w-full my-2 group ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar for other users */}
        {!isOwn && (
          <div
            className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] mb-1 shadow-sm ${getAvatarColor(
              message.username
            )}`}
            title={message.username}
          >
            {getInitials(message.username)}
          </div>
        )}

        {/* Bubble container */}
        <div
          className={`flex flex-col rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-150 ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-br-xs'
              : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/50'
          }`}
        >
          {/* Sender username for other users */}
          {!isOwn && (
            <span className="text-[11px] font-semibold text-indigo-300 mb-1 leading-none">
              {message.username}
            </span>
          )}

          {/* Message Text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words select-text">
            {message.text}
          </p>

          {/* Footer: Timestamp and status tick marks */}
          <div
            className={`flex items-center gap-1.5 mt-1 select-none ${
              isOwn ? 'justify-end text-indigo-200/80' : 'justify-end text-slate-400'
            }`}
          >
            <span className="text-[10px] tabular-nums font-medium tracking-tight">
              {time || 'Just now'}
            </span>

            {/* Status indicators for own messages */}
            {isOwn && (
              <span className="inline-flex items-center ml-0.5" title={`Status: ${message.status}`}>
                {message.status === 'sent' && (
                  <Check className="w-3.5 h-3.5 text-indigo-200/70" />
                )}
                {message.status === 'delivered' && (
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-200/90" />
                )}
                {message.status === 'read' && (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-300 drop-shadow-sm" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
