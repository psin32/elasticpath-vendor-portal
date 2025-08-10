"use client";

import React from "react";
import { DashboardContentProps } from "../../types/dashboard";
import { OrganizationsList } from "../products/OrganizationsList";
import { StoresList } from "../products/StoresList";
import EpccDemo from "../products/EpccDemo";

export const DashboardContent: React.FC<DashboardContentProps> = ({
  activeSection,
  selectedOrgId,
  selectedStoreId,
  user,
  organizationStores,
  storesLoading,
  storeFilterMode,
  orgSearchTerm,
  storeSearchTerm,
  onOrgSearchChange,
  onStoreSearchChange,
  onOrgSelect,
  onStoreSelect,
  onFilterModeToggle,
}) => {
  const renderContent = () => {
    switch (activeSection) {
      case "organizations":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Organizations
            </h2>
            <OrganizationsList
              organizations={user.organizations || []}
              searchTerm={orgSearchTerm}
              onSearchChange={onOrgSearchChange}
              selectedOrgId={selectedOrgId}
              onOrgSelect={onOrgSelect}
            />
          </div>
        );

      case "stores":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stores</h2>
            <StoresList
              stores={
                storeFilterMode === "organization"
                  ? organizationStores
                  : user.stores || []
              }
              searchTerm={storeSearchTerm}
              onSearchChange={onStoreSearchChange}
              selectedOrgId={selectedOrgId}
              selectedStoreId={selectedStoreId}
              storeFilterMode={storeFilterMode}
              storesLoading={storesLoading}
              onStoreSelect={onStoreSelect}
              onFilterModeToggle={onFilterModeToggle}
            />
          </div>
        );

      case "products":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Products
            </h2>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">
                Products are now available at{" "}
                <a
                  href="/products"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  /products
                </a>
              </p>
            </div>
          </div>
        );

      case "orders":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders</h2>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">Orders management coming soon...</p>
            </div>
          </div>
        );

      case "accounts":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Accounts
            </h2>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">
                Accounts management coming soon...
              </p>
            </div>
          </div>
        );

      case "inventory":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Inventory
            </h2>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">
                Inventory management coming soon...
              </p>
            </div>
          </div>
        );

      case "api-demo":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              API Demo
            </h2>
            <EpccDemo
              selectedOrgId={selectedOrgId || undefined}
              selectedStoreId={selectedStoreId || undefined}
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
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
              Select a Store
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please select a store from the header to access store management
              features.
            </p>
          </div>
        );
    }
  };

  return <div className="h-full overflow-auto p-6">{renderContent()}</div>;
};
