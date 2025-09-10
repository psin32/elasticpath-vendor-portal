"use client";

import { useState, useEffect } from "react";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import { useCart } from "@/hooks/useCart";
import { Cart } from "@elasticpath/js-sdk";
import { ShoppingCartIcon as ShoppingCartIconSolid } from "@heroicons/react/24/solid";
import { TrashIcon } from "@heroicons/react/24/outline";
import CreateCart from "./CreateCart";

interface CartComponentProps {
  selectedAccountToken: string;
  accountName: string;
  onCartSelect?: (cartId: string) => void;
  onCartCreated?: (cartId: string) => void;
}

export default function CartComponent({
  selectedAccountToken,
  accountName,
  onCartSelect,
  onCartCreated,
}: CartComponentProps) {
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const { fetchAllAccountCarts, deleteCart } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );
  const { showToast } = useToast();
  const { selectCart } = useCart(selectedAccountToken);

  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingCartId, setDeletingCartId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccountToken && selectedStoreId) {
      loadCarts();
    } else {
      setCarts([]);
      setError(null);
    }
  }, [selectedAccountToken, selectedStoreId]);

  const loadCarts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAllAccountCarts(
        selectedAccountToken,
        selectedOrgId || "",
        selectedStoreId || ""
      );

      if (response?.data) {
        const cartsArray = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setCarts(cartsArray);
      } else {
        setCarts([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load carts";
      setError(errorMessage);
      showToast(errorMessage, "error");
      console.error("Error loading carts:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = (cart: Cart) => {
    return (cart as any)?.relationships?.items?.data?.length || 0;
  };

  const getTotalCost = (cart: Cart) => {
    return (cart as any)?.meta?.display_price?.with_tax?.formatted || "N/A";
  };

  const getCartIconStyle = (cart: Cart) => {
    const itemCount = getTotalItems(cart);

    if (itemCount === 0) {
      return "bg-gradient-to-br from-gray-400 to-gray-500";
    } else if (itemCount > 10) {
      return "bg-gradient-to-br from-green-500 to-emerald-600";
    } else {
      return "bg-gradient-to-br from-indigo-500 to-purple-600";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const handleDeleteCart = async (cartId: string, cartName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the cart "${cartName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingCartId(cartId);
    try {
      await deleteCart(
        cartId,
        selectedAccountToken,
        selectedOrgId || "",
        selectedStoreId || ""
      );

      showToast(`Cart "${cartName}" deleted successfully`, "success");
      // Reload carts to reflect the deletion
      await loadCarts();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete cart";
      showToast(errorMessage, "error");
      console.error("Error deleting cart:", err);
    } finally {
      setDeletingCartId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Carts</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">
                Loading carts for {accountName}...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Carts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Shopping carts for account: {accountName}
          </p>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Error Loading Carts
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={loadCarts}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Carts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Shopping carts for account: {accountName}
          </p>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No Carts Found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Account "{accountName}" doesn't have any shopping carts yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Carts</h3>
          </div>
          <div className="flex items-center space-x-3">
            <CreateCart
              selectedAccountToken={selectedAccountToken}
              onCartCreated={(cartId) => {
                selectCart(cartId);
                if (onCartCreated) {
                  onCartCreated(cartId);
                }
                // Refresh the cart list after creating a new cart
                loadCarts();
              }}
              buttonText="Create Cart"
              buttonVariant="primary"
              showIcon={true}
            />
            <button
              onClick={loadCarts}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cart Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {carts.map((cart) => (
              <tr key={cart.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 relative">
                      <div
                        className={`h-12 w-12 rounded-lg ${getCartIconStyle(
                          cart
                        )} flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200`}
                      >
                        <ShoppingCartIconSolid className="h-7 w-7 text-white" />
                      </div>
                      {getTotalItems(cart) > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                          {getTotalItems(cart) > 99
                            ? "99+"
                            : getTotalItems(cart)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {(cart as any)?.name}
                        <div className="text-xs text-gray-500">
                          {(cart as any)?.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getTotalCost(cart)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate((cart as any)?.meta?.timestamps?.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate((cart as any)?.meta?.timestamps?.updated_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        selectCart(cart.id);
                        if (onCartSelect) {
                          onCartSelect(cart.id);
                        }
                      }}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Select Cart
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteCart(
                          cart.id,
                          (cart as any)?.name || "Unnamed Cart"
                        )
                      }
                      disabled={deletingCartId === cart.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      {deletingCartId === cart.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {carts.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{carts.length}</span> cart
              {carts.length !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-gray-500">
              Total items across all carts:{" "}
              {carts.reduce((sum, cart) => sum + getTotalItems(cart), 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
