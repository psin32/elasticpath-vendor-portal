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
  orgSearchTerm,
  storeSearchTerm,
  onOrgSearchChange,
  onStoreSearchChange,
  onOrgSelect,
  onStoreSelect,
  onLogout,
}) => {
  const router = useRouter();
  const [showOrgSelector, setShowOrgSelector] = React.useState(false);
  const [showStoreSelector, setShowStoreSelector] = React.useState(false);

  return (
    <header className="bg-white shadow w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-gray-900">
              Elastic Path Admin Portal
            </h1>

            <OrganizationSelector
              organizations={user.organizations || []}
              selectedOrgId={selectedOrgId}
              searchTerm={orgSearchTerm}
              onSearchChange={onOrgSearchChange}
              onOrgSelect={onOrgSelect}
              isOpen={showOrgSelector}
              onToggle={() => setShowOrgSelector(!showOrgSelector)}
            />

            <StoreSelector
              stores={
                storeFilterMode === "organization"
                  ? organizationStores
                  : user.stores || []
              }
              selectedStoreId={selectedStoreId}
              searchTerm={storeSearchTerm}
              onSearchChange={onStoreSearchChange}
              onStoreSelect={onStoreSelect}
              isOpen={showStoreSelector}
              onToggle={() => setShowStoreSelector(!showStoreSelector)}
              disabled={!selectedOrgId && storeFilterMode === "organization"}
              storeFilterMode={storeFilterMode}
            />
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
