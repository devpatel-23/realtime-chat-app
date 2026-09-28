import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '../types';

interface ConnectionBannerProps {
  status: ConnectionStatus;
  onReconnect: () => void;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({ status, onReconnect }) => {
  if (status === 'connected') return null;

  const isReconnecting = status === 'reconnecting' || status === 'connecting';

  return (
    <div
      role="alert"
      className={`w-full px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-medium transition-colors ${
        isReconnecting
          ? 'bg-amber-500/15 border-b border-amber-500/30 text-amber-300'
          : 'bg-red-500/15 border-b border-red-500/30 text-red-300'
      }`}
    >
      <div className="flex items-center gap-2">
        {isReconnecting ? (
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <span>
          {isReconnecting
            ? 'Connection lost. Auto-reconnecting to chat server...'
            : 'Disconnected from server. Check your network connection.'}
        </span>
      </div>

      <button
        onClick={onReconnect}
        className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-white font-medium border border-slate-700 text-xs transition"
      >
        Reconnect Now
      </button>
    </div>
  );
};
