import React from "react";
import { LogOut, Menu, MessageCircle, Users, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { ConnectionStatus } from "../types";
import { getAvatarColor, getInitials } from "../utils/format";

export interface HeaderProps {
  onlineCount: number;
  connectionStatus: ConnectionStatus;
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onlineCount,
  connectionStatus,
  onToggleSidebar,
}) => {
  const { username, logout } = useAuth();
  const currentUsername = username || "Guest";

  const isConnected = connectionStatus === "connected";
  const isReconnecting = connectionStatus === "reconnecting" || connectionStatus === "connecting";

  return (
    <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
      {/* Brand logo & Chat name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Toggle user list"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-tight">ChatStream</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {onlineCount} {onlineCount === 1 ? "user" : "users"} online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right controls: Connection status, Online toggle button, User badge, Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Connection status badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isConnected
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              : isReconnecting
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-red-500/10 text-red-300 border-red-500/30"
          }`}
          title={`Status: ${connectionStatus}`}
        >
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="capitalize hidden sm:inline">{connectionStatus}</span>
        </div>

        {/* Toggle online users list button */}
        <button
          onClick={onToggleSidebar}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition-all cursor-pointer"
          title="Toggle online users list"
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Online</span>
          <span className="px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-[10px]">
            {onlineCount}
          </span>
        </button>

        {/* User profile capsule */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${getAvatarColor(
              currentUsername
            )}`}
          >
            {getInitials(currentUsername)}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-200 hidden md:inline truncate max-w-[120px]">
            {currentUsername}
          </span>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
