"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useEpccApi } from "../../../hooks/useEpccApi";
import { DashboardHeader } from "../../../components/layout/DashboardHeader";
import { useDashboard } from "../../../hooks/useDashboard";
import { ImageOverlay } from "../../../components/ui/ImageOverlay";
import { PcmProduct } from "@elasticpath/js-sdk";

interface ProductImage {
  url: string;
  alt: string;
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<PcmProduct | null>(null);
  const [mainImage, setMainImage] = useState<ProductImage | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inventory state
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "inventory">(
    "details"
  );
  const [editingInventory, setEditingInventory] = useState<string | null>(null);
  const [newInventory, setNewInventory] = useState({
    ep_available_date: "",
    ep_shelf_life_days: 0,
    ep_available: 0,
  });
  const [showNewInventoryForm, setShowNewInventoryForm] = useState(false);

  // Use the same dashboard state management
  const { selectedOrgId, selectedStoreId, handleOrgSelect, handleStoreSelect } =
    useDashboard();

  const {
    fetchProduct,
    updateProduct,
    fetchInventoryBySku,
    createInventory,
    updateInventory,
    deleteInventory,
  } = useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);

  // Form state for editable fields
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    sku: "",
    status: "draft",
    commodity_type: "physical",
  });

  const fetchInventory = async (sku: string) => {
    if (!sku) return;

    try {
      setInventoryLoading(true);
      const result = await fetchInventoryBySku(sku);
      if (result && result.data) {
        setInventoryData(result.data);
      } else {
        setInventoryData([]);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setInventoryData([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setProductLoading(true);
        setError(null);
        const productsData = await fetchProduct(productId);
        const foundProduct = productsData?.data;
        console.log("productsData", productsData);

        if (foundProduct) {
          setProduct(foundProduct);
          setMainImage({
            url: productsData?.included?.main_images?.[0]?.link?.href || "",
            alt: foundProduct.attributes.name || "Product Image",
          });

          // Initialize form data with product values
          setFormData({
            name: foundProduct.attributes.name || "",
            description: foundProduct.attributes.description || "",
            slug: foundProduct.attributes.slug || "",
            sku: foundProduct.attributes.sku || "",
            status: foundProduct.attributes.status || "draft",
            commodity_type:
              foundProduct.attributes.commodity_type || "physical",
          });

          // Fetch inventory data for this product
          if (foundProduct.attributes.sku) {
            fetchInventory(foundProduct.attributes.sku);
          }
        }
      } catch (err) {
        setError("Failed to load product");
        console.error("Error loading product:", err);
      } finally {
        setProductLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, fetchProduct]);

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

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare update data
      const updateData = {
        type: "product",
        id: product.id,
        attributes: {
          name: formData.name,
          description: formData.description,
          slug: formData.slug,
          sku: formData.sku,
          status: formData.status,
          commodity_type: formData.commodity_type,
        },
      };

      // Call update API
      const result = await updateProduct(product.id, updateData);

      if (result) {
        setSuccess("Product updated successfully!");
        // Update local product state
        setProduct((prev: PcmProduct | null) =>
          prev
            ? { ...prev, attributes: { ...prev.attributes, ...formData } }
            : null
        );

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update product");
      }
    } catch (err) {
      setError("Failed to update product");
      console.error("Error updating product:", err);
    } finally {
      setSaving(false);
    }
  };

  const isFormChanged = () => {
    if (!product) return false;

    return (
      formData.name !== (product.attributes.name || "") ||
      formData.description !== (product.attributes.description || "") ||
      formData.slug !== (product.attributes.slug || "") ||
      formData.sku !== (product.attributes.sku || "") ||
      formData.status !== (product.attributes.status || "draft") ||
      formData.commodity_type !==
        (product.attributes.commodity_type || "physical")
    );
  };

  // Helper function to format date to ISO string
  const formatDateToISO = (dateString: string): string | undefined => {
    if (!dateString) return undefined;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateString);
        return undefined;
      }
      return date.toISOString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return undefined;
    }
  };

  // Helper function to ensure integer values
  const ensureInteger = (value: any, defaultValue: number = 0): number => {
    const parsed = parseInt(String(value));
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Inventory management functions
  const handleCreateInventory = async () => {
    try {
      // Convert available date to ISO format if provided
      const formattedAvailableDate = formatDateToISO(
        newInventory.ep_available_date
      );

      const inventoryData = {
        data: {
          type: "inventory_ext",
          ...newInventory,
          ep_id: product?.attributes.sku + newInventory.ep_available_date,
          ep_shelf_life_days: ensureInteger(newInventory.ep_shelf_life_days),
          ep_available_date: formattedAvailableDate,
          ep_sku: product?.attributes.sku || "",
        },
      };

      const result = await createInventory(inventoryData);
      if (result) {
        setSuccess("Inventory record created successfully!");
        setShowNewInventoryForm(false);
        setNewInventory({
          ep_available_date: "",
          ep_shelf_life_days: 0,
          ep_available: 0,
        });
        // Refresh inventory data
        if (product?.attributes.sku) {
          fetchInventory(product.attributes.sku);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to create inventory record");
      }
    } catch (err) {
      setError("Failed to create inventory record");
      console.error("Error creating inventory:", err);
    }
  };

  const handleUpdateInventory = async (
    inventoryId: string,
    updatedData: any
  ) => {
    try {
      // Convert available date to ISO format if provided
      const formattedUpdatedData = {
        ...updatedData,
        attributes: {
          ...updatedData.attributes,
          ep_available_date: formatDateToISO(
            updatedData.attributes?.ep_available_date
          ),
          ep_shelf_life_days: ensureInteger(
            updatedData.attributes?.ep_shelf_life_days
          ),
          ep_available: ensureInteger(updatedData.attributes?.ep_available),
        },
      };

      const result = await updateInventory(inventoryId, formattedUpdatedData);
      if (result) {
        setSuccess("Inventory record updated successfully!");
        setEditingInventory(null);
        // Refresh inventory data
        if (product?.attributes.sku) {
          fetchInventory(product.attributes.sku);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update inventory record");
      }
    } catch (err) {
      setError("Failed to update inventory record");
      console.error("Error updating inventory:", err);
    }
  };

  const handleDeleteInventory = async (inventoryId: string) => {
    if (!confirm("Are you sure you want to delete this inventory record?"))
      return;

    try {
      const result = await deleteInventory(inventoryId);
      if (result) {
        setSuccess("Inventory record deleted successfully!");
        // Refresh inventory data
        if (product?.attributes.sku) {
          fetchInventory(product.attributes.sku);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to delete inventory record");
      }
    } catch (err) {
      setError("Failed to delete inventory record");
      console.error("Error deleting inventory:", err);
    }
  };

  if (productLoading) {
    return (
      <div className="p-6 bg-white">
        <div className="w-full">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-indigo-600 mx-auto"
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
              <p className="mt-4 text-gray-600">Loading product...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="p-6 bg-white">
        <div className="w-full">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Product
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/products")}
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="p-6 bg-white">
      <div className="w-full">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-green-400 mr-2"
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
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {product && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-8 py-8">
              <div className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Edit Product
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Product ID: {product.id}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => router.push("/products")}
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
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !isFormChanged()}
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

              <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "details"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Product Details
                  </button>
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "inventory"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Inventory
                    {inventoryData.length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {inventoryData.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {activeTab === "details" ? (
                /* Product Details Content */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-4">
                        Main Image
                      </label>
                      <div className="relative">
                        <div className="w-full flex justify-center">
                          <img
                            src={
                              mainImage?.url ||
                              "https://placehold.co/400x400?text=Product+Image"
                            }
                            alt={mainImage?.alt || "Product Image"}
                            className="w-80 h-80 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-all duration-200 shadow-lg border border-gray-200 hover:shadow-xl"
                            onClick={() => setSelectedImage(mainImage)}
                          />
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                          Image size: 400×400 pixels • Click to view larger
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-900 mb-4">
                        Quick Stats
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Status</span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              formData.status === "live"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {formData.status || "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Type</span>
                          <span className="text-sm font-medium text-blue-900">
                            {formData.commodity_type || "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Created</span>
                          <span className="text-sm font-medium text-blue-900">
                            {product.meta?.created_at
                              ? new Date(
                                  product.meta.created_at
                                ).toLocaleDateString()
                              : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="space-y-6">
                      {/* Product Name */}
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* SKU and Slug Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
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

                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
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
                      </div>

                      {/* Status and Type Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Status
                          </label>
                          <div className="relative">
                            <select
                              name="status"
                              id="status"
                              value={formData.status}
                              onChange={handleInputChange}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 appearance-none"
                            >
                              <option value="draft">Draft</option>
                              <option value="live">Live</option>
                              <option value="archived">Archived</option>
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

                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Commodity Type
                          </label>
                          <div className="relative">
                            <select
                              name="commodity_type"
                              id="commodity_type"
                              value={formData.commodity_type}
                              onChange={handleInputChange}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 appearance-none"
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
                      </div>

                      {/* Description */}
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
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
                                d="M4 6h16M4 10h16M4 14h16M4 18h16"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="px-8 py-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Inventory Records
                    </h2>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => setShowNewInventoryForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add New Inventory
                      </button>
                    </div>

                    {showNewInventoryForm && (
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          New Inventory Record
                        </h3>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> SKU will be automatically set
                            to "{product?.attributes.sku}" from the product.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Available Date
                            </label>
                            <input
                              type="date"
                              value={newInventory.ep_available_date}
                              onChange={(e) =>
                                setNewInventory({
                                  ...newInventory,
                                  ep_available_date: e.target.value,
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Available Date"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Date will be converted to ISO format (UTC) when
                              saving
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Shelf Life (Days)
                            </label>
                            <input
                              type="number"
                              value={newInventory.ep_shelf_life_days}
                              onChange={(e) =>
                                setNewInventory({
                                  ...newInventory,
                                  ep_shelf_life_days: ensureInteger(
                                    e.target.value
                                  ),
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="0"
                              min="0"
                              step="1"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Enter whole number of days (e.g., 30, 90, 365)
                            </p>
                          </div>
                          <div>
                            <label
                              htmlFor="ep_available"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Available Quantity *
                            </label>
                            <input
                              type="number"
                              id="ep_available"
                              value={newInventory.ep_available}
                              onChange={(e) =>
                                setNewInventory({
                                  ...newInventory,
                                  ep_available: ensureInteger(e.target.value),
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="0"
                              min="0"
                              required
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                          <button
                            onClick={() => setShowNewInventoryForm(false)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreateInventory}
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                Add Inventory
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {inventoryLoading ? (
                      <div className="text-center py-12">
                        <svg
                          className="animate-spin h-12 w-12 text-indigo-600 mx-auto"
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
                        <p className="mt-4 text-gray-600">
                          Loading inventory...
                        </p>
                      </div>
                    ) : inventoryData.length === 0 ? (
                      <div className="text-center py-12">
                        <svg
                          className="h-12 w-12 text-gray-400 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                        <p className="mt-4 text-gray-600">
                          No inventory records found for this product.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                SKU
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Available Date
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Shelf Life (Days)
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Available Quantity
                              </th>
                              <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {inventoryData.map((inventory) => (
                              <tr key={inventory.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {inventory.ep_sku}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {inventory.ep_available_date
                                    ? new Date(
                                        inventory.ep_available_date
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {inventory.ep_shelf_life_days}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      (inventory.ep_available || 0) > 0
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {inventory.ep_available || 0}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() =>
                                      setEditingInventory(inventory.id)
                                    }
                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteInventory(inventory.id)
                                    }
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <ImageOverlay
          imageUrl={selectedImage.url}
          altText={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
