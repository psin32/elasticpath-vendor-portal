"use client";

import React, { useRef, useEffect } from "react";
import { StoreSelectorProps } from "../../types/dashboard";

export const StoreSelector: React.FC<StoreSelectorProps> = ({
  stores,
  selectedStoreId,
  searchTerm,
  onSearchChange,
  onStoreSelect,
  isOpen,
  onToggle,
  disabled = false,
  storeFilterMode,
}) => {
  const selectedStore = stores?.find((store) => store.id === selectedStoreId);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (isOpen) {
          onToggle();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        disabled={disabled}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          {selectedStore ? selectedStore.name : "Select Store"}
        </span>
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Store Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="py-1">
            {stores
              ?.filter(
                (store) =>
                  store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  store.id.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    onStoreSelect(store.id);
                    onToggle();
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                >
                  <span className="truncate">{store.name}</span>
                  {selectedStoreId === store.id && (
                    <svg
                      className="h-4 w-4 text-indigo-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
