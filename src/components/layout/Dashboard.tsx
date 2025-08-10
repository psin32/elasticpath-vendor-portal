"use client";

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { DashboardHeader } from "./DashboardHeader";
import { SidebarNavigation } from "./SidebarNavigation";
import { DashboardContent } from "./DashboardContent";

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    activeSection,
    orgSearchTerm,
    storeSearchTerm,
    selectedOrgId,
    selectedStoreId,
    storeFilterMode,
    organizationStores,
    storesLoading,
    handleOrgSelect,
    handleStoreSelect,
    handleFilterModeToggle,
    setActiveSection,
    setOrgSearchTerm,
    setStoreSearchTerm,
  } = useDashboard();

  if (!user) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <DashboardHeader
        user={user}
        selectedOrgId={selectedOrgId}
        selectedStoreId={selectedStoreId}
        storeFilterMode={storeFilterMode}
        organizationStores={organizationStores}
        orgSearchTerm={orgSearchTerm}
        storeSearchTerm={storeSearchTerm}
        onOrgSearchChange={setOrgSearchTerm}
        onStoreSearchChange={setStoreSearchTerm}
        onOrgSelect={handleOrgSelect}
        onStoreSelect={handleStoreSelect}
        onLogout={logout}
      />

      <div className="flex flex-1">
        {selectedStoreId && (
          <SidebarNavigation
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        )}

        <main className="flex-1 overflow-auto">
          <DashboardContent
            activeSection={activeSection}
            selectedOrgId={selectedOrgId}
            selectedStoreId={selectedStoreId}
            user={user}
            organizationStores={organizationStores}
            storesLoading={storesLoading}
            storeFilterMode={storeFilterMode}
            orgSearchTerm={orgSearchTerm}
            storeSearchTerm={storeSearchTerm}
            onOrgSearchChange={setOrgSearchTerm}
            onStoreSearchChange={setStoreSearchTerm}
            onOrgSelect={handleOrgSelect}
            onStoreSelect={handleStoreSelect}
            onFilterModeToggle={handleFilterModeToggle}
          />
        </main>
      </div>
    </div>
  );
};
