import React, { useState } from 'react';
import { Search, UserCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarColor, getInitials } from '../utils/format';

interface SidebarProps {
  onlineUsers: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onlineUsers, isOpen, onClose }) => {
  const { username: currentUser } = useAuth();
  const [search, setSearch] = useState('');

  const filteredUsers = onlineUsers.filter((u) =>
    u.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 w-72 bg-slate-900/95 border-r border-slate-800/80 flex flex-col z-40 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-sm text-slate-200 tracking-wide uppercase">
              Online Members ({onlineUsers.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No members match "{search}"
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelf = user === currentUser;
              return (
                <div
                  key={user}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${
                    isSelf ? 'bg-indigo-950/40 border border-indigo-900/30' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${getAvatarColor(
                        user
                      )}`}
                    >
                      {getInitials(user)}
                    </div>
                    {/* Active online status indicator */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-200 truncate">{user}</p>
                      {isSelf && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active now
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
