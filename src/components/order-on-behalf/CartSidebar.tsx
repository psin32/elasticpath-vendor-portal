"use client";

import { useState, useEffect } from "react";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import {
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { ShoppingCartIcon as ShoppingCartIconSolid } from "@heroicons/react/24/solid";

interface CartSidebarProps {
  selectedAccountToken: string;
  selectedCartId?: string;
}

export default function CartSidebar({
  selectedAccountToken,
  selectedCartId,
}: CartSidebarProps) {
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const { fetchCartById } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );
  const { showToast } = useToast();

  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccountToken && selectedOrgId && selectedStoreId) {
      if (selectedCartId) {
        loadSpecificCart();
      }
    }
  }, [selectedAccountToken, selectedOrgId, selectedStoreId, selectedCartId]);

  const loadSpecificCart = async () => {
    if (!selectedCartId) return;

    setLoading(true);
    setError(null);

    try {
      const cart = await fetchCartById(
        selectedCartId,
        selectedAccountToken,
        selectedOrgId || "",
        selectedStoreId || ""
      );
      setCartData(cart);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load cart";
      setError(errorMessage);
      showToast(errorMessage, "error");
      console.error("Error loading cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCartTotal = () => {
    if (!cartData?.data.meta?.display_price?.with_tax) return "N/A";
    return cartData.data.meta.display_price.with_tax.formatted;
  };

  const getCartSubtotal = () => {
    if (!cartData?.data.meta?.display_price?.without_tax) return "N/A";
    return cartData.data.meta.display_price.without_tax.formatted;
  };

  const getCartTax = () => {
    if (!cartData?.data.meta?.display_price) return "N/A";
    return cartData.data.meta.display_price.tax?.formatted;
  };

  const getItemTotal = (item: any) => {
    return item.meta.display_price.with_tax?.value?.formatted || "N/A";
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    showToast("Quantity update functionality coming soon", "info");
  };

  const handleRemoveItem = (itemId: string) => {
    showToast("Remove item functionality coming soon", "info");
  };

  const handleCheckout = () => {
    showToast("Checkout functionality coming soon", "info");
  };

  return (
    <div className="h-full w-full max-w-sm sm:max-w-md bg-white border-l border-gray-200 shadow-lg">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <ShoppingCartIconSolid className="h-6 w-6 text-indigo-600 mr-2" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Shopping Cart
              </h2>
              {selectedCartId && (
                <p className="text-sm text-gray-500">{cartData?.data?.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {cartData?.included?.items?.length > 0 && (
              <button
                onClick={handleCheckout}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Checkout
              </button>
            )}
          </div>
        </div>
        {/* Footer - Cart Summary and Actions */}
        {!loading && !error && cartData?.included?.items?.length > 0 && (
          <div className="px-6 py-4 space-y-4">
            {/* Cart Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{getCartSubtotal()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">{getCartTax()}</span>
              </div>
              <div className="flex justify-between text-lg font-medium">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{getCartTotal()}</span>
              </div>
            </div>
          </div>
        )}
        {/* Content */}
        <div className="flex-1 overflow-y-auto border-t border-gray-200 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading cart...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="px-6 py-12 text-center">
              <div className="text-red-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
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
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Error Loading Cart
              </h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
            </div>
          )}
          {cartData?.included?.items?.length > 0 ? (
            <div className="px-6 py-4">
              {/* Cart Items */}
              <div className="space-y-4">
                {cartData?.included?.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 border-b border-gray-200 pb-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                        <ShoppingCartIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item?.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {getItemTotal(item)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        className="p-1 rounded-md text-gray-400 hover:text-gray-500"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        className="p-1 rounded-md text-gray-400 hover:text-gray-500"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded-md text-red-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Your cart is empty
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add some products to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
