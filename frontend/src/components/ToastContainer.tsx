import React from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-xl backdrop-blur-md border transition-all animate-slide-in ${
            toast.type === "error"
              ? "bg-red-950/85 text-red-200 border-red-800/60"
              : toast.type === "success"
                ? "bg-emerald-950/85 text-emerald-200 border-emerald-800/60"
                : "bg-slate-900/90 text-slate-200 border-slate-700/60"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-blue-400" />}
          </div>
          <p className="text-sm font-medium flex-1 break-words leading-snug">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 rounded-md transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
