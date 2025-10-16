"use client";

import React, { useState, useMemo } from "react";
import { Order, OrderItem } from "@elasticpath/js-sdk";
import { OrderItemPromotions } from "./OrderItemPromotions";
import FulfillmentOverlay from "./FulfillmentOverlay";
import OrderFulfillmentTab from "./OrderFulfillmentTab";
import AdditionalInfoAccordion from "./AdditionalInfoAccordion";
import CustomInputsAccordion from "./CustomInputsAccordion";
import OrderNotes from "./OrderNotes";
import {
  generateAndDownloadPackingSlip,
  type PackingSlipData,
} from "../../utils/clientPackingSlipGenerator";
import { generateAndDownloadShippingLabel } from "../../utils/clientShippingLabelGenerator";
import { type ShippingLabelData } from "../../templates/shippingLabelTemplate";

interface OrderDetailsProps {
  order: Order;
  orderItems: OrderItem[];
  promotions: any[];
  shippingGroups: any[];
  fulfillments: any[];
  loading?: boolean;
  onBack?: () => void;
  onCreateFulfillment?: (orderId: string, fulfillmentData: any) => Promise<any>;
  onCheckOrderFulfillmentAPI?: () => Promise<any>;
  onCreateOrderFulfillmentAPI?: () => Promise<any>;
  onFulfilOrder?: (orderId: string) => Promise<any>;
  showBackButton?: boolean;
  backButtonText?: string;
}

