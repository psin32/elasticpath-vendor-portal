"use client";

import { useState, useEffect } from "react";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import { useCartContext } from "@/contexts/CartContext";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { CheckoutCustomerObject, Address } from "@elasticpath/js-sdk";

interface CheckoutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccountToken: string;
  accountId: string;
}

interface AccountAddress {
  id: string;
  type: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  line_1?: string;
  line_2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  phone_number?: string;
  instructions?: string;
  email?: string;
}

export default function CheckoutOverlay({
  isOpen,
  onClose,
  selectedAccountToken,
  accountId,
}: CheckoutOverlayProps) {
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const {
    getAccountAddresses,
    checkoutOrder,
    createManualPayment,
    clearCartItems,
  } = useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);
  const { showToast } = useToast();
  const { cartData, selectedCartId, clearCart } = useCartContext();

  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<AccountAddress | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "purchase_order" | "place_order"
  >("purchase_order");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [impersonationData, setImpersonationData] = useState<any>(null);

  // Load impersonation data and addresses when overlay opens
  useEffect(() => {
    if (isOpen) {
      // Load impersonation data from localStorage
      const storedData = localStorage.getItem("impersonationData");
      if (storedData) {
        try {
          setImpersonationData(JSON.parse(storedData));
        } catch (err) {
          console.error("Failed to parse impersonation data:", err);
        }
      }

      // Load addresses if we have the required data
      if (selectedAccountToken && accountId) {
        loadAddresses();
      }
    }
  }, [isOpen, selectedAccountToken, accountId]);

  const loadAddresses = async () => {
    setAddressesLoading(true);
    try {
      const response = await getAccountAddresses(
        selectedAccountToken,
        accountId,
        selectedOrgId || "",
        selectedStoreId || ""
      );

      if (response?.data) {
        setAddresses(response.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load addresses";
      showToast(errorMessage, "error");
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find((addr) => addr.id === addressId);
    setSelectedAddress(address || null);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast("Please select a delivery address", "error");
      return;
    }

    if (paymentMethod === "purchase_order" && !purchaseOrderNumber.trim()) {
      showToast("Please enter a purchase order number", "error");
      return;
    }

    if (!selectedCartId) {
      showToast("No cart selected", "error");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Checkout the order
      const checkoutResult = await checkoutOrder(
        selectedCartId,
        {
          email: impersonationData?.email || "customer@example.com",
          name:
            impersonationData?.name ||
            `${selectedAddress?.first_name} ${selectedAddress?.last_name}`,
        },
        selectedAddress as Partial<Address>,
        selectedAddress as Partial<Address>, // Using same address for billing
        selectedAccountToken,
        selectedOrgId || "",
        selectedStoreId || "",
        paymentMethod === "purchase_order" ? purchaseOrderNumber : undefined
      );

      if (!checkoutResult?.data?.id) {
        throw new Error("Checkout failed - no order ID returned");
      }

      const orderId = checkoutResult.data.id;

      // Step 2: Create manual payment if using purchase order
      if (paymentMethod === "purchase_order") {
        await createManualPayment(
          orderId,
          selectedAccountToken,
          selectedOrgId || "",
          selectedStoreId || ""
        );
      }

      // Step 3: Clear cart items
      await clearCart();

      showToast("Order placed successfully!", "success");
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to place order";
      showToast(errorMessage, "error");
      console.error("Order placement error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Checkout</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Impersonated User Info */}
          {impersonationData && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Ordering for:
              </h3>
              <div className="text-sm text-blue-800">
                <p className="font-medium">{impersonationData.name}</p>
                <p>{impersonationData.email}</p>
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Delivery Address
            </h3>
            {addressesLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Loading addresses...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <select
                  value={selectedAddressId}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select an address</option>
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.name ||
                        `${address.first_name} ${address.last_name}`}{" "}
                      - {address.line_1}, {address.city}
                    </option>
                  ))}
                </select>

                {selectedAddress && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Selected Address:
                    </h4>
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">
                        {selectedAddress.name ||
                          `${selectedAddress.first_name} ${selectedAddress.last_name}`}
                      </p>
                      {selectedAddress.company_name && (
                        <p>{selectedAddress.company_name}</p>
                      )}
                      <p>{selectedAddress.line_1}</p>
                      {selectedAddress.line_2 && (
                        <p>{selectedAddress.line_2}</p>
                      )}
                      <p>
                        {selectedAddress.city}, {selectedAddress.county}
                      </p>
                      <p>{selectedAddress.postcode}</p>
                      <p>{selectedAddress.country}</p>
                      {selectedAddress.phone_number && (
                        <p className="mt-2">
                          Phone: {selectedAddress.phone_number}
                        </p>
                      )}
                      {selectedAddress.instructions && (
                        <p className="mt-2 text-gray-600">
                          Instructions: {selectedAddress.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Payment Method
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="purchase_order"
                  checked={paymentMethod === "purchase_order"}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as "purchase_order" | "place_order"
                    )
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Purchase Order Number
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="place_order"
                  checked={paymentMethod === "place_order"}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as "purchase_order" | "place_order"
                    )
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Place order and request payment from user
                </span>
              </label>
            </div>

            {paymentMethod === "purchase_order" && (
              <div className="mt-3">
                <label
                  htmlFor="purchaseOrderNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Purchase Order Number
                </label>
                <input
                  type="text"
                  id="purchaseOrderNumber"
                  value={purchaseOrderNumber}
                  onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                  placeholder="Enter purchase order number"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={handlePlaceOrder}
            disabled={
              loading ||
              !selectedAddressId ||
              (paymentMethod === "purchase_order" &&
                !purchaseOrderNumber.trim())
            }
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
