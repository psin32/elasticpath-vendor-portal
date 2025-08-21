"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import Toast from "../components/ui/Toast";

interface ToastMessage {
  id: string;
  message: string;
  type: "error" | "success" | "info" | "warning";
  duration?: number;
  timestamp: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    type: "error" | "success" | "info" | "warning",
    duration?: number
  ) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show/hide toast container based on whether there are toasts
  useEffect(() => {
    if (toasts.length > 0 && !isVisible) {
      setIsVisible(true);
    } else if (toasts.length === 0 && isVisible) {
      // Delay hiding to allow exit animations to complete
      timeoutRef.current = setTimeout(() => setIsVisible(false), 300);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toasts.length, isVisible]);

  const showToast = useCallback(
    (
      message: string,
      type: "error" | "success" | "info" | "warning",
      duration = 5000
    ) => {
      // Don't show empty messages
      if (!message.trim()) return;

      const id = Math.random().toString(36).substr(2, 9);
      const newToast: ToastMessage = {
        id,
        message: message.trim(),
        type,
        duration,
        timestamp: Date.now(),
      };

      setToasts((prev) => {
        // Limit to maximum 5 toasts to prevent overflow
        const limitedToasts = prev.slice(-4);
        return [...limitedToasts, newToast];
      });

      // Auto-remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Keyboard shortcut to clear all toasts (Escape key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && toasts.length > 0) {
        clearAllToasts();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toasts.length, clearAllToasts]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, clearAllToasts }}>
      {children}

      {/* Toast Container - Fixed positioning with better z-index */}
      <div
        className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ease-in-out ${
          isVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-full pointer-events-none"
        }`}
        style={{
          maxWidth: "calc(100vw - 2rem)",
          minWidth: "320px",
        }}
      >
        <div className="space-y-3">
          {toasts.map((toast, index) => (
            <Toast
              key={toast.id}
              toast={toast}
              onRemove={removeToast}
              index={index}
            />
          ))}
        </div>

        {/* Clear All Button - Only show when multiple toasts exist */}
        {toasts.length > 1 && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={clearAllToasts}
              className="text-xs text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white px-2 py-1 rounded-md border border-gray-200 hover:border-gray-300 transition-colors duration-200"
            >
              Clear all ({toasts.length})
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
};
