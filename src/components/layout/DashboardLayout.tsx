"use client";

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { DashboardHeader } from "./DashboardHeader";
import { SidebarNavigation } from "./SidebarNavigation";
import LoginForm from "../forms/LoginForm";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const {
    activeSection,
    orgSearchTerm,
    selectedOrgId,
    selectedStoreId,
    storeFilterMode,
    organizationStores,
    storesLoading,
    handleOrgSelect,
    handleStoreSelect,
    handleFilterModeToggle,
    fetchOrganizationStores,
    setActiveSection,
    setOrgSearchTerm,
  } = useDashboard();

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show dashboard layout for authenticated users
  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header - Always visible for authenticated users */}
      <DashboardHeader
        user={user}
        selectedOrgId={selectedOrgId}
        selectedStoreId={selectedStoreId}
        storeFilterMode={storeFilterMode}
        organizationStores={organizationStores}
        storesLoading={storesLoading}
        orgSearchTerm={orgSearchTerm}
        onOrgSearchChange={setOrgSearchTerm}
        onOrgSelect={handleOrgSelect}
        onStoreSelect={handleStoreSelect}
        onFetchOrganizationStores={fetchOrganizationStores}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className="flex flex-1">
        <SidebarNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
