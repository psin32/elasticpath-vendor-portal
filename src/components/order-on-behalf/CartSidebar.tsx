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
import Image from "next/image";

interface CartSidebarProps {
  selectedAccountToken: string;
  selectedCartId?: string;
}

export default function CartSidebar({
  selectedAccountToken,
  selectedCartId,
}: CartSidebarProps) {
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const { fetchCartById, updateCartItemQuantity } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );
  const { showToast } = useToast();

  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>("");

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

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = await updateCartItemQuantity(
      selectedCartId!,
      itemId,
      newQuantity,
      selectedAccountToken,
      selectedOrgId!,
      selectedStoreId!
    );
    setCartData(updatedCart);
    showToast("Quantity updated successfully", "success");
  };

  const handleQuantityEdit = (itemId: string, currentQuantity: number) => {
    setEditingQuantity(itemId);
    setTempQuantity(currentQuantity.toString());
  };

  const handleQuantitySave = async (itemId: string) => {
    const newQuantity = parseInt(tempQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) {
      setEditingQuantity(null);
      return;
    }

    await handleQuantityChange(itemId, newQuantity);
    setEditingQuantity(null);
  };

  const handleQuantityCancel = () => {
    setEditingQuantity(null);
    setTempQuantity("");
  };

  const handleQuantityKeyPress = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === "Enter") {
      handleQuantitySave(itemId);
    } else if (e.key === "Escape") {
      handleQuantityCancel();
    }
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
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {cartData?.data?.length > 0 && (
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
        {!loading && !error && cartData?.data?.length > 0 && (
          <div className="px-6 py-4 space-y-4">
            {/* Cart Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">
                  {cartData.meta.display_price.without_tax.formatted}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">
                  {cartData.meta.display_price.tax?.formatted}
                </span>
              </div>
              <div className="flex justify-between text-lg font-medium">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">
                  {cartData.meta.display_price.with_tax.formatted}
                </span>
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
          {cartData?.data?.length > 0 ? (
            <div className="px-6 py-4">
              {/* Cart Items */}
              <div className="space-y-4">
                {cartData?.data?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 border-b border-gray-200 pb-4"
                  >
                    <div className="flex-shrink-0 relative">
                      <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={
                            item.image.href ||
                            "https://static.vecteezy.com/system/resources/previews/026/560/726/non_2x/product-line-icon-vector.jpg"
                          }
                          alt="Cart"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute -top-1 -left-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <h4 className="text-sm  text-gray-900">{item?.name}</h4>

                      <div className="flex items-center space-x-2 mt-4 mb-4">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          className="p-1 rounded-md text-gray-400 hover:text-gray-500"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>

                        {editingQuantity === item.id ? (
                          <input
                            type="number"
                            value={tempQuantity}
                            onChange={(e) => setTempQuantity(e.target.value)}
                            onBlur={() => handleQuantitySave(item.id)}
                            onKeyDown={(e) =>
                              handleQuantityKeyPress(e, item.id)
                            }
                            className="w-12 text-sm font-medium text-gray-900 text-center border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min="1"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() =>
                              handleQuantityEdit(item.id, item.quantity)
                            }
                            className="text-sm font-medium text-gray-900 min-w-[2rem] text-center cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
                          >
                            {item.quantity}
                          </span>
                        )}

                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className="p-1 rounded-md text-gray-400 hover:text-gray-500"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex gap-2 flex-col items-end">
                        <span>
                          {item.meta.display_price.with_tax.value.formatted}
                        </span>
                        {item.meta.display_price.without_discount?.value
                          .amount &&
                          item.meta.display_price.without_discount?.value
                            .amount !==
                            item.meta.display_price.with_tax.value.amount && (
                            <span className="text-black/60 text-sm line-through">
                              {
                                item.meta.display_price.without_discount?.value
                                  .formatted
                              }
                            </span>
                          )}
                      </div>
                    </div>
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
