"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useEpccApi } from "../../../hooks/useEpccApi";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "../../../components/layout/DashboardHeader";
import { SidebarNavigation } from "../../../components/layout/SidebarNavigation";
import { useDashboard } from "../../../hooks/useDashboard";
import { Order, OrderItem } from "@elasticpath/js-sdk";
import { OrderItemPromotions } from "../../../components/orders/OrderItemPromotions";
import FulfillmentOverlay from "../../../components/orders/FulfillmentOverlay";

interface OrderDetailsPageProps {
  params: {
    orderId: string;
  };
}

// Type guard to ensure compatibility
const isOrder = (obj: any): obj is Order => {
  return obj && obj.id && typeof obj.id === "string";
};

// Cast function to handle SDK type mismatch
const castToOrder = (sdkOrder: any): Order => {
  return sdkOrder as Order;
};

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = params;
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [shippingGroups, setShippingGroups] = useState<any[]>([]);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFulfillmentOverlay, setShowFulfillmentOverlay] = useState(false);

  // Group items by shipping group
  const itemsByShippingGroup = useMemo(() => {
    const groups: Record<string, OrderItem[]> = {};
    orderItems.forEach((item) => {
      const groupId = item.shipping_group_id || "__no_group__";
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(item);
    });
    return groups;
  }, [orderItems]);

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

  const {
    fetchOrder,
    fetchShippingGroups,
    createFulfillment,
    fetchFulfillments,
    generatePackingSlip,
  } = useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  // Fetch order when org/store changes
  useEffect(() => {
    if (selectedStoreId && orderId) {
      loadOrder();
    }
  }, [selectedOrgId, selectedStoreId, orderId]);

  const loadOrder = async () => {
    if (!selectedStoreId || !orderId) return;

    setOrderLoading(true);
    setError(null);

    try {
      // Fetch order details
      const orderData = await fetchOrder(orderId);
      if (orderData) {
        setOrder(orderData.data);

        // Extract order items if available, excluding promotion_items
        if (orderData.included?.items) {
          const items = orderData.included?.items
            .filter((item: any) => item.type !== "promotion_item")
            .map((item: any) => item as OrderItem);
          setOrderItems(items);
        }

        // Extract promotions if available
        if (orderData.included && "promotions" in orderData.included) {
          setPromotions((orderData.included as any).promotions || []);
        }

        // Fetch shipping groups
        try {
          const shippingGroupsData = await fetchShippingGroups(orderId);
          setShippingGroups(shippingGroupsData.data || []);
        } catch (err) {
          console.warn("Failed to fetch shipping groups:", err);
          setShippingGroups([]);
        }

        // Fetch fulfillments
        try {
          const fulfillmentsData = await fetchFulfillments(orderId);
          setFulfillments(fulfillmentsData.data || []);
        } catch (err) {
          console.warn("Failed to fetch fulfillments:", err);
          setFulfillments([]);
        }
      }
    } catch (err) {
      setError("Failed to load order details");
      console.error("Error loading order:", err);
    } finally {
      setOrderLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
              {/* Back Button */}
              <div className="mb-6">
                <button
                  onClick={() => router.push("/orders")}
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
                  Back to Orders
                </button>
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
              {orderLoading ? (
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
                  <p className="mt-2 text-gray-600">Loading order details...</p>
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
                          Please select an organization and store to view order
                          details
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !order ? (
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
                    Order not found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    The order you're looking for doesn't exist or you don't have
                    permission to view it.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Order Header */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          Order #{order.id}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                          Created on{" "}
                          {formatDate(order.meta.timestamps.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowFulfillmentOverlay(true)}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Create Fulfillment
                        </button>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(
                            order.payment
                          )}`}
                        >
                          {order.payment}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h2 className="text-lg font-medium text-gray-900">
                            Order Items
                          </h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {orderItems.length > 0 ? (
                            Object.entries(itemsByShippingGroup).map(
                              ([groupId, items]) => {
                                const shippingGroup = shippingGroups.find(
                                  (g) => g.id === groupId
                                );
                                return (
                                  <div
                                    key={groupId}
                                    className="divide-y divide-gray-200"
                                  >
                                    {/* Shipping Group Header */}
                                    {groupId !== "__no_group__" &&
                                      shippingGroup && (
                                        <div className="px-6 py-4 bg-gray-50">
                                          <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                              <h3 className="text-sm font-medium text-gray-900">
                                                Shipping Group
                                              </h3>
                                              <span className="text-xs text-gray-500">
                                                {shippingGroup.created_at
                                                  ? formatDate(
                                                      shippingGroup.created_at
                                                    )
                                                  : ""}
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                              {shippingGroup.shipping_type && (
                                                <span>
                                                  Type:{" "}
                                                  <span className="font-medium text-gray-900">
                                                    {
                                                      shippingGroup.shipping_type
                                                    }
                                                  </span>
                                                </span>
                                              )}
                                              {shippingGroup.meta
                                                ?.shipping_display_price?.total
                                                ?.formatted && (
                                                <span>
                                                  Shipping:{" "}
                                                  <span className="font-medium text-gray-900">
                                                    {
                                                      shippingGroup.meta
                                                        .shipping_display_price
                                                        .total.formatted
                                                    }
                                                  </span>
                                                </span>
                                              )}
                                              {shippingGroup.tracking_reference && (
                                                <span>
                                                  Tracking:{" "}
                                                  <span className="font-medium text-gray-900">
                                                    {
                                                      shippingGroup.tracking_reference
                                                    }
                                                  </span>
                                                </span>
                                              )}
                                              {shippingGroup.address && (
                                                <span className="text-sm text-gray-600">
                                                  {[
                                                    shippingGroup.address
                                                      .first_name +
                                                      " " +
                                                      shippingGroup.address
                                                        .last_name,
                                                    shippingGroup.address
                                                      .line_1,
                                                    shippingGroup.address
                                                      .line_2,
                                                    shippingGroup.address.city,
                                                    shippingGroup.address
                                                      .region,
                                                    shippingGroup.address
                                                      .postcode,
                                                    shippingGroup.address
                                                      .country,
                                                  ]
                                                    .filter(Boolean)
                                                    .join(", ")}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    {/* Order Items */}
                                    {items.map((item, index) => (
                                      <div key={index} className="p-6">
                                        <div className="flex items-center space-x-4">
                                          <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                              <svg
                                                className="w-8 h-8 text-gray-400"
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
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                              {item.name || `Item ${index + 1}`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                              Quantity: {item.quantity || 1}
                                            </p>
                                            {item.sku && (
                                              <p className="text-sm text-gray-500">
                                                SKU: {item.sku}
                                              </p>
                                            )}
                                            <OrderItemPromotions
                                              item={item}
                                              promotions={promotions}
                                            />
                                          </div>
                                          <div className="text-right flex flex-col">
                                            <p className="text-sm font-medium text-gray-900">
                                              {
                                                item.meta?.display_price
                                                  ?.with_tax?.value.formatted
                                              }
                                            </p>
                                            {item.meta?.display_price
                                              ?.without_discount?.value
                                              .amount !==
                                              item.meta?.display_price?.with_tax
                                                ?.value.amount && (
                                              <p className="text-sm text-gray-500 line-through">
                                                {
                                                  item.meta?.display_price
                                                    ?.without_discount?.value
                                                    .formatted
                                                }
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            )
                          ) : (
                            <div className="p-6 text-center text-gray-500">
                              No items found for this order
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h2 className="text-lg font-medium text-gray-900">
                            Order Summary
                          </h2>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Subtotal
                            </span>
                            <span className="text-sm font-medium">
                              {order.meta.display_price.without_tax.formatted}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Shipping
                            </span>
                            <span className="text-sm font-medium">
                              {order.meta.display_price.shipping.formatted}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tax</span>
                            <span className="text-sm font-medium">
                              {order.meta.display_price.tax.formatted}
                            </span>
                          </div>
                          {order.meta.display_price.discount.amount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Discount
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                -{order.meta.display_price.discount.formatted}
                              </span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between">
                              <span className="text-base font-medium text-gray-900">
                                Total
                              </span>
                              <span className="text-base font-bold text-gray-900">
                                {order.meta.display_price.with_tax.formatted}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h2 className="text-lg font-medium text-gray-900">
                            Customer Information
                          </h2>
                        </div>
                        <div className="p-6 space-y-3">
                          {order.contact?.name && (
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Name
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.contact.name}
                              </p>
                            </div>
                          )}
                          {order.contact?.email && (
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Email
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.contact.email}
                              </p>
                            </div>
                          )}
                          {/* Only show shipping address if no shipping groups exist */}
                          {order.shipping_address &&
                            shippingGroups.length === 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Shipping Address
                                </p>
                                <p className="text-sm text-gray-600">
                                  {order.shipping_address.first_name}{" "}
                                  {order.shipping_address.last_name}
                                  <br />
                                  {order.shipping_address.line_1}
                                  {order.shipping_address.line_2 && (
                                    <>
                                      <br />
                                      {order.shipping_address.line_2}
                                    </>
                                  )}
                                  <br />
                                  {order.shipping_address.city},{" "}
                                  {order.shipping_address.region}{" "}
                                  {order.shipping_address.postcode}
                                  <br />
                                  {order.shipping_address.country}
                                </p>
                              </div>
                            )}
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

      {/* Fulfillment Overlay */}
      <FulfillmentOverlay
        isOpen={showFulfillmentOverlay}
        onClose={() => setShowFulfillmentOverlay(false)}
        orderId={orderId}
        orderItems={orderItems}
        existingFulfillments={fulfillments}
        onCreateFulfillment={async (orderId, fulfillmentData) => {
          const result = await createFulfillment(orderId, fulfillmentData);
          // Refresh fulfillments after creation
          try {
            const fulfillmentsData = await fetchFulfillments(orderId);
            setFulfillments(fulfillmentsData.data || []);
          } catch (err) {
            console.warn("Failed to refresh fulfillments:", err);
          }
          return result;
        }}
        onGeneratePackingSlip={generatePackingSlip}
      />
    </div>
  );
}
