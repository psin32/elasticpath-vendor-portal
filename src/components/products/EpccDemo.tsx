"use client";

import React, { useEffect, useState } from "react";
import { useEpccApi } from "../../hooks/useEpccApi";

/**
 * Demo component showing how to use the EPCC client hooks
 */
export default function EpccDemo({
  selectedOrgId,
  selectedStoreId,
}: {
  selectedOrgId?: string;
  selectedStoreId?: string;
}) {
  const {
    isReady,
    isLoading,
    hasError,
    error,
    fetchOrganizations,
    fetchStores,
    fetchStore,
    fetchProducts,
    fetchUserRole,
    clearApiError,
    fetchUserProfile,
    fetchOrganization,
  } = useEpccApi(selectedOrgId, selectedStoreId);

  const [organizations, setOrganizations] = useState<any>(null);
  const [stores, setStores] = useState<any>(null);
  const [products, setProducts] = useState<any>(null);

  // Load data when client is ready
  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady]);

  const loadData = async () => {
    // Fetch organizations
    const orgsResult = await fetchOrganizations();
    if (orgsResult) {
      setOrganizations(orgsResult);
    }

    // Fetch stores
    const storesResult = await fetchStores();
    if (storesResult) {
      setStores(storesResult);
    }

    await fetchOrganization("6048c307-073a-4a43-b94e-4750d7acfa55");
    await fetchUserProfile();

    // Example: Fetch user role with organization context
    await fetchUserRole(
      "2469867280540893593",
      "6048c307-073a-4a43-b94e-4750d7acfa55"
    );

    // Example: Fetch user role with both organization and store context
    await fetchUserRole(
      "2469867280540893593",
      "6048c307-073a-4a43-b94e-4750d7acfa55",
      "88083d47-ed3f-4964-976e-8f62a9f5c8c4"
    );

    await fetchStore("88083d47-ed3f-4964-976e-8f62a9f5c8c4");

    // Fetch products (first 10)
    const productsResult = await fetchProducts({ limit: 10 });
    if (productsResult) {
      setProducts(productsResult);
    }
  };

  if (!isReady) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          EPCC Client Demo
        </h3>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-5 w-5 text-indigo-600"
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
            <span className="text-gray-600">Initializing EPCC client...</span>
          </div>
        ) : (
          <p className="text-gray-600">EPCC client not available</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            EPCC Client Demo
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Connected</span>
          </div>
        </div>

        {hasError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={clearApiError}
                className="text-red-600 hover:text-red-800"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
            ) : null}
            {isLoading ? "Loading..." : "Fetch Data"}
          </button>
        </div>
      </div>

      {/* Organizations */}
      {organizations && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Organizations ({organizations.data?.length || 0})
          </h4>
          <div className="space-y-2">
            {organizations.data?.slice(0, 3).map((org: any) => (
              <div
                key={org.id}
                className="p-3 bg-gray-50 rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">{org.name}</p>
                  <p className="text-sm text-gray-500">ID: {org.id}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {org.type}
                </span>
              </div>
            )) || (
              <p className="text-gray-500 text-sm">No organizations found</p>
            )}
          </div>
        </div>
      )}

      {/* Stores */}
      {stores && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Stores ({stores.data?.length || 0})
          </h4>
          <div className="space-y-2">
            {stores.data?.slice(0, 3).map((store: any) => (
              <div
                key={store.id}
                className="p-3 bg-gray-50 rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">{store.name}</p>
                  <p className="text-sm text-gray-500">ID: {store.id}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {store.type}
                </span>
              </div>
            )) || <p className="text-gray-500 text-sm">No stores found</p>}
          </div>
        </div>
      )}

      {/* Products */}
      {products && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Products ({products.data?.length || 0})
          </h4>
          <div className="space-y-2">
            {products.data?.slice(0, 3).map((product: any) => (
              <div
                key={product.id}
                className="p-3 bg-gray-50 rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {product.attributes?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    SKU: {product.attributes?.sku}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {product.attributes?.status}
                </span>
              </div>
            )) || <p className="text-gray-500 text-sm">No products found</p>}
          </div>
        </div>
      )}
    </div>
  );
}
