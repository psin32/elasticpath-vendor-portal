"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DashboardHeaderProps } from "../../types/dashboard";
import { OrganizationSelector } from "../ui/OrganizationSelector";
import { StoreSelector } from "../ui/StoreSelector";

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
            <img
              src="/images/kennicott-logo.png"
              alt="Kennicott Logo"
              className="w-40 h-auto"
            />

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
