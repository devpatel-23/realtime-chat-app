import React from 'react';
import { ToastContainer } from './components/ToastContainer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ChatPage } from './pages/ChatPage';
import { LoginPage } from './pages/LoginPage';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <ToastContainer />
      {isAuthenticated ? <ChatPage /> : <LoginPage />}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
