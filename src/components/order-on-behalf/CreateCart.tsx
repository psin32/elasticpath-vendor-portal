"use client";

import { useState } from "react";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import { useCart } from "@/hooks/useCart";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import Cookies from "js-cookie";

const SELECTED_CART_COOKIE = "selectedCartId";

interface CreateCartProps {
  selectedAccountToken: string;
  onCartCreated?: (cartId: string) => void;
  buttonText?: string;
  buttonVariant?: "primary" | "secondary";
  showIcon?: boolean;
}

export default function CreateCart({
  selectedAccountToken,
  onCartCreated,
  buttonText = "Create New Cart",
  buttonVariant = "primary",
  showIcon = true,
}: CreateCartProps) {
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const { createNewCart } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );
  const { showToast } = useToast();
  const { selectCart } = useCart(selectedAccountToken);

  const [showOverlay, setShowOverlay] = useState(false);
  const [cartName, setCartName] = useState("");
  const [cartDescription, setCartDescription] = useState("");
  const [creatingCart, setCreatingCart] = useState(false);

  const handleCreateCart = async () => {
    if (!cartName.trim()) {
      showToast("Cart name is required", "error");
      return;
    }

    setCreatingCart(true);
    try {
      const newCart = await createNewCart(
        cartName.trim(),
        cartDescription.trim(),
        selectedAccountToken,
        selectedOrgId || "",
        selectedStoreId || ""
      );

      if (newCart) {
        showToast("Cart created successfully", "success");
        setShowOverlay(false);
        setCartName("");
        setCartDescription("");

        // Select the new cart and notify parent
        if (newCart.data?.id) {
          selectCart(newCart.data.id);

          if (onCartCreated) {
            onCartCreated(newCart.data.id);
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create cart";
      showToast(errorMessage, "error");
      console.error("Error creating cart:", err);
    } finally {
      setCreatingCart(false);
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setCartName("");
    setCartDescription("");
  };

  const getButtonClasses = () => {
    const baseClasses =
      "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";

    if (buttonVariant === "primary") {
      return `${baseClasses} text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
    } else {
      return `${baseClasses} text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-indigo-500`;
    }
  };

  return (
    <>
      {/* Create Cart Button */}
      <button
        onClick={() => setShowOverlay(true)}
        className={getButtonClasses()}
      >
        {showIcon && <PlusIcon className="h-4 w-4 mr-2" />}
        {buttonText}
      </button>

      {/* Create Cart Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Create New Cart
                  </h3>
                  <button
                    onClick={handleCloseOverlay}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="cartName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Cart Name *
                    </label>
                    <input
                      type="text"
                      id="cartName"
                      value={cartName}
                      onChange={(e) => setCartName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter cart name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cartDescription"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description (Optional)
                    </label>
                    <textarea
                      id="cartDescription"
                      value={cartDescription}
                      onChange={(e) => setCartDescription(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter cart description"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleCreateCart}
                  disabled={creatingCart || !cartName.trim()}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingCart ? "Creating..." : "Create Cart"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseOverlay}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
