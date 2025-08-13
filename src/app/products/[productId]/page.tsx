"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useEpccApi } from "../../../hooks/useEpccApi";
import { useDashboard } from "../../../hooks/useDashboard";

import { ProductInventory } from "../../../components/products/ProductInventory";
import { ProductAttributes } from "../../../components/products/ProductAttributes";
import { ProductForm } from "../../../components/products/ProductForm";
import { ProductPricing } from "../../../components/products/ProductPricing";
import { ProductCategories } from "../../../components/products/ProductCategories";
import { PcmProduct, PcmProductResponse } from "@elasticpath/js-sdk";

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<PcmProductResponse | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "details" | "attributes" | "inventory" | "pricing" | "categories"
  >("details");

  // Use the same dashboard state management
  const { selectedOrgId, selectedStoreId, handleOrgSelect, handleStoreSelect } =
    useDashboard();

  const { fetchProduct, updateProduct } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );

  const handleEditSuccess = (updatedProduct: PcmProduct) => {
    setSuccess("Product updated successfully!");
    // Refresh the product data
    if (productId) {
      const loadProduct = async () => {
        try {
          setProductLoading(true);
          setError(null);
          const productsData = await fetchProduct(productId);
          if (productsData) {
            setProduct(productsData);
          }
        } catch (err) {
          setError("Failed to reload product");
          console.error("Error reloading product:", err);
        } finally {
          setProductLoading(false);
        }
      };
      loadProduct();
    }
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleEditCancel = () => {
    // For edit mode, cancel just clears any success/error messages
    setSuccess(null);
    setError(null);
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setProductLoading(true);
        setError(null);
        const productsData = await fetchProduct(productId);
        const foundProduct = productsData?.data;

        if (foundProduct) {
          setProduct(productsData);
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
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/products")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                      Product ID: {product.data.id}
                    </p>
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
                    onClick={() => setActiveTab("attributes")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "attributes"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Attributes
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
                  </button>
                  <button
                    onClick={() => setActiveTab("categories")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "categories"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Categories
                  </button>
                  <button
                    onClick={() => setActiveTab("pricing")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "pricing"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Pricing
                  </button>
                </nav>
              </div>
              {activeTab === "details" && (
                <ProductForm
                  mode="edit"
                  product={product}
                  productId={product.data.id}
                  selectedOrgId={selectedOrgId || undefined}
                  selectedStoreId={selectedStoreId || undefined}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                />
              )}
              {/* Tab Content */}
              {activeTab === "attributes" && (
                <div className="mt-8">
                  <ProductAttributes
                    productId={productId}
                    selectedOrgId={selectedOrgId || undefined}
                    selectedStoreId={selectedStoreId || undefined}
                  />
                </div>
              )}

              {activeTab === "inventory" && (
                <div className="mt-8">
                  <ProductInventory
                    productId={productId}
                    productSku={product?.data.attributes?.sku || undefined}
                    selectedOrgId={selectedOrgId || undefined}
                    selectedStoreId={selectedStoreId || undefined}
                  />
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="mt-8">
                  <ProductPricing
                    productSku={product?.data.attributes?.sku || undefined}
                    selectedOrgId={selectedOrgId || undefined}
                    selectedStoreId={selectedStoreId || undefined}
                  />
                </div>
              )}
              {activeTab === "categories" && (
                <div className="mt-8">
                  <ProductCategories
                    productId={productId}
                    selectedOrgId={selectedOrgId || undefined}
                    selectedStoreId={selectedStoreId || undefined}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
