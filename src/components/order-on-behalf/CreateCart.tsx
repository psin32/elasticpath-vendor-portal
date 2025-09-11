"use client";

import { useState } from "react";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import { useCartContext } from "@/contexts/CartContext";
import { PlusIcon } from "@heroicons/react/24/outline";
import CreateCartOverlay from "./CreateCartOverlay";

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
  const { selectCart } = useCartContext();

  const [showOverlay, setShowOverlay] = useState(false);
  const [creatingCart, setCreatingCart] = useState(false);

  const handleCreateCart = async (
    cartName: string,
    cartDescription: string
  ) => {
    setCreatingCart(true);
    try {
      const newCart = await createNewCart(
        cartName,
        cartDescription,
        selectedAccountToken,
        selectedOrgId || "",
        selectedStoreId || ""
      );

      if (newCart) {
        showToast("Cart created successfully", "success");
        setShowOverlay(false);

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
      <CreateCartOverlay
        isOpen={showOverlay}
        onClose={handleCloseOverlay}
        onCreateCart={handleCreateCart}
        isLoading={creatingCart}
      />
    </>
  );
}
