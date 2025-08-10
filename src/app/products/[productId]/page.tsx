"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useEpccApi } from "../../../hooks/useEpccApi";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../../../components/layout/DashboardHeader";
import { SidebarNavigation } from "../../../components/layout/SidebarNavigation";
import { useDashboard } from "../../../hooks/useDashboard";
import { PcmProduct } from "@elasticpath/js-sdk";

interface ProductEditPageProps {
  params: {
    productId: string;
  };
}

export default function ProductEditPage({ params }: ProductEditPageProps) {
  const { productId } = params;
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<PcmProduct | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    status: "draft",
    commodity_type: "physical",
    sku: "",
  });

  // Use the same dashboard state management
  const {
    orgSearchTerm,
    storeSearchTerm,
    selectedOrgId,
    selectedStoreId,
    storeFilterMode,
    organizationStores,
    storesLoading,
    handleOrgSelect,
    handleStoreSelect,
    setOrgSearchTerm,
    setStoreSearchTerm,
  } = useDashboard();

  const { fetchProduct } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  // Fetch product data
  useEffect(() => {
    if (selectedOrgId && selectedStoreId && productId) {
      loadProduct();
    }
  }, [selectedOrgId, selectedStoreId, productId]);

  const loadProduct = async () => {
    if (!selectedOrgId || !selectedStoreId || !productId) return;

    setProductLoading(true);
    setError(null);

    try {
      const productsData = await fetchProduct(productId);
      const foundProduct = productsData?.data;

      if (foundProduct) {
        setProduct(foundProduct);
        setFormData({
          name: foundProduct.attributes.name || "",
          description: foundProduct.attributes.description || "",
          slug: foundProduct.attributes.slug || "",
          status: foundProduct.attributes.status || "draft",
          commodity_type: foundProduct.attributes.commodity_type || "physical",
          sku: foundProduct.attributes.sku || "",
        });
      } else {
        setError("Product not found");
      }
    } catch (err) {
      setError("Failed to load product");
      console.error("Error loading product:", err);
    } finally {
      setProductLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!product) return;

    setSaving(true);
    setError(null);

    try {
      // Here you would typically call an API to update the product
      // For now, we'll just simulate a save
      console.log("Saving product:", { id: product.id, ...formData });

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              attributes: {
                ...prev.attributes,
                ...formData,
              },
            }
          : null
      );

      // Show success message (you could add a toast notification here)
      alert("Product saved successfully!");
    } catch (err) {
      setError("Failed to save product");
      console.error("Error saving product:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/products");
  };

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
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
            activeSection="products"
            onSectionChange={(section) => {
              if (section !== "products") {
                router.push("/");
              }
            }}
          />
        )}

        <main className="flex-1 overflow-auto bg-white">
          <div className="p-6 bg-white">
            <div className="w-full">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Edit Product
                      </h1>
                      <p className="mt-1 text-sm text-gray-500 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          ID: {productId}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || productLoading}
                      className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {saving ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {productLoading ? (
                <div className="text-center py-12">
                  <svg
                    className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
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
                  <p className="mt-2 text-gray-600">Loading product...</p>
                </div>
              ) : !product ? (
                <div className="text-center py-12">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">
                          Product not found
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Product Edit Form */
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="px-6 py-8">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                      {/* Product Name */}
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="name"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          Product Name *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                            placeholder="Enter product name"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* SKU */}
                      <div>
                        <label
                          htmlFor="sku"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          SKU *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="sku"
                            id="sku"
                            value={formData.sku}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 font-mono"
                            placeholder="PROD-001"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Slug */}
                      <div>
                        <label
                          htmlFor="slug"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          Slug
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="slug"
                            id="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                            placeholder="product-name"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <label
                          htmlFor="status"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          Status
                        </label>
                        <div className="relative">
                          <select
                            name="status"
                            id="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 appearance-none bg-white"
                          >
                            <option value="draft">Draft</option>
                            <option value="live">Live</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Commodity Type */}
                      <div>
                        <label
                          htmlFor="commodity_type"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          Commodity Type
                        </label>
                        <div className="relative">
                          <select
                            name="commodity_type"
                            id="commodity_type"
                            value={formData.commodity_type}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 appearance-none bg-white"
                          >
                            <option value="physical">Physical</option>
                            <option value="digital">Digital</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="description"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          Description
                        </label>
                        <div className="relative">
                          <textarea
                            name="description"
                            id="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                            placeholder="Enter product description..."
                          />
                          <div className="absolute top-3 right-3 pointer-events-none">
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
