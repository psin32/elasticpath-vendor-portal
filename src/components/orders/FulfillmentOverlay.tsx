"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useToast } from "../../contexts/ToastContext";
import { OrderItem } from "@elasticpath/js-sdk";

interface FulfillmentItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  fulfilledQuantity: number;
  availableQuantity: number;
  selectedQuantity: number;
  price?: string;
}

interface FulfillmentData {
  id: string;
  items: Array<{
    id: string;
    quantity: number;
  }>;
  tracking_reference?: string;
  shipping_method?: string;
  notes?: string;
  status: string;
  created_at: string;
}

interface FulfillmentOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderItems: OrderItem[];
  existingFulfillments: FulfillmentData[];
  onCreateFulfillment: (
    orderId: string,
    fulfillmentData: {
      items: Array<{
        id: string;
        quantity: number;
      }>;
      tracking_reference?: string;
      shipping_method?: string;
      notes?: string;
    }
  ) => Promise<any>;
  onGeneratePackingSlip: (
    orderId: string,
    fulfillmentId: string
  ) => Promise<any>;
}

const FulfillmentOverlay: React.FC<FulfillmentOverlayProps> = ({
  isOpen,
  onClose,
  orderId,
  orderItems,
  existingFulfillments,
  onCreateFulfillment,
  onGeneratePackingSlip,
}) => {
  const [fulfillmentItems, setFulfillmentItems] = useState<FulfillmentItem[]>(
    []
  );
  const [trackingReference, setTrackingReference] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingSlip, setGeneratingSlip] = useState<string | null>(null);

  const { showToast } = useToast();

  // Calculate fulfilled quantities from existing fulfillments
  const fulfilledQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};

    existingFulfillments.forEach((fulfillment) => {
      fulfillment.items.forEach((item) => {
        quantities[item.id] = (quantities[item.id] || 0) + item.quantity;
      });
    });

    return quantities;
  }, [existingFulfillments]);

  // Initialize fulfillment items when overlay opens
  useEffect(() => {
    if (isOpen && orderItems.length > 0) {
      const items: FulfillmentItem[] = orderItems.map((item) => {
        const fulfilledQty = fulfilledQuantities[item.id] || 0;
        const availableQty = (item.quantity || 1) - fulfilledQty;

        return {
          id: item.id,
          name: item.name || `Item ${item.id}`,
          sku: item.sku,
          quantity: item.quantity || 1,
          fulfilledQuantity: fulfilledQty,
          availableQuantity: Math.max(0, availableQty),
          selectedQuantity: 0,
          price: item.meta?.display_price?.with_tax?.value?.formatted,
        };
      });

      // Filter out fully fulfilled items
      setFulfillmentItems(items.filter((item) => item.availableQuantity > 0));
    }
  }, [isOpen, orderItems, fulfilledQuantities]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setFulfillmentItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              selectedQuantity: Math.min(
                Math.max(0, quantity),
                item.availableQuantity
              ),
            }
          : item
      )
    );
  };

  const handleSelectAll = () => {
    setFulfillmentItems((items) =>
      items.map((item) => ({
        ...item,
        selectedQuantity: item.availableQuantity,
      }))
    );
  };

  const handleDeselectAll = () => {
    setFulfillmentItems((items) =>
      items.map((item) => ({ ...item, selectedQuantity: 0 }))
    );
  };

  const selectedItems = fulfillmentItems.filter(
    (item) => item.selectedQuantity > 0
  );
  const totalSelectedItems = selectedItems.length;
  const totalSelectedQuantity = selectedItems.reduce(
    (sum, item) => sum + item.selectedQuantity,
    0
  );

  const handleCreateFulfillment = async () => {
    if (selectedItems.length === 0) {
      showToast("Please select at least one item to fulfill", "error");
      return;
    }

    try {
      setLoading(true);

      const fulfillmentData = {
        items: selectedItems.map((item) => ({
          id: item.id,
          quantity: item.selectedQuantity,
        })),
        tracking_reference: trackingReference.trim() || undefined,
        shipping_method: shippingMethod.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onCreateFulfillment(orderId, fulfillmentData);
      showToast("Fulfillment created successfully", "success");

      // Reset form
      setTrackingReference("");
      setShippingMethod("");
      setNotes("");
      handleDeselectAll();
      onClose();
    } catch (error) {
      console.error("Error creating fulfillment:", error);
      showToast("Failed to create fulfillment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePackingSlip = async (fulfillmentId: string) => {
    try {
      setGeneratingSlip(fulfillmentId);
      const response = await onGeneratePackingSlip(orderId, fulfillmentId);

      // If the response contains a PDF URL or blob, open it
      if (response?.data?.url) {
        window.open(response.data.url, "_blank");
      } else if (response?.data) {
        // Create blob URL for PDF data
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
        window.URL.revokeObjectURL(url);
      }

      showToast("Packing slip generated successfully", "success");
    } catch (error) {
      console.error("Error generating packing slip:", error);
      showToast("Failed to generate packing slip", "error");
    } finally {
      setGeneratingSlip(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Create Fulfillment - Order #{orderId}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            {fulfillmentItems.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  All items fulfilled
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  All items in this order have been completely fulfilled.
                </p>
              </div>
            ) : (
              <>
                {/* Selection Controls */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">
                    {totalSelectedItems} items selected ({totalSelectedQuantity}{" "}
                    units)
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-gray-600 hover:text-gray-500"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {fulfillmentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-gray-400"
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
                          {item.name}
                        </p>
                        {item.sku && (
                          <p className="text-xs text-gray-500">
                            SKU: {item.sku}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            Total: {item.quantity}
                          </span>
                          <span className="text-xs text-gray-500">
                            Fulfilled: {item.fulfilledQuantity}
                          </span>
                          <span className="text-xs text-green-600 font-medium">
                            Available: {item.availableQuantity}
                          </span>
                        </div>
                        {item.price && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.price}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">
                          Fulfill:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.availableQuantity}
                          value={item.selectedQuantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <span className="text-sm text-gray-500">
                          / {item.availableQuantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Fulfillment Details Form */}
          {fulfillmentItems.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Fulfillment Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Reference
                  </label>
                  <input
                    type="text"
                    value={trackingReference}
                    onChange={(e) => setTrackingReference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Method
                  </label>
                  <input
                    type="text"
                    value={shippingMethod}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., FedEx Ground, UPS Next Day"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Additional notes for this fulfillment"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Existing Fulfillments */}
          {existingFulfillments.length > 0 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Existing Fulfillments
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {existingFulfillments.map((fulfillment) => (
                  <div
                    key={fulfillment.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {fulfillment.items.length} items
                        </span>
                        <span className="text-xs text-gray-500">
                          (
                          {fulfillment.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}{" "}
                          units)
                        </span>
                        {fulfillment.tracking_reference && (
                          <span className="text-xs text-gray-500">
                            • {fulfillment.tracking_reference}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(fulfillment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleGeneratePackingSlip(fulfillment.id)}
                      disabled={generatingSlip === fulfillment.id}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {generatingSlip === fulfillment.id
                        ? "Generating..."
                        : "Packing Slip"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              onClick={handleCreateFulfillment}
              disabled={loading || selectedItems.length === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Creating..."
                : `Create Fulfillment (${totalSelectedQuantity} items)`}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FulfillmentOverlay;
