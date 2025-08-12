"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useEpccApi } from "../../hooks/useEpccApi";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboard } from "../../hooks/useDashboard";
import { Order } from "@elasticpath/js-sdk";

// Type guard to ensure compatibility
const isOrder = (obj: any): obj is Order => {
  return obj && obj.attributes && typeof obj.attributes.number === "string";
};

// Cast function to handle SDK type mismatch
const castToOrder = (sdkOrder: any): Order => {
  return sdkOrder as Order;
};

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export default function OrdersPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 25,
  });

  // Use the same dashboard state management
  const { selectedOrgId, selectedStoreId, handleOrgSelect, handleStoreSelect } =
    useDashboard();

  const { fetchOrders } = useEpccApi(
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

  // Fetch orders when org/store changes or page changes
  useEffect(() => {
    if (selectedStoreId) {
      loadOrders();
    }
  }, [selectedOrgId, selectedStoreId, currentPage, paginationInfo.per_page]);

  const loadOrders = async () => {
    if (!selectedStoreId) return;

    setOrdersLoading(true);
    setError(null);

    try {
      const ordersData = await fetchOrders({
        page: currentPage,
        limit: paginationInfo.per_page,
      });

      if (ordersData) {
        const ordersArray = (ordersData.data || []).map(castToOrder);
        setOrders(ordersArray);
        const totalCount = ordersData.meta?.results?.total || 0;
        const totalPages = Math.ceil(totalCount / paginationInfo.per_page);

        setPaginationInfo({
          current_page: currentPage,
          total_pages: totalPages,
          total_count: totalCount,
          per_page: paginationInfo.per_page,
        });
      }
    } catch (err) {
      setError("Failed to load orders");
      console.error("Error loading orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const filteredOrders = orders.filter(
    (order: any) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.attributes.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Update URL with pagination params
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", paginationInfo.per_page.toString());
    router.push(`/orders?${params.toString()}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
                      placeholder="Search orders by number, email, or status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={loadOrders}
                      disabled={
                        !selectedOrgId || !selectedStoreId || ordersLoading
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      {ordersLoading ? "Loading..." : "Refresh"}
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

              {/* Orders List */}
              {ordersLoading ? (
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
                  <p className="mt-2 text-gray-600">Loading orders...</p>
                </div>
              ) : !selectedStoreId ? (
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
                          Please select an organization and store to view orders
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No orders found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "Get started by creating a new order."}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Orders
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Manage your orders
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900 cursor-pointer font-mono"
                                    onClick={() =>
                                      router.push(`/orders/${order.id}`)
                                    }
                                  >
                                    {order.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.contact?.email || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-sm capitalize ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-sm capitalize ${getPaymentStatusColor(
                                  order.payment
                                )}`}
                              >
                                {order.payment}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {order.meta.display_price.with_tax.formatted}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(order.meta.timestamps.created_at)}
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
