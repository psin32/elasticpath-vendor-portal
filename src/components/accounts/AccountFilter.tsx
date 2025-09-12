"use client";

import React, { useState } from "react";

export interface AccountFilterState {
  email?: string;
  name?: string;
}

export interface AccountFilterFormState {
  email?: string;
  name?: string;
}

interface AccountFilterProps {
  onFilterChange: (filters: AccountFilterState) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export default function AccountFilter({
  onFilterChange,
  onClearFilters,
  loading = false,
}: AccountFilterProps) {
  const [formFilters, setFormFilters] = useState<AccountFilterFormState>({});
  const [appliedFilters, setAppliedFilters] = useState<AccountFilterState>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFormChange = (
    key: keyof AccountFilterFormState,
    value: string | undefined
  ) => {
    setFormFilters({ ...formFilters, [key]: value });
  };

  const handleApplyFilters = () => {
    // Clean up the form filters (remove empty values)
    const cleanedFilters: AccountFilterState = {};
    Object.entries(formFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        cleanedFilters[key as keyof AccountFilterState] = value;
      }
    });

    setAppliedFilters(cleanedFilters);
    onFilterChange(cleanedFilters);
  };

  const handleClearFilters = () => {
    setFormFilters({});
    setAppliedFilters({});
    onClearFilters();
  };

  const hasActiveFilters = Object.values(appliedFilters).some(
    (value) => value !== undefined && value !== "" && value !== null
  );

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Filter Account Members
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {loading ? "Loading..." : "Find Members"}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          </button>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formFilters.email || ""}
            onChange={(e) =>
              handleFormChange("email", e.target.value || undefined)
            }
            disabled={loading}
            placeholder="member@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formFilters.name || ""}
            onChange={(e) =>
              handleFormChange("name", e.target.value || undefined)
            }
            disabled={loading}
            placeholder="John Doe or *swan*"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Advanced Filters
          </h4>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Filtering Tips
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Email:</strong> Use exact match (eq) or partial
                      match (like)
                    </li>
                    <li>
                      <strong>Name:</strong> Use wildcards like{" "}
                      <code>*swan*</code> for partial matches
                    </li>
                    <li>
                      <strong>Examples:</strong>
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>
                          • Email: <code>john@example.com</code> (exact match)
                        </li>
                        <li>
                          • Name: <code>*swan*</code> (contains "swan")
                        </li>
                        <li>
                          • Name: <code>John*</code> (starts with "John")
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">
              Active filters:
            </span>
            {Object.entries(appliedFilters).map(([key, value]) => {
              if (value === undefined || value === "" || value === null)
                return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {key}: {value}
                  <button
                    onClick={() => {
                      // Remove from both form and applied filters
                      const newFormFilters = { ...formFilters };
                      const newAppliedFilters = { ...appliedFilters };
                      delete newFormFilters[
                        key as keyof AccountFilterFormState
                      ];
                      delete newAppliedFilters[key as keyof AccountFilterState];
                      setFormFilters(newFormFilters);
                      setAppliedFilters(newAppliedFilters);
                      onFilterChange(newAppliedFilters);
                    }}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                  >
                    <span className="sr-only">Remove filter</span>
                    <svg
                      className="w-2 h-2"
                      fill="currentColor"
                      viewBox="0 0 8 8"
                    >
                      <path
                        d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