export default function OrderDetails({
  order,
  orderItems,
  promotions,
  shippingGroups,
  fulfillments,
  loading = false,
  onBack,
  onCreateFulfillment,
  onCheckOrderFulfillmentAPI,
  onCreateOrderFulfillmentAPI,
  onFulfilOrder,
  showBackButton = true,
  backButtonText = "Back to Orders",
}: OrderDetailsProps) {
  const [showFulfillmentOverlay, setShowFulfillmentOverlay] = useState(false);
  const [generatingPackingSlip, setGeneratingPackingSlip] = useState<
    string | null
  >(null);
  const [generatingShippingLabel, setGeneratingShippingLabel] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "fulfillment" | "notes"
  >("details");

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

  // Check if all items are fully fulfilled
  const isOrderFullyFulfilled = useMemo(() => {
    if (orderItems.length === 0 || fulfillments.length === 0) return false;

    // Calculate total fulfilled quantities per item
    const fulfilledQuantities: Record<string, number> = {};
    fulfillments.forEach((fulfillment) => {
      fulfillment.items.forEach((item: any) => {
        fulfilledQuantities[item.id] =
          (fulfilledQuantities[item.id] || 0) + item.quantity;
      });
    });

    // Check if all items have their full quantities fulfilled
    return orderItems.every((orderItem) => {
      const fulfilledQty = fulfilledQuantities[orderItem.id] || 0;
      const totalQty = orderItem.quantity || 1;
      return fulfilledQty >= totalQty;
    });
  }, [orderItems, fulfillments]);

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

  const handleGeneratePackingSlip = async (fulfillment: any) => {
    if (!order) return;

    // Set loading state for this specific fulfillment
    setGeneratingPackingSlip(fulfillment.id);

    const packingSlipData: PackingSlipData = {
      order: {
        id: order.external_ref || order.id,
        status: order.status,
        payment: order.payment,
        meta: order.meta,
      },
      fulfillment: {
        id: fulfillment.id,
        tracking_reference: fulfillment.tracking_reference,
        shipping_method: fulfillment.shipping_method,
        notes: fulfillment.notes,
        created_at: fulfillment.created_at,
        items: fulfillment.items,
      },
      orderItems: orderItems,
      companyInfo: {
        name: "Your Company Name",
        address: "123 Business St, City, State 12345",
        phone: "+1 (555) 123-4567",
        email: "contact@yourcompany.com",
      },
      shippingAddress: order.shipping_address,
    };

    try {
      await generateAndDownloadPackingSlip(packingSlipData);
    } catch (error) {
      console.error("Error generating packing slip:", error);
      // You might want to show a toast notification here
    } finally {
      // Clear loading state
      setGeneratingPackingSlip(null);
    }
  };

  const handleGenerateShippingLabel = async (fulfillment: any) => {
    if (!order || !fulfillment.tracking_reference) return;

    // Set loading state for this specific fulfillment
    setGeneratingShippingLabel(fulfillment.id);

    const shippingLabelData: ShippingLabelData = {
      order: {
        id: order.external_ref || order.id,
        status: order.status,
        payment: order.payment,
        meta: order.meta,
      },
      fulfillment: {
        id: fulfillment.id,
        tracking_reference: fulfillment.tracking_reference,
        shipping_method: fulfillment.shipping_method,
        notes: fulfillment.notes,
        created_at: fulfillment.created_at,
        items: fulfillment.items,
      },
      orderItems: orderItems,
      companyInfo: {
        name: "Your Company Name",
        address: "123 Business St, City, State 12345",
        phone: "+1 (555) 123-4567",
        email: "contact@yourcompany.com",
      },
      shippingAddress: order.shipping_address,
    };

    try {
      await generateAndDownloadShippingLabel(shippingLabelData);
    } catch (error) {
      console.error("Error generating shipping label:", error);
      // You might want to show a toast notification here
    } finally {
      // Clear loading state
      setGeneratingShippingLabel(null);
    }
  };

  if (loading) {
    return (
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
    );
  }

  if (!order) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {showBackButton && onBack && (
        <div className="mb-6">
          <button
            onClick={onBack}
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
            {backButtonText}
          </button>
        </div>
      )}

      {/* Order Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.id}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Created on {formatDate(order.meta.timestamps.created_at)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {order.status.toLowerCase() === "complete" ? (
              <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Complete
              </span>
            ) : (
              <span
                className={`inline-flex px-4 py-2 text-sm font-semibold rounded-md capitalize ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            )}
            {order.payment.toLowerCase() === "paid" ? (
              <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Paid
              </span>
            ) : (
              <span
                className={`inline-flex px-4 py-2 text-sm font-semibold rounded-md capitalize ${getPaymentStatusColor(
                  order.payment
                )}`}
              >
                {order.payment}
              </span>
            )}
            {order?.shipping?.toLowerCase() === "fulfilled" ||
            isOrderFullyFulfilled ? (
              <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Fulfilled
              </span>
            ) : (
              onCreateFulfillment && (
                <button
                  onClick={() => setShowFulfillmentOverlay(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Fulfillment
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "details"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Order Details
          </button>
          <button
            onClick={() => setActiveTab("fulfillment")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "fulfillment"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Fulfillment
            {fulfillments.length > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2 rounded-full text-xs">
                {fulfillments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "notes"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Notes
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "details" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <div key={groupId} className="divide-y divide-gray-200">
                          {/* Shipping Group Header */}
                          {groupId !== "__no_group__" && shippingGroup && (
                            <div className="px-6 py-4 bg-gray-50">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-medium text-gray-900">
                                    Shipping Group
                                  </h3>
                                  <span className="text-xs text-gray-500">
                                    {shippingGroup.created_at
                                      ? formatDate(shippingGroup.created_at)
                                      : ""}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                  {shippingGroup.shipping_type && (
                                    <span>
                                      Type:{" "}
                                      <span className="font-medium text-gray-900">
                                        {shippingGroup.shipping_type}
                                      </span>
                                    </span>
                                  )}
                                  {shippingGroup.meta?.shipping_display_price
                                    ?.total?.formatted && (
                                    <span>
                                      Shipping:{" "}
                                      <span className="font-medium text-gray-900">
                                        {
                                          shippingGroup.meta
                                            .shipping_display_price.total
                                            .formatted
                                        }
                                      </span>
                                    </span>
                                  )}
                                  {shippingGroup.tracking_reference && (
                                    <span>
                                      Tracking:{" "}
                                      <span className="font-medium text-gray-900">
                                        {shippingGroup.tracking_reference}
                                      </span>
                                    </span>
                                  )}
                                  {shippingGroup.address && (
                                    <span className="text-sm text-gray-600">
                                      {[
                                        shippingGroup.address.first_name +
                                          " " +
                                          shippingGroup.address.last_name,
                                        shippingGroup.address.line_1,
                                        shippingGroup.address.line_2,
                                        shippingGroup.address.city,
                                        shippingGroup.address.region,
                                        shippingGroup.address.postcode,
                                        shippingGroup.address.country,
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
                                      item.meta?.display_price?.with_tax?.value
                                        .formatted
                                    }
                                  </p>
                                  {item.meta?.display_price?.without_discount
                                    ?.value.amount !==
                                    item.meta?.display_price?.with_tax?.value
                                      .amount && (
                                    <p className="text-sm text-gray-500 line-through">
                                      {
                                        item.meta?.display_price
                                          ?.without_discount?.value.formatted
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                              {/* Additional Information */}
                              <AdditionalInfoAccordion
                                additionalInfo={
                                  item?.custom_inputs?.additional_information ||
                                  []
                                }
                              />

                              {/* Other Custom Inputs */}
                              <CustomInputsAccordion
                                customInputs={item?.custom_inputs || {}}
                                excludeKeys={["additional_information"]}
                              />
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
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-medium">
                    {order.meta.display_price.without_tax.formatted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping</span>
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
                    <span className="text-sm text-gray-600">Discount</span>
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
                    <p className="text-sm font-medium text-gray-900">Name</p>
                    <p className="text-sm text-gray-600">
                      {order.contact.name}
                    </p>
                  </div>
                )}
                {order.contact?.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">
                      {order.contact.email}
                    </p>
                  </div>
                )}
                {/* Only show shipping address if no shipping groups exist */}
                {order.shipping_address && shippingGroups.length === 0 && (
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
      ) : activeTab === "fulfillment" ? (
        /* Fulfillment Tab */
        <OrderFulfillmentTab
          order={order}
          orderItems={orderItems}
          fulfillments={fulfillments}
          isOrderFullyFulfilled={isOrderFullyFulfilled}
          showFulfillmentOverlay={showFulfillmentOverlay}
          setShowFulfillmentOverlay={setShowFulfillmentOverlay}
          generatingPackingSlip={generatingPackingSlip}
          generatingShippingLabel={generatingShippingLabel}
          handleGeneratePackingSlip={handleGeneratePackingSlip}
          handleGenerateShippingLabel={handleGenerateShippingLabel}
        />
      ) : (
        /* Notes Tab */
        <OrderNotes orderId={order.id} />
      )}

      {/* Fulfillment Overlay */}
      {onCreateFulfillment && (
        <FulfillmentOverlay
          isOpen={showFulfillmentOverlay}
          onClose={() => setShowFulfillmentOverlay(false)}
          orderId={order.id}
          orderItems={orderItems}
          existingFulfillments={fulfillments}
          onCreateFulfillment={onCreateFulfillment}
          onCheckOrderFulfillmentAPI={
            onCheckOrderFulfillmentAPI ||
            (() => Promise.resolve({ exists: false }))
          }
          onCreateOrderFulfillmentAPI={
            onCreateOrderFulfillmentAPI || (() => Promise.resolve({}))
          }
        />
      )}
    </div>
  );
}
