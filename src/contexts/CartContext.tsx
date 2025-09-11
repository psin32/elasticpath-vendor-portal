"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import Cookies from "js-cookie";

const SELECTED_CART_COOKIE = "selectedCartId";

interface CartContextType {
  // State
  selectedCartId: string;
  cartData: any | null;
  cartDetails: any | null;
  loading: boolean;
  error: string | null;

  // Actions
  selectCart: (cartId: string) => void;
  deselectCart: () => void;
  refreshCart: () => Promise<void>;
  addItemToCart: (productId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItemFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  updateCartCustomDiscountSettings: (
    custom_discounts_enabled: boolean
  ) => Promise<void>;
  updateItemCustomDiscount: (
    itemId: string,
    discountData: { amount: number; description: string; username: string }
  ) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
  selectedAccountToken?: string;
}

export const CartProvider: React.FC<CartProviderProps> = ({
  children,
  selectedAccountToken,
}) => {
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const {
    fetchCartById,
    fetchFullCartDetails,
    updateCartItemQuantity,
    addToCart,
    deleteCartItem,
    clearCartItems,
    updateCartCustomDiscountSettings: updateCartCustomDiscountSettingsApi,
    updateItemCustomDiscount: updateItemCustomDiscountApi,
  } = useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);
  const { showToast } = useToast();

