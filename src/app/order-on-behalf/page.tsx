"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

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
  const [activeTab, setActiveTab] = useState<"products" | "carts">("products");

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

      {/* Impersonation Status */}
      {selectedAccount && (
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Impersonation Active
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    You are currently impersonating{" "}
                    <strong>{impersonationData.name}</strong> for account{" "}
                    <strong>{selectedAccount.account_name}</strong>
                  </p>
                  <p className="mt-1">
                    Session expires:{" "}
                    {new Date(selectedAccount.expires).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
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
              onClick={() => setActiveTab("carts")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "carts"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Carts
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "products" && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Browse Products
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Browse and manage products for account:{" "}
                  {selectedAccount?.account_name}
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Products Section
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Product browsing functionality will be implemented here.
                  </p>
                  <div className="mt-6">
                    <button
                      disabled
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "carts" && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Carts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage shopping carts for account:{" "}
                  {selectedAccount?.account_name}
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
                    Carts Section
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Cart management functionality will be implemented here.
                  </p>
                  <div className="mt-6">
                    <button
                      disabled
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
