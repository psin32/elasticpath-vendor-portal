"use client";

import React from "react";
import { useToast } from "../../contexts/ToastContext";

export default function TestToastPage() {
  const { showToast, clearAllToasts } = useToast();

  const handleShowToast = (type: "success" | "error" | "info" | "warning") => {
    const messages = {
      success: "This is a success message! Everything worked perfectly.",
      error: "This is an error message! Something went wrong.",
      info: "This is an info message! Here's some useful information.",
      warning: "This is a warning message! Please be careful."
    };

    showToast(messages[type], type, 8000);
  };

  const handleShowMultipleToasts = () => {
    showToast("First toast message", "info", 6000);
    setTimeout(() => showToast("Second toast message", "success", 6000), 500);
    setTimeout(() => showToast("Third toast message", "warning", 6000), 1000);
    setTimeout(() => showToast("Fourth toast message", "error", 6000), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Toast Notification System
          </h1>
          <p className="text-lg text-gray-600">
            Test the improved toast notifications with enhanced look and feel
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Individual Toast Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Individual Toast Types
              </h3>
              
              <button
                onClick={() => handleShowToast("success")}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Show Success Toast
              </button>
              
              <button
                onClick={() => handleShowToast("error")}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Show Error Toast
              </button>
              
              <button
                onClick={() => handleShowToast("info")}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Show Info Toast
              </button>
              
              <button
                onClick={() => handleShowToast("warning")}
                className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-medium"
              >
                Show Warning Toast
              </button>
            </div>

            {/* Special Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Special Features
              </h3>
              
              <button
                onClick={handleShowMultipleToasts}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
              >
                Show Multiple Toasts
              </button>
              
              <button
                onClick={clearAllToasts}
                className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                Clear All Toasts
              </button>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Keyboard Shortcuts</h4>
                <p className="text-sm text-blue-700">
                  Press <kbd className="bg-blue-100 px-2 py-1 rounded text-xs">Esc</kbd> to clear all toasts
                </p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              New Features & Improvements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Enhanced animations with staggered entrance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Progress bar showing toast duration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Improved visual design with colored borders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Timestamp display for each toast</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Better z-index management (z-[9999])</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Responsive design with proper spacing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Clear all button for multiple toasts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Hover effects and smooth transitions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
