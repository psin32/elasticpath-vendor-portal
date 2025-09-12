"use client";

import React, { useState, useEffect } from "react";

export interface OrderFilterState {
  status?: string;
  payment?: string;
  shipping?: string;
  customerName?: string;
  customerEmail?: string;
  customerId?: string;
  accountId?: string;
  accountMemberId?: string;
  contactName?: string;
  contactEmail?: string;
  shippingPostcode?: string;
  billingPostcode?: string;
  withTaxMin?: number;
  withTaxMax?: number;
  withoutTaxMin?: number;
  withoutTaxMax?: number;
  currency?: string;
  productId?: string;
  productSku?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  externalRef?: string;
  orderNumber?: string;
}

export interface OrderFilterFormState {
  status?: string;
  payment?: string;
  shipping?: string;
  customerName?: string;
  customerEmail?: string;
  customerId?: string;
  accountId?: string;
  accountMemberId?: string;
  contactName?: string;
  contactEmail?: string;
  shippingPostcode?: string;
  billingPostcode?: string;
  withTaxMin?: number;
  withTaxMax?: number;
  withoutTaxMin?: number;
  withoutTaxMax?: number;
  currency?: string;
  productId?: string;
  productSku?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  externalRef?: string;
  orderNumber?: string;
}

interface OrderFilterProps {
  onFilterChange: (filters: OrderFilterState) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "complete", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
  { value: "cancelled", label: "Cancelled" },
  { value: "processing", label: "Processing" },
];

const paymentOptions = [
  { value: "", label: "All Payment Statuses" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "refunded", label: "Refunded" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "partially_authorized", label: "Partially Authorized" },
];

const shippingOptions = [
  { value: "", label: "All Shipping Statuses" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "unfulfilled", label: "Unfulfilled" },
];

const currencyOptions = [
  { value: "", label: "All Currencies" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "CAD", label: "CAD" },
  { value: "AUD", label: "AUD" },
];

