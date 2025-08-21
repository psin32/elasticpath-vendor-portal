"use client";

import React, { useState, useEffect } from "react";

interface ToastType {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
  index: number;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Staggered entrance animation based on index
    const entranceDelay = index * 100;
    const entranceTimer = setTimeout(() => setIsVisible(true), entranceDelay);

    // Progress bar animation
    if (toast.duration && toast.duration > 0) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0 || !toast.duration) return 0;
          return prev - 100 / (toast.duration / 100);
        });
      }, 100);

      return () => {
        clearTimeout(entranceTimer);
        clearInterval(progressInterval);
      };
    }

    return () => clearTimeout(entranceTimer);
  }, [index, toast.duration]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-white border-green-200 shadow-green-100/50";
      case "error":
        return "bg-white border-red-200 shadow-red-100/50";
      case "warning":
        return "bg-white border-yellow-200 shadow-yellow-100/50";
      default:
        return "bg-white border-blue-200 shadow-blue-100/50";
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-l-4 border-l-green-500";
      case "error":
        return "border-l-4 border-l-red-500";
      case "warning":
        return "border-l-4 border-l-yellow-500";
      default:
        return "border-l-4 border-l-blue-500";
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-900";
      case "error":
        return "text-red-900";
      case "warning":
        return "text-yellow-900";
      default:
        return "text-blue-900";
    }
  };

  const getProgressColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div
      className={`w-full ${getBackgroundColor(toast.type)} ${getBorderColor(
        toast.type
      )} border rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-out transform ${
        isVisible && !isExiting
          ? "translate-x-0 opacity-100 scale-100"
          : isExiting
          ? "translate-x-full opacity-0 scale-95"
          : "translate-x-full opacity-0 scale-95"
      } hover:shadow-xl hover:scale-[1.02]`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="w-full h-1 bg-gray-100">
          <div
            className={`h-full ${getProgressColor(
              toast.type
            )} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start space-x-3">
          {getIcon(toast.type)}

          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${getTextColor(
                toast.type
              )} leading-relaxed`}
            >
              {toast.message}
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              className={`inline-flex ${getTextColor(
                toast.type
              )} hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400 rounded-md p-1 transition-all duration-200 hover:bg-gray-100`}
              onClick={handleRemove}
              aria-label="Close toast"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
