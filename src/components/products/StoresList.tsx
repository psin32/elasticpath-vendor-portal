"use client";

import React, { useMemo } from "react";
import { Store } from "../../types/auth";
import { StoreFilterMode } from "../../types/dashboard";

interface StoresListProps {
  stores: Store[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedOrgId: string | null;
  selectedStoreId: string | null;
  storeFilterMode: StoreFilterMode;
  storesLoading: boolean;
  onStoreSelect: (storeId: string) => void;
  onFilterModeToggle: (mode: StoreFilterMode) => void;
}

export const StoresList: React.FC<StoresListProps> = ({
  stores,
  searchTerm,
  onSearchChange,
  selectedOrgId,
  selectedStoreId,
  storeFilterMode,
  storesLoading,
  onStoreSelect,
  onFilterModeToggle,
}) => {
  // Filter stores based on filter mode, search term, and selected organization
  const filteredStores = useMemo(() => {
    let filtered = stores;

    // Filter by organization only if in organization mode and org is selected
    if (storeFilterMode === "organization" && selectedOrgId) {
      filtered = filtered.filter(
        (store) => store.relationships?.organization?.data?.id === selectedOrgId
      );
    }

    // Then filter by search term if any
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (store) =>
          store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (store.description &&
            store.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (store.relationships?.organization?.data?.id &&
            store.relationships.organization.data.id
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [stores, searchTerm, selectedOrgId, storeFilterMode]);

  // Show loading state when fetching organization stores
  if (storeFilterMode === "organization" && storesLoading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-8 text-center">
          <svg
            className="mx-auto h-8 w-8 text-indigo-600 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Loading stores...
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Fetching stores for the selected organization.
          </p>
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No stores</h3>
        <p className="mt-1 text-sm text-gray-500">
          {storeFilterMode === "organization"
            ? "No stores found for the selected organization."
            : "Get started by creating a new store."}
        </p>
      </div>
    );
  }

  // Show message if no organization is selected in organization mode
  if (storeFilterMode === "organization" && !selectedOrgId) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Select an Organization
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select an organization from the Organizations tab to view its
            stores, or switch to "All Stores" mode.
          </p>
          <div className="mt-4">
            <button
              onClick={() => onFilterModeToggle("all")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Switch to All Stores
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {/* Filter Mode Toggle */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              Store Filter:
            </span>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => onFilterModeToggle("all")}
                className={`px-3 py-1 text-sm font-medium rounded-l-md border ${
                  storeFilterMode === "all"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                All Stores
              </button>
              <button
                onClick={() => onFilterModeToggle("organization")}
                className={`px-3 py-1 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  storeFilterMode === "organization"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Organization Only
              </button>
            </div>
          </div>
          {storeFilterMode === "organization" && selectedOrgId && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Filtering by:</span>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {selectedOrgId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder={
              storeFilterMode === "organization"
                ? "Search stores within selected organization..."
                : "Search all stores by name, ID, description, or organization ID..."
            }
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <ul className="divide-y divide-gray-200">
        {filteredStores.length === 0 ? (
          <li>
            <div className="px-4 py-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No stores found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? `No stores match "${searchTerm}"`
                  : "No stores available"}
              </p>
            </div>
          </li>
        ) : (
          filteredStores.map((store) => (
            <li
              key={store.id}
              className={`cursor-pointer transition-colors duration-200 ${
                selectedStoreId === store.id
                  ? "bg-indigo-50 border-l-4 border-indigo-400"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onStoreSelect(store.id)}
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          selectedStoreId === store.id
                            ? "bg-indigo-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <svg
                          className={`h-6 w-6 ${
                            selectedStoreId === store.id
                              ? "text-indigo-600"
                              : "text-blue-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {store.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Store ID: {store.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Organization ID:{" "}
                        {store.relationships?.organization?.data?.id}
                      </div>
                      {store.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {store.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {store.slug}
                    </span>
                    {selectedStoreId === store.id && (
                      <svg
                        className="h-5 w-5 text-indigo-600"
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
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};
