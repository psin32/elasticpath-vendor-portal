"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useEpccApi } from "../../hooks/useEpccApi";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboard } from "../../hooks/useDashboard";
import { Order } from "@elasticpath/js-sdk";
import { useToast } from "@/contexts/ToastContext";
import OrdersList from "@/components/orders/OrdersList";

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
  const [currentPage, setCurrentPage] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 25,
  });
  const { showToast } = useToast();

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
      showToast("Failed to load orders", "error");
      console.error("Error loading orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Update URL with pagination params
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", paginationInfo.per_page.toString());
    router.push(`/orders?${params.toString()}`);
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
              {!selectedStoreId ? (
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
              ) : (
                <OrdersList
                  orders={orders}
                  loading={ordersLoading}
                  onRefresh={loadOrders}
                  onPageChange={handlePageChange}
                  paginationInfo={paginationInfo}
                  title="Orders"
                  subtitle="Manage your orders"
                  emptyMessage="No orders found"
                  emptySubMessage="Get started by creating a new order."
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