  const [selectedCartId, setSelectedCartId] = useState<string>("");
  const [cartData, setCartData] = useState<any>(null);
  const [cartDetails, setCartDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cart ID from cookies on mount
  useEffect(() => {
    const savedCartId = Cookies.get(SELECTED_CART_COOKIE);
    if (savedCartId) {
      setSelectedCartId(savedCartId);
    }
  }, []);

  // Load cart data when selectedCartId changes
  useEffect(() => {
    if (
      selectedCartId &&
      selectedAccountToken &&
      selectedOrgId &&
      selectedStoreId
    ) {
      loadCartData();
    } else {
      setCartData(null);
    }
  }, [selectedCartId, selectedAccountToken, selectedOrgId, selectedStoreId]);

  const loadCartData = async () => {
    if (!selectedCartId || !selectedAccountToken) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch both cart details and items
      const [cartDetailsResponse, cartItemsResponse] = await Promise.all([
        fetchFullCartDetails(
          selectedCartId,
          selectedAccountToken,
          selectedOrgId || "",
          selectedStoreId || ""
        ),
        fetchCartById(
          selectedCartId,
          selectedAccountToken,
          selectedOrgId || "",
          selectedStoreId || ""
        ),
      ]);

      setCartDetails(cartDetailsResponse);
      setCartData(cartItemsResponse);
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

  const selectCart = useCallback(
    (cartId: string) => {
      setSelectedCartId(cartId);
      Cookies.set(SELECTED_CART_COOKIE, cartId, { expires: 7 });
      showToast(`Cart selected: ${cartId.slice(0, 8)}...`, "success");
    },
    [showToast]
  );

  const deselectCart = useCallback(() => {
    setSelectedCartId("");
    setCartData(null);
    setCartDetails(null);
    Cookies.remove(SELECTED_CART_COOKIE);
  }, []);

  const refreshCart = useCallback(async () => {
    if (selectedCartId) {
      await loadCartData();
    }
  }, [selectedCartId]);

  const addItemToCart = useCallback(
    async (productId: string, quantity: number) => {
      if (!selectedCartId || !selectedAccountToken) {
        showToast("No cart selected", "error");
        return;
      }

      try {
        const result = await addToCart(
          selectedCartId,
          productId,
          quantity,
          selectedAccountToken,
          selectedOrgId!,
          selectedStoreId!
        );

        if (result) {
          // Refresh cart data to get updated cart with all items
          await loadCartData();
          showToast("Item added to cart", "success");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add item to cart";
        showToast(errorMessage, "error");
      }
    },
    [
      selectedCartId,
      selectedAccountToken,
      selectedOrgId,
      selectedStoreId,
      addToCart,
      loadCartData,
      showToast,
    ]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!selectedCartId || !selectedAccountToken) {
        showToast("No cart selected", "error");
        return;
      }

      try {
        const updatedCart = await updateCartItemQuantity(
          selectedCartId,
          itemId,
          quantity,
          selectedAccountToken,
          selectedOrgId!,
          selectedStoreId!
        );

        if (updatedCart) {
          // Refresh cart data to get updated cart with all items
          await loadCartData();
          showToast("Quantity updated successfully", "success");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update quantity";
        showToast(errorMessage, "error");
      }
    },
    [
      selectedCartId,
      selectedAccountToken,
      selectedOrgId,
      selectedStoreId,
      updateCartItemQuantity,
      loadCartData,
      showToast,
    ]
  );

  const removeItemFromCart = useCallback(
    async (itemId: string) => {
      if (!selectedCartId || !selectedAccountToken) {
        showToast("No cart selected", "error");
        return;
      }

      try {
        // This would need to be implemented in useEpccApi
        // For now, just refresh the cart data
        const response = await deleteCartItem(
          selectedCartId,
          itemId,
          selectedAccountToken,
          selectedOrgId!,
          selectedStoreId!
        );
        setCartData(response);
        await refreshCart();
        showToast("Item removed from cart", "success");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove item";
        showToast(errorMessage, "error");
      }
    },
    [selectedCartId, selectedAccountToken, refreshCart, showToast]
  );

  const clearCart = useCallback(async () => {
    if (!selectedCartId || !selectedAccountToken) {
      return;
    }

    try {
      await clearCartItems(
        selectedCartId,
        selectedAccountToken,
        selectedOrgId!,
        selectedStoreId!
      );
      // Refresh cart data to show empty cart
      await refreshCart();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear cart";
      showToast(errorMessage, "error");
    }
  }, [
    selectedCartId,
    selectedAccountToken,
    selectedOrgId,
    selectedStoreId,
    clearCartItems,
    refreshCart,
    showToast,
  ]);

  const updateCartCustomDiscountSettings = useCallback(
    async (custom_discounts_enabled: boolean) => {
      if (!selectedCartId || !selectedAccountToken) {
        showToast("No cart selected", "error");
        return;
      }

      try {
        await updateCartCustomDiscountSettingsApi(
          selectedCartId,
          custom_discounts_enabled,
          selectedAccountToken,
          selectedOrgId!,
          selectedStoreId!
        );

        showToast(
          `Price override ${
            custom_discounts_enabled ? "enabled" : "disabled"
          } successfully`,
          "success"
        );

        // Refresh cart data to get updated cart details
        await refreshCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update price override setting";
        showToast(errorMessage, "error");
        console.error("Error updating cart custom discount settings:", err);
      }
    },
    [
      selectedCartId,
      selectedAccountToken,
      selectedOrgId,
      selectedStoreId,
      updateCartCustomDiscountSettingsApi,
      refreshCart,
      showToast,
    ]
  );

  const updateItemCustomDiscount = useCallback(
    async (
      itemId: string,
      discountData: { amount: number; description: string; username: string }
    ) => {
      if (!selectedCartId || !selectedAccountToken) {
        showToast("No cart selected", "error");
        return;
      }

      try {
        await updateItemCustomDiscountApi(
          selectedCartId,
          itemId,
          {
            amount: discountData.amount.toString(),
            description: discountData.description,
            username: discountData.username,
          },
          selectedAccountToken,
          selectedOrgId!,
          selectedStoreId!
        );

        showToast("Custom discount applied successfully", "success");

        // Refresh cart data to get updated cart details
        await refreshCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to apply custom discount";
        showToast(errorMessage, "error");
        console.error("Error applying custom discount:", err);
      }
    },
    [
      selectedCartId,
      selectedAccountToken,
      selectedOrgId,
      selectedStoreId,
      updateItemCustomDiscountApi,
      refreshCart,
      showToast,
    ]
  );

  const value: CartContextType = {
    // State
    selectedCartId,
    cartData,
    cartDetails,
    loading,
    error,

    // Actions
    selectCart,
    deselectCart,
    refreshCart,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
    updateCartCustomDiscountSettings,
    updateItemCustomDiscount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
