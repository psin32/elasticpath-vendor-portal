"use client";

import { useState, useEffect, useCallback } from "react";
import { useEpccApi } from "./useEpccApi";
import { useDashboard } from "./useDashboard";
import { useToast } from "@/contexts/ToastContext";
import Cookies from "js-cookie";

const SELECTED_CART_COOKIE = "selectedCartId";

interface UseCartReturn {
  // State
  selectedCartId: string;
  cartData: any | null;
  loading: boolean;
  error: string | null;

  // Actions
  selectCart: (cartId: string) => void;
  deselectCart: () => void;
  refreshCart: () => Promise<void>;
  addItemToCart: (productId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItemFromCart: (itemId: string) => Promise<void>;
}

export const useCart = (selectedAccountToken?: string): UseCartReturn => {
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const { fetchCartById, updateCartItemQuantity, addToCart, deleteCartItem } =
    useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);
  const { showToast } = useToast();

  const [selectedCartId, setSelectedCartId] = useState<string>("");
  const [cartData, setCartData] = useState<any>(null);
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

  const selectCart = useCallback(
    (cartId: string) => {
      setSelectedCartId(cartId);
      Cookies.set(SELECTED_CART_COOKIE, cartId, { expires: 7 });
    },
    [showToast]
  );

  const deselectCart = useCallback(() => {
    setSelectedCartId("");
    setCartData(null);
    Cookies.remove(SELECTED_CART_COOKIE);
  }, [showToast]);

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
          setCartData(result);
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
      refreshCart,
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

        setCartData(updatedCart);
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
      setCartData,
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
        const response = await deleteCartItem(
          selectedCartId,
          itemId,
          selectedAccountToken,
          selectedOrgId!,
          selectedStoreId!
        );
        setCartData(response);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove item";
        showToast(errorMessage, "error");
      }
    },
    [selectedCartId, selectedAccountToken, refreshCart, showToast]
  );

  return {
    // State
    selectedCartId,
    cartData,
    loading,
    error,

    // Actions
    selectCart,
    deselectCart,
    refreshCart,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
  };
};
