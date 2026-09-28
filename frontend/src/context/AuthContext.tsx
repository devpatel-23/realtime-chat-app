import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socket.service';

interface AuthContextType {
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'chat_username';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const login = (newUsername: string) => {
    const trimmed = newUsername.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setUsername(trimmed);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUsername(null);
    socketService.disconnect();
  };

  useEffect(() => {
    if (username) {
      socketService.connect(username);
    }
  }, [username]);

  return (
    <AuthContext.Provider
      value={{
        username,
        isAuthenticated: Boolean(username),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
