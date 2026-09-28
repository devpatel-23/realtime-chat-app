import React, { useState } from 'react';
import { ArrowRight, MessageSquare, ShieldCheck, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/api.service';

export const LoginPage: React.FC = () => {
  const [usernameInput, setUsernameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const trimmed = usernameInput.trim();

    if (!trimmed) {
      setFieldError('Please enter a username');
      return;
    }

    if (trimmed.length < 2) {
      setFieldError('Username must be at least 2 characters');
      return;
    }

    if (trimmed.length > 30) {
      setFieldError('Username must be 30 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9_\-\s]+$/.test(trimmed)) {
      setFieldError('Username contains invalid characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate with backend dummy login endpoint
      const result = await apiService.login(trimmed);
      login(result.username);
      showToast(`Welcome back, ${result.username}!`, 'success');
    } catch (err: any) {
      setFieldError(err.message || 'Failed to login. Please try again.');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (name: string) => {
    setUsernameInput(name);
    setFieldError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-4">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome to ChatStream</h2>
            <p className="text-sm text-slate-400 mt-1">Real-time collaborative messaging</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2"
              >
                Choose a Username
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="username"
                  type="text"
                  autoFocus
                  disabled={isSubmitting}
                  placeholder="e.g. Alice, Bob, Charlie..."
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                  className={`w-full bg-slate-950 border rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                    fieldError
                      ? 'border-red-500/80 focus:ring-red-500/30'
                      : 'border-slate-800 focus:border-indigo-500/80 focus:ring-indigo-500/30'
                  }`}
                />
              </div>

              {fieldError && (
                <p className="text-xs text-red-400 mt-1.5 font-medium">{fieldError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Join Chat Room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Select Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] uppercase font-semibold text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick Test Accounts</span>
            </p>
            <div className="flex gap-2">
              {['Alice', 'Bob', 'Charlie'].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleQuickLogin(name)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700/60 transition text-center"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>No password required • Real-time Socket.io session</span>
          </div>
        </div>
      </div>
    </div>
  );
};
