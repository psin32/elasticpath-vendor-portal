"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import CartComponent from "@/components/order-on-behalf/CartComponent";
import ProductsComponent from "@/components/order-on-behalf/ProductsComponent";
import CartSidebar from "@/components/order-on-behalf/CartSidebar";
import OrdersComponent from "@/components/order-on-behalf/OrdersComponent";
import { CartProvider } from "@/contexts/CartContext";
import Cookies from "js-cookie";

const SELECTED_CART_COOKIE = "selectedCartId";

interface ImpersonationData {
  accounts: Record<
    string,
    {
      account_id: string;
      account_name: string;
      expires: string;
      token: string;
      type: string;
    }
  >;
  selected: string;
  accountMemberId: string;
  email: string;
  name: string;
}

export default function OrderOnBehalfPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();
  const { selectedOrgId, selectedStoreId } = useDashboard();

  const [impersonationData, setImpersonationData] =
    useState<ImpersonationData | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"products" | "carts" | "orders">(
    "carts"
  );
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [selectedCartId, setSelectedCartId] = useState<string>("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  // Load impersonation data from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem("impersonationData");
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as ImpersonationData;

        // Check if any token has expired
        const hasExpiredToken = Object.values(data.accounts).some(
          (account) => new Date(account.expires) < new Date()
        );

        if (hasExpiredToken) {
          localStorage.removeItem("impersonationData");
          showToast("Impersonation session has expired", "error");
          router.push("/accounts");
          return;
        }

        setImpersonationData(data);
        setSelectedAccountId(data.selected);
      } catch (error) {
        console.error("Error parsing impersonation data:", error);
        showToast("Invalid impersonation data", "error");
        router.push("/accounts");
      }
    } else {
      showToast("No impersonation data found", "error");
      router.push("/accounts");
    }
  }, [router, showToast]);

  // Load selected cart ID from cookies
  useEffect(() => {
    const savedCartId = Cookies.get(SELECTED_CART_COOKIE);
    if (savedCartId) {
      setSelectedCartId(savedCartId);
    }
  }, []);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const getAccountOptions = () => {
    if (!impersonationData) return [];
    return Object.values(impersonationData.accounts);
  };

  const getSelectedAccount = () => {
    if (!impersonationData || !selectedAccountId) return null;
    return impersonationData.accounts[selectedAccountId];
  };

  const handleNewImpersonation = () => {
    localStorage.removeItem("impersonationData");
    router.push("/accounts");
  };

  const handleCartSelect = (cartId: string) => {
    setSelectedCartId(cartId);
    setIsCartSidebarOpen(true);
    // Save cart ID to cookie
    Cookies.set(SELECTED_CART_COOKIE, cartId, { expires: 7 }); // Expires in 7 days
  };

  const handleClearCartSelection = () => {
    setSelectedCartId("");
    // Remove cart ID from cookie
    Cookies.remove(SELECTED_CART_COOKIE);
  };

  const handleCartCreated = (cartId: string) => {
    setSelectedCartId(cartId);
    // Save new cart ID to cookie
    Cookies.set(SELECTED_CART_COOKIE, cartId, { expires: 7 }); // Expires in 7 days
    showToast("New cart created and selected", "success");
  };

  const handleOrderPlaced = () => {
    // Switch to orders tab after successful order placement
    setActiveTab("orders");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!impersonationData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No impersonation data found</p>
          <button
            onClick={() => router.push("/accounts")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go to Accounts
          </button>
        </div>
      </div>
    );
  }

  const accountOptions = getAccountOptions();
  const selectedAccount = getSelectedAccount();
  const hasMultipleAccounts = accountOptions.length > 1;

  return (
    <CartProvider selectedAccountToken={selectedAccount?.token}>
      <div className="h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Order On Behalf
                  </h1>
                  {selectedAccount && (
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You are currently impersonating{" "}
                        <strong>{impersonationData.name}</strong> for account{" "}
                        <strong>{selectedAccount?.account_name}</strong>
                      </p>
                      <p className="mt-1">
                        Session expires:{" "}
                        {new Date(selectedAccount?.expires).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  {hasMultipleAccounts && (
                    <div className="flex items-center space-x-2">
                      <label
                        htmlFor="account-select"
                        className="text-sm font-medium text-gray-700"
                      >
                        Account:
                      </label>
                      <select
                        id="account-select"
                        value={selectedAccountId}
                        onChange={(e) => handleAccountChange(e.target.value)}
                        className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {accountOptions.map((account) => (
                          <option
                            key={account.account_id}
                            value={account.account_id}
                          >
                            {account.account_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleNewImpersonation}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    End Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Cart Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-6 h-full flex flex-col">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab("carts")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "carts"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Carts
                  </button>

                  <button
                    onClick={() => setActiveTab("products")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "products"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Browse Products
                  </button>

                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "orders"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Orders
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto mt-6">
                {activeTab === "products" && selectedAccount && (
                  <ProductsComponent
                    selectedAccountToken={selectedAccount.token}
                    selectedOrgId={selectedOrgId || ""}
                    selectedStoreId={selectedStoreId || ""}
                  />
                )}

                {activeTab === "carts" && selectedAccount && (
                  <CartComponent
                    selectedAccountToken={selectedAccount.token}
                    accountName={selectedAccount.account_name}
                    onCartSelect={handleCartSelect}
                    onCartCreated={handleCartCreated}
                  />
                )}

                {activeTab === "orders" && selectedAccount && (
                  <OrdersComponent
                    selectedAccountToken={selectedAccount.token}
                    accountId={selectedAccount.account_id}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Cart */}
          {selectedAccount && (
            <CartSidebar
              selectedAccountToken={selectedAccount.token}
              selectedCartId={selectedCartId}
              onCartCreated={handleCartCreated}
              accountId={selectedAccount.account_id}
              onOrderPlaced={handleOrderPlaced}
            />
          )}
        </div>
      </div>
    </CartProvider>
  );
}
