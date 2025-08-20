"use client";

import React from "react";
import { Order, OrderItem } from "@elasticpath/js-sdk";

interface OrderFulfillmentTabProps {
  order: Order;
  orderItems: OrderItem[];
  fulfillments: any[];
  isOrderFullyFulfilled: boolean;
  showFulfillmentOverlay: boolean;
  setShowFulfillmentOverlay: (show: boolean) => void;
  generatingPackingSlip: string | null;
  generatingShippingLabel: string | null;
  handleGeneratePackingSlip: (fulfillment: any) => void;
  handleGenerateShippingLabel: (fulfillment: any) => void;
}

export default function OrderFulfillmentTab({
  order,
  orderItems,
  fulfillments,
  isOrderFullyFulfilled,
  showFulfillmentOverlay,
  setShowFulfillmentOverlay,
  generatingPackingSlip,
  generatingShippingLabel,
  handleGeneratePackingSlip,
  handleGenerateShippingLabel,
}: OrderFulfillmentTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Fulfillment Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Order Fulfillments
              </h2>
              <p className="text-sm text-gray-600">
                {fulfillments.length === 0
                  ? "No fulfillments yet"
                  : `${fulfillments.length} fulfillment${
                      fulfillments.length !== 1 ? "s" : ""
                    } • ${fulfillments.reduce(
                      (total, f) =>
                        total +
                        f.items.reduce(
                          (sum: number, item: any) => sum + item.quantity,
                          0
                        ),
                      0
                    )} items fulfilled`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {fulfillments.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No fulfillments yet
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Create your first fulfillment to start shipping items from this
                order to your customers.
              </p>
              <button
                onClick={() => setShowFulfillmentOverlay(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Fulfillment
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {fulfillments.map((fulfillment, index) => (
                <div
                  key={fulfillment.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Fulfillment Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              Fulfillment {fulfillment.id}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Created {formatDate(fulfillment.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            handleGeneratePackingSlip(fulfillment);
                          }}
                          disabled={generatingPackingSlip === fulfillment.id}
                          className={`inline-flex items-center px-3 py-1.5 text-white text-xs font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                            generatingPackingSlip === fulfillment.id
                              ? "bg-blue-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {generatingPackingSlip === fulfillment.id ? (
                            <>
                              <svg
                                className="animate-spin w-3 h-3 mr-1.5"
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
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3 h-3 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Packing Slip
                            </>
                          )}
                        </button>

                        {/* Shipping Label Button - Only show if tracking reference exists */}
                        {fulfillment.tracking_reference && (
                          <button
                            onClick={() => {
                              handleGenerateShippingLabel(fulfillment);
                            }}
                            disabled={
                              generatingShippingLabel === fulfillment.id
                            }
                            className={`inline-flex items-center px-3 py-1.5 text-white text-xs font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 ${
                              generatingShippingLabel === fulfillment.id
                                ? "bg-green-400 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {generatingShippingLabel === fulfillment.id ? (
                              <>
                                <svg
                                  className="animate-spin w-3 h-3 mr-1.5"
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
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Generating...
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-3 h-3 mr-1.5"
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
                                Shipping Label
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fulfillment Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5 p-6">
                    {/* Tracking Information */}
                    {fulfillment.tracking_reference && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg
                            className="w-4 h-4 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <h6 className="text-sm font-medium text-gray-900">
                            Tracking
                          </h6>
                        </div>
                        <p className="text-sm text-gray-600 font-mono">
                          {fulfillment.tracking_reference}
                        </p>
                      </div>
                    )}

                    {/* Shipping Method */}
                    {fulfillment.shipping_method && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <h6 className="text-sm font-medium text-gray-900">
                            Shipping Method
                          </h6>
                        </div>
                        <p className="text-sm text-gray-600">
                          {fulfillment.shipping_method}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {fulfillment.notes && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg
                            className="w-4 h-4 text-yellow-500"
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
                          <h6 className="text-sm font-medium text-gray-900">
                            Notes
                          </h6>
                        </div>
                        <p className="text-sm text-gray-600">
                          {fulfillment.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="border-t border-gray-200">
                    <div className="px-6 py-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">
                        Fulfilled Items
                      </h5>
                      <div className="divide-y divide-gray-100">
                        {fulfillment.items.map(
                          (item: any, itemIndex: number) => {
                            const orderItem = orderItems.find(
                              (oi) => oi.id === item.id
                            );
                            return (
                              <div
                                key={itemIndex}
                                className="py-3 flex justify-between items-center"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {orderItem?.name || "Unknown Item"}
                                  </p>
                                  {orderItem?.sku && (
                                    <p className="text-xs text-gray-500">
                                      SKU: {orderItem.sku}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    Qty: {item.quantity}
                                  </p>
                                  {orderItem?.unit_price && (
                                    <p className="text-xs text-gray-500">
                                      {`${orderItem.unit_price.currency} ${
                                        orderItem.unit_price.amount / 100
                                      }`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
