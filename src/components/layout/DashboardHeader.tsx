"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeaderProps } from "../../types/dashboard";
import { OrganizationSelector } from "../ui/OrganizationSelector";
import { StoreSelector } from "../ui/StoreSelector";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builder } from "@builder.io/sdk";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  selectedOrgId,
  selectedStoreId,
  storeFilterMode,
  organizationStores,
  standaloneStores,
  storesLoading,
  standaloneStoresLoading,
  orgSearchTerm,
  onOrgSearchChange,
  onOrgSelect,
  onStoreSelect,
  onFetchOrganizationStores,
  onStandaloneStoreSelect,
  onLogout,
}) => {
  const router = useRouter();
  const [showOrgSelector, setShowOrgSelector] = React.useState(false);
  const [showStoreSelector, setShowStoreSelector] = React.useState(false);
  const [showStandaloneStoreSelector, setShowStandaloneStoreSelector] =
    React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [content, setContent] = useState(null);

  useEffect(() => {
    const init = async () => {
      const content = await builder
        .get("logo", {
          prerender: false,
        })
        .toPromise();
      setContent(content);
    };
    init();
  }, []);

  // Handle organization selection with refresh indicator
  const handleOrgSelectWithRefresh = async (orgId: string) => {
    if (orgId !== selectedOrgId) {
      setIsRefreshing(true);
      await onOrgSelect(orgId);
      setShowOrgSelector(false);
      setTimeout(() => {
        router.push("/");
      }, 100);
    }
  };

  // Handle store selection with refresh indicator
  const handleStoreSelectWithRefresh = (storeId: string) => {
    if (storeId !== selectedStoreId) {
      setIsRefreshing(true);
      onStoreSelect(storeId);
      setShowStoreSelector(false);

      setTimeout(() => {
        router.push("/");
      }, 100);
    }
  };

  return (
    <header className="bg-white shadow w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-6">
            {content && (
              <div className="ml-[-10px]">
                <BuilderContent
                  model="logo"
                  content={content}
                  apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
                />
              </div>
            )}

            <OrganizationSelector
              organizations={user.organizations || []}
              selectedOrgId={selectedOrgId}
              searchTerm={orgSearchTerm}
              onSearchChange={onOrgSearchChange}
              onOrgSelect={handleOrgSelectWithRefresh}
              onStandaloneStoreSelect={onStandaloneStoreSelect}
              isOpen={showOrgSelector}
              onToggle={() => setShowOrgSelector(!showOrgSelector)}
            />

            {/* Show store selector only when an organization is selected */}
            {selectedOrgId && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">→</span>
                <StoreSelector
                  stores={organizationStores}
                  selectedStoreId={selectedStoreId}
                  searchTerm=""
                  onSearchChange={() => {}}
                  onStoreSelect={handleStoreSelectWithRefresh}
                  isOpen={showStoreSelector}
                  onToggle={() => setShowStoreSelector(!showStoreSelector)}
                  disabled={false}
                  storeFilterMode="all"
                />
                {organizationStores.length === 0 && !storesLoading && (
                  <span className="text-xs text-gray-400 italic">
                    No stores found
                  </span>
                )}
                {storesLoading && (
                  <span className="text-xs text-blue-500 italic">
                    Loading stores...
                  </span>
                )}
                {organizationStores.length > 0 && !storesLoading && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-green-500">
                      ✓ {organizationStores.length} stores
                    </span>
                    <button
                      onClick={() => onFetchOrganizationStores?.(selectedOrgId)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      title="Refresh stores"
                    >
                      <svg
                        className="w-3 h-3"
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
                    </button>
                  </div>
                )}

                {/* Clear Button */}
                <button
                  onClick={() => {
                    // Clear local storage
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (
                        key &&
                        (key.startsWith("org_stores_") ||
                          key === "selected_org_id" ||
                          key === "selected_store_id" ||
                          key === "standalone_stores")
                      ) {
                        keysToRemove.push(key);
                      }
                    }
                    keysToRemove.forEach((key) => localStorage.removeItem(key));

                    // Clear UI state
                    onOrgSelect("");
                    setShowOrgSelector(false);
                    setShowStoreSelector(false);

                    // Refresh the page
                    window.location.reload();
                  }}
                  className="ml-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  title="Clear selection"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Show standalone stores selector when no organization is selected */}
            {!selectedOrgId && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">→</span>
                <StoreSelector
                  stores={standaloneStores}
                  selectedStoreId={selectedStoreId}
                  searchTerm=""
                  onSearchChange={() => {}}
                  onStoreSelect={handleStoreSelectWithRefresh}
                  isOpen={showStandaloneStoreSelector}
                  onToggle={() =>
                    setShowStandaloneStoreSelector(!showStandaloneStoreSelector)
                  }
                  disabled={false}
                  storeFilterMode="all"
                />
                {standaloneStores.length === 0 && !standaloneStoresLoading && (
                  <span className="text-xs text-gray-400 italic">
                    No standalone stores found
                  </span>
                )}
                {standaloneStoresLoading && (
                  <span className="text-xs text-blue-500 italic">
                    Loading standalone stores...
                  </span>
                )}
                {standaloneStores.length > 0 && !standaloneStoresLoading && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-green-500">
                      ✓ {standaloneStores.length} standalone stores
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Show message when no store is selected at all */}
            {!selectedOrgId && !selectedStoreId && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">→</span>
                <span className="text-sm text-amber-600 font-medium">
                  Please select a store to view products and orders
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Welcome, {user.data.name}
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