export default function OrderFilter({
  onFilterChange,
  onClearFilters,
  loading = false,
}: OrderFilterProps) {
  const [formFilters, setFormFilters] = useState<OrderFilterFormState>({});
  const [appliedFilters, setAppliedFilters] = useState<OrderFilterState>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFormChange = (
    key: keyof OrderFilterFormState,
    value: string | number | undefined
  ) => {
    setFormFilters({ ...formFilters, [key]: value });
  };

  const handleApplyFilters = () => {
    // Clean up the form filters (remove empty values)
    const cleanedFilters: OrderFilterState = {};
    Object.entries(formFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        cleanedFilters[key as keyof OrderFilterState] = value;
      }
    });

    setAppliedFilters(cleanedFilters);
    onFilterChange(cleanedFilters);
    // Keep form expanded and don't clear form filters
  };

  const handleClearFilters = () => {
    setFormFilters({});
    setAppliedFilters({});
    onClearFilters();
    // Keep form expanded after clearing
  };

  const hasActiveFilters = Object.values(appliedFilters).some(
    (value) => value !== undefined && value !== "" && value !== null
  );

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter Orders</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {isExpanded ? "Hide Filters" : "Show Filters"}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Form - Only show when expanded */}
      {isExpanded && (
        <>
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  value={formFilters.status || ""}
                  onChange={(e) =>
                    handleFormChange("status", e.target.value || undefined)
                  }
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 appearance-none bg-white"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment
              </label>
              <div className="relative">
                <select
                  value={formFilters.payment || ""}
                  onChange={(e) =>
                    handleFormChange("payment", e.target.value || undefined)
                  }
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 appearance-none bg-white"
                >
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping
              </label>
              <div className="relative">
                <select
                  value={formFilters.shipping || ""}
                  onChange={(e) =>
                    handleFormChange("shipping", e.target.value || undefined)
                  }
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 appearance-none bg-white"
                >
                  {shippingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <div className="relative">
                <select
                  value={formFilters.currency || ""}
                  onChange={(e) =>
                    handleFormChange("currency", e.target.value || undefined)
                  }
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 appearance-none bg-white"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={formFilters.customerEmail || ""}
                onChange={(e) =>
                  handleFormChange("customerEmail", e.target.value || undefined)
                }
                disabled={loading}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={formFilters.customerName || ""}
                onChange={(e) =>
                  handleFormChange("customerName", e.target.value || undefined)
                }
                disabled={loading}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Number
              </label>
              <input
                type="text"
                value={formFilters.orderNumber || ""}
                onChange={(e) =>
                  handleFormChange("orderNumber", e.target.value || undefined)
                }
                disabled={loading}
                placeholder="123*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Advanced Filters
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={formFilters.customerId || ""}
                    onChange={(e) =>
                      handleFormChange(
                        "customerId",
                        e.target.value || undefined
                      )
                    }
                    disabled={loading}
                    placeholder="e5a0d684-a4af-4919-a348-f66b0b4955e0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={formFilters.accountId || ""}
                    onChange={(e) =>
                      handleFormChange("accountId", e.target.value || undefined)
                    }
                    disabled={loading}
                    placeholder="3d7200c9-a9bc-4085-9822-63e80fd94a09"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Member ID
                  </label>
                  <input
                    type="text"
                    value={formFilters.accountMemberId || ""}
                    onChange={(e) =>
                      handleFormChange(
                        "accountMemberId",
                        e.target.value || undefined
                      )
                    }
                    disabled={loading}
                    placeholder="2a8a3a92-2ccd-4b2b-a7af-52d3896eaecb"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formFilters.contactName || ""}
                    onChange={(e) =>
                      handleFormChange(
                        "contactName",
                        e.target.value || undefined
                      )
                    }
                    disabled={loading}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formFilters.contactEmail || ""}
                    onChange={(e) =>
                      handleFormChange(
                        "contactEmail",
                        e.target.value || undefined
                      )
                    }
                    disabled={loading}
                    placeholder="contact@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product ID
                  </label>
                  <input
                    type="text"
                    value={formFilters.productId || ""}
                    onChange={(e) =>
                      handleFormChange("productId", e.target.value || undefined)
                    }
                    disabled={loading}
                    placeholder="6837058c-ae42-46db-b3c6-7f01e0c34b40"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product SKU
                  </label>
                  <input
                    type="text"
                    value={formFilters.productSku || ""}
                    onChange={(e) =>
                      handleFormChange(
                        "productSku",
                        e.target.value || undefined
                      )
                    }
                    disabled={loading}
                    placeholder="deck-shoe-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Postcode
                  </label>
                  <input
                    type="text"
                    value={formFilters.shippingPostcode || ""}
                    onChange={(e) =>
                      handleFormChange(
                        "shippingPostcode",
                        e.target.value || undefined
                      )
                    }
                    disabled={loading}
                    placeholder="117*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Postcode
                  </label>
                  <input
                    type="text"
                    value={formFilters.billingPostcode || ""}
                    onChange={(e) =>
                      handleFormChange(
                        "billingPostcode",
                        e.target.value || undefined
                      )
                    }
                    disabled={loading}
                    placeholder="117*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    External Reference
                  </label>
                  <input
                    type="text"
                    value={formFilters.externalRef || ""}
                    onChange={(e) =>
                      handleFormChange(
                        "externalRef",
                        e.target.value || undefined
                      )
                    }
                    disabled={loading}
                    placeholder="16be*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Amount Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount with Tax
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={formFilters.withTaxMin || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "withTaxMin",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      disabled={loading}
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                    <input
                      type="number"
                      value={formFilters.withTaxMax || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "withTaxMax",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      disabled={loading}
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount without Tax
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={formFilters.withoutTaxMin || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "withoutTaxMin",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      disabled={loading}
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                    <input
                      type="number"
                      value={formFilters.withoutTaxMax || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "withoutTaxMax",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      disabled={loading}
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Date Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created Date Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={formFilters.createdFrom || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "createdFrom",
                          e.target.value || undefined
                        )
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                    <input
                      type="date"
                      value={formFilters.createdTo || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "createdTo",
                          e.target.value || undefined
                        )
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Updated Date Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={formFilters.updatedFrom || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "updatedFrom",
                          e.target.value || undefined
                        )
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                    <input
                      type="date"
                      value={formFilters.updatedTo || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "updatedTo",
                          e.target.value || undefined
                        )
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleClearFilters}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Find Orders"}
            </button>
          </div>
        </>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">
              Active filters:
            </span>
            {Object.entries(appliedFilters).map(([key, value]) => {
              if (value === undefined || value === "" || value === null)
                return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {key}: {value}
                  <button
                    onClick={() => {
                      // Remove from both form and applied filters
                      const newFormFilters = { ...formFilters };
                      const newAppliedFilters = { ...appliedFilters };
                      delete newFormFilters[key as keyof OrderFilterFormState];
                      delete newAppliedFilters[key as keyof OrderFilterState];
                      setFormFilters(newFormFilters);
                      setAppliedFilters(newAppliedFilters);
                      onFilterChange(newAppliedFilters);
                    }}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                  >
                    <span className="sr-only">Remove filter</span>
                    <svg
                      className="w-2 h-2"
                      fill="currentColor"
                      viewBox="0 0 8 8"
                    >
                      <path
                        d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
