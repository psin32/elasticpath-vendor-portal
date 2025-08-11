"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useEpccApi } from "../../hooks/useEpccApi";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageOverlay } from "../../components/ui/ImageOverlay";
import { useDashboard } from "../../hooks/useDashboard";
import { PcmProduct } from "@elasticpath/js-sdk";

export default function ProductsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<PcmProduct[]>([]);
  const [mainImages, setMainImages] = useState<Record<string, any>>({});
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20,
  });

  // Use the same dashboard state management
  const { selectedOrgId, selectedStoreId, handleOrgSelect, handleStoreSelect } =
    useDashboard();

  const { fetchProducts } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  // Initialize pagination from URL params on mount
  useEffect(() => {
    const urlPage = searchParams.get("page");
    const urlLimit = searchParams.get("limit");

    if (urlPage) {
      setCurrentPage(parseInt(urlPage));
    }
    if (urlLimit) {
      setPaginationInfo((prev) => ({ ...prev, per_page: parseInt(urlLimit) }));
    }
  }, [searchParams]);

  // Fetch products when org/store changes
  useEffect(() => {
    if (selectedOrgId && selectedStoreId) {
      loadProducts();
    }
  }, [selectedOrgId, selectedStoreId, currentPage, paginationInfo.per_page]);

  const loadProducts = async () => {
    if (!selectedOrgId || !selectedStoreId) return;

    setProductsLoading(true);
    setError(null);

    try {
      const productsData = await fetchProducts({
        limit: paginationInfo.per_page,
        offset: (currentPage - 1) * paginationInfo.per_page,
      });

      if (productsData) {
        const productsArray = productsData?.data || [];
        setProducts(productsArray);

        // Process main images if available
        if (productsData.included && "main_images" in productsData.included) {
          const imageMap: Record<string, any> = {};
          (productsData.included as any).main_images.forEach((image: any) => {
            if (image.id) {
              imageMap[image.id] = image;
            }
          });
          setMainImages(imageMap);
        }

        const totalCount = productsData.meta?.results?.total || 0;
        const totalPages = Math.ceil(totalCount / paginationInfo.per_page);

        setPaginationInfo({
          current_page: currentPage,
          total_pages: totalPages,
          total_count: totalCount,
          per_page: paginationInfo.per_page,
        });
      }
    } catch (err) {
      setError("Failed to load products");
      console.error("Error loading products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Update URL with pagination params
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", paginationInfo.per_page.toString());
    router.push(`/products?${params.toString()}`);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.attributes.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.attributes.sku?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      )
  );

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
      {selectedImage && (
        <ImageOverlay
          imageUrl={selectedImage.url}
          altText={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}
      <div className="flex flex-1">
        <main className="flex-1 overflow-auto bg-white">
          <div className="p-6 bg-white">
            <div className="w-full">
              {/* Search and Controls */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={loadProducts}
                      disabled={
                        !selectedOrgId || !selectedStoreId || productsLoading
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      {productsLoading ? "Loading..." : "Refresh"}
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

              {/* Products List */}
              {productsLoading ? (
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
                  <p className="mt-2 text-gray-600">Loading products...</p>
                </div>
              ) : !selectedOrgId || !selectedStoreId ? (
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
                          Please select an organization and store to view
                          products
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No products found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "Get started by creating a new product."}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Products
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Manage your product catalog
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {(() => {
                                    const imageId =
                                      product.relationships?.main_image?.data
                                        ?.id;
                                    return imageId &&
                                      mainImages[imageId]?.link?.href ? (
                                      <img
                                        className="h-10 w-10 rounded-lg object-cover cursor-pointer hover:opacity-75 transition-opacity"
                                        src={mainImages[imageId].link.href}
                                        alt={product.attributes.name}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedImage({
                                            url: mainImages[imageId].link.href,
                                            alt: product.attributes.name,
                                          });
                                        }}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <svg
                                          className="h-6 w-6 text-indigo-600"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="ml-4">
                                  <div
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900 cursor-pointer"
                                    onClick={() =>
                                      router.push(`/products/${product.id}`)
                                    }
                                  >
                                    {product.attributes.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-mono">
                                {product.attributes.sku}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-sm capitalize ${
                                  product.attributes.status === "live"
                                    ? "bg-green-100 text-green-800"
                                    : product.attributes.status === "draft"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {product.attributes.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 capitalize">
                                {product.attributes.commodity_type}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {paginationInfo.total_pages > 1 && (
                <div className="mt-4 text-sm text-gray-500">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === paginationInfo.total_pages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Showing{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * paginationInfo.per_page + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(
                            currentPage * paginationInfo.per_page,
                            paginationInfo.total_count
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {paginationInfo.total_count}
                        </span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        {/* Page Numbers */}
                        {(() => {
                          const totalPages = paginationInfo.total_pages;
                          const current = currentPage;
                          const pages = [];

                          // Always show first page
                          pages.push(1);

                          if (totalPages <= 7) {
                            // If 7 or fewer pages, show all pages
                            for (let i = 2; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // Show ellipsis and current page range
                            if (current <= 4) {
                              // Near the beginning
                              for (let i = 2; i <= 5; i++) {
                                pages.push(i);
                              }
                              pages.push("...");
                              pages.push(totalPages);
                            } else if (current >= totalPages - 3) {
                              // Near the end
                              pages.push("...");
                              for (
                                let i = totalPages - 4;
                                i <= totalPages;
                                i++
                              ) {
                                pages.push(i);
                              }
                            } else {
                              // In the middle
                              pages.push("...");
                              for (let i = current - 1; i <= current + 1; i++) {
                                pages.push(i);
                              }
                              pages.push("...");
                              pages.push(totalPages);
                            }
                          }

                          return pages.map((page, index) => {
                            if (page === "...") {
                              return (
                                <span
                                  key={`ellipsis-${index}`}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                >
                                  ...
                                </span>
                              );
                            }

                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page as number)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          });
                        })()}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === paginationInfo.total_pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </nav>
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
