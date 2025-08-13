"use client";

import React, { useState, useEffect } from "react";
import { useEpccApi } from "../../hooks/useEpccApi";
import { useToast } from "../../contexts/ToastContext";

interface ProductPricingProps {
  productSku?: string;
  selectedOrgId?: string;
  selectedStoreId?: string;
}

export const ProductPricing: React.FC<ProductPricingProps> = ({
  productSku,
  selectedOrgId,
  selectedStoreId,
}) => {
  const {
    fetchPricesBySKU,
    fetchAllPricebooks,
    fetchCurrencies,
    updatePrice,
    createPrice,
  } = useEpccApi(selectedOrgId, selectedStoreId);
  const { showToast } = useToast();

  const [prices, setPrices] = useState<any[]>([]);
  const [pricebooks, setPricebooks] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [editingPrice, setEditingPrice] = useState<{
    priceId: string;
    pricebookId: string;
    currentAmount: number;
  } | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>(
    {}
  );
  const [updating, setUpdating] = useState(false);

  // New price creation state
  const [showNewPriceForm, setShowNewPriceForm] = useState(false);
  const [newPricePricebookId, setNewPricePricebookId] = useState<string>("");
  const [newPriceValues, setNewPriceValues] = useState<Record<string, string>>(
    {}
  );
  const [creatingNewPrice, setCreatingNewPrice] = useState(false);

  useEffect(() => {
    if (productSku) {
      loadAllData();
    }
  }, [productSku, selectedOrgId, selectedStoreId]);

  const loadAllData = async () => {
    if (!productSku) return;

    setLoading(true);
    setError(null);

    try {
      const [pricesData, pricebooksData, currenciesData] = await Promise.all([
        fetchPricesBySKU(productSku),
        fetchAllPricebooks(),
        fetchCurrencies(),
      ]);

      if (pricesData && pricesData.data) {
        setPrices(pricesData.data);
      }

      if (pricebooksData && pricebooksData.data) {
        setPricebooks(pricebooksData.data);
      }

      if (currenciesData && currenciesData.data) {
        setCurrencies(currenciesData.data);
      }
    } catch (err) {
      setError("Failed to load pricing data");
      console.error("Error loading pricing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPricebookName = (pricebookId: string) => {
    const pricebook = pricebooks.find((pb) => pb.id === pricebookId);
    return pricebook?.attributes?.name || pricebookId;
  };

  // Get unattached pricebooks (pricebooks that don't have prices for this product)
  const getUnattachedPricebooks = () => {
    const attachedPricebookIds = new Set(
      prices.map((p) => p.meta?.pricebook_id).filter(Boolean)
    );
    return pricebooks.filter((pb) => !attachedPricebookIds.has(pb.id));
  };

  const startNewPriceCreation = () => {
    setShowNewPriceForm(true);
    setNewPricePricebookId("");

    // Initialize new price values for all currencies
    const initialValues: Record<string, string> = {};
    currencies.forEach((currency) => {
      const currencyCode = currency.code || currency.id;
      initialValues[currencyCode] = "0.00";
    });
    setNewPriceValues(initialValues);
  };

  const cancelNewPriceCreation = () => {
    setShowNewPriceForm(false);
    setNewPricePricebookId("");
    setNewPriceValues({});
  };

  const handleNewPriceCreation = async () => {
    if (!newPricePricebookId || !productSku) return;

    setCreatingNewPrice(true);
    try {
      // Prepare the new price body
      const newPriceBody: Record<string, any> = {};
      for (const currencyCode in newPriceValues) {
        const newAmount = parseCurrencyInput(
          newPriceValues[currencyCode],
          currencyCode
        );
        if (isNaN(newAmount)) {
          showToast("Invalid price amount for one or more currencies", "error");
          return;
        }
        newPriceBody[currencyCode] = {
          amount: newAmount,
          include_tax: true,
        };
      }

      // Create new price record
      const result = await createPrice(newPricePricebookId, {
        type: "product-price",
        attributes: {
          sku: productSku,
          currencies: newPriceBody,
        },
      });

      if (result) {
        showToast("New price record created successfully", "success");
        // Refresh the data
        await loadAllData();
        cancelNewPriceCreation();
      }
    } catch (err) {
      showToast("Failed to create new price record", "error");
      console.error("Error creating new price record:", err);
    } finally {
      setCreatingNewPrice(false);
    }
  };

  const getPriceForCurrency = (pricebookId: string, currencyCode: string) => {
    const price = prices.find(
      (p) =>
        p.meta?.pricebook_id === pricebookId &&
        p.attributes.currencies?.[currencyCode]
    );

    if (price?.attributes.currencies?.[currencyCode]) {
      const currencyData = price.attributes.currencies[currencyCode];
      return currencyData.amount;
    }
    return null;
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    // Convert from integer (e.g., 10000) to display format (e.g., £100.00)
    const displayAmount = amount / 100;

    // Format based on currency
    switch (currencyCode.toUpperCase()) {
      case "GBP":
        return `£${displayAmount.toFixed(2)}`;
      case "USD":
        return `$${displayAmount.toFixed(2)}`;
      case "EUR":
        return `€${displayAmount.toFixed(2)}`;
      default:
        return `${currencyCode} ${displayAmount.toFixed(2)}`;
    }
  };

  const parseCurrencyInput = (input: string, currencyCode: string) => {
    // Remove currency symbols and convert to integer (e.g., £100.00 -> 10000)
    const cleanInput = input.replace(/[£$€,\s]/g, "");
    const amount = parseFloat(cleanInput);
    return Math.round(amount * 100);
  };

  const startEditing = (pricebookId: string) => {
    // Find any price ID for this pricebook, regardless of currency
    const price = prices.find((p) => p.meta?.pricebook_id === pricebookId);
    const priceId = price?.id;

    if (priceId) {
      // Initialize editing values for all currencies in this pricebook
      const initialValues: Record<string, string> = {};
      currencies.forEach((currency) => {
        const currencyCode = currency.code || currency.id;
        const currentAmount = getPriceForCurrency(pricebookId, currencyCode);
        if (currentAmount !== null) {
          initialValues[currencyCode] = (currentAmount / 100).toFixed(2);
        } else {
          initialValues[currencyCode] = "0.00";
        }
      });

      setEditingPrice({
        priceId,
        pricebookId,
        currentAmount: 0,
      });
      setEditingValues(initialValues);
    }
  };

  const cancelEditing = () => {
    setEditingPrice(null);
    setEditingValues({});
  };

  const handlePriceUpdate = async () => {
    if (!editingPrice || Object.keys(editingValues).length === 0) return;

    setUpdating(true);
    try {
      const updateBody: Record<string, any> = {};
      for (const currencyCode in editingValues) {
        const newAmount = parseCurrencyInput(
          editingValues[currencyCode],
          currencyCode
        );
        if (isNaN(newAmount)) {
          showToast("Invalid price amount for one or more currencies", "error");
          return;
        }
        updateBody[currencyCode] = {
          amount: newAmount,
          include_tax: true,
        };
      }

      const result = await updatePrice(
        editingPrice.priceId,
        editingPrice.pricebookId,
        {
          type: "product-price",
          id: editingPrice.priceId,
          attributes: {
            sku: productSku,
            currencies: updateBody,
          },
        }
      );

      if (result) {
        showToast("Price updated successfully", "success");
        // Refresh the data
        await loadAllData();
        cancelEditing();
      }
    } catch (err) {
      showToast("Failed to update price", "error");
      console.error("Error updating price:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (!productSku) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No product SKU provided</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading pricing data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-md">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!prices.length) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Product Pricing
            </h3>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={startNewPriceCreation}
              disabled={getUnattachedPricebooks().length === 0}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Price
            </button>
            <button
              onClick={loadAllData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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

        {/* No Prices Message */}
        <div className="text-center py-8">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md">
            <svg
              className="w-5 h-5 mr-2"
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
            <h3 className="mt-2 text-sm font-medium text-yellow-800">
              No Pricing Found
            </h3>
          </div>
        </div>

        {/* New Price Creation Form */}
        {showNewPriceForm && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h4 className="text-lg font-medium text-gray-900">
                Create New Price
              </h4>
              <p className="text-sm text-gray-600">
                Add pricing for a new pricebook
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pricebook Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Pricebook
                  </label>
                  <select
                    value={newPricePricebookId}
                    onChange={(e) => setNewPricePricebookId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={creatingNewPrice}
                  >
                    <option value="">Select Pricebook</option>
                    {getUnattachedPricebooks().map((pricebook) => (
                      <option key={pricebook.id} value={pricebook.id}>
                        {pricebook.attributes?.name || pricebook.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency Inputs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency Prices
                  </label>
                  <div className="space-y-2">
                    {currencies.map((currency) => {
                      const currencyCode = currency.code || currency.id;
                      return (
                        <div
                          key={currency.id}
                          className="flex items-center space-x-2"
                        >
                          <span className="text-sm font-medium text-gray-600 w-12">
                            {currencyCode.toUpperCase()}:
                          </span>
                          <input
                            type="text"
                            value={newPriceValues[currencyCode] || ""}
                            onChange={(e) =>
                              setNewPriceValues({
                                ...newPriceValues,
                                [currencyCode]: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            disabled={creatingNewPrice}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={cancelNewPriceCreation}
                  disabled={creatingNewPrice}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewPriceCreation}
                  disabled={!newPricePricebookId || creatingNewPrice}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {creatingNewPrice ? "Creating..." : "Create Price"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Get unique pricebook IDs from prices
  const uniquePricebookIds = Array.from(
    new Set(prices.map((p) => p.meta?.pricebook_id).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Product Pricing
          </h3>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={startNewPriceCreation}
            disabled={getUnattachedPricebooks().length === 0}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Price
          </button>
          <button
            onClick={loadAllData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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

      {/* Pricing Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Book
                </th>
                {currencies.map((currency) => (
                  <th
                    key={currency.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {currency.code?.toUpperCase() || currency.id}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uniquePricebookIds.map((pricebookId) => {
                const price = prices.find(
                  (p) => p.meta?.pricebook_id === pricebookId
                );
                return (
                  <tr key={pricebookId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getPricebookName(pricebookId!)}
                    </td>
                    {currencies.map((currency) => {
                      const currencyCode = currency.code || currency.id;
                      const priceAmount = getPriceForCurrency(
                        pricebookId!,
                        currencyCode
                      );
                      const isEditing =
                        editingPrice?.pricebookId === pricebookId;

                      return (
                        <td
                          key={currency.id}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingValues[currencyCode] || ""}
                              onChange={(e) =>
                                setEditingValues({
                                  ...editingValues,
                                  [currencyCode]: e.target.value,
                                })
                              }
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="0.00"
                              disabled={updating}
                            />
                          ) : (
                            <span className="font-mono">
                              {priceAmount ? (
                                formatCurrency(priceAmount, currencyCode)
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingPrice?.pricebookId === pricebookId ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={handlePriceUpdate}
                            disabled={updating}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {updating ? "..." : "Save"}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={updating}
                            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(pricebookId!)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Edit all prices for this pricebook"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Price Creation Form */}
      {showNewPriceForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h4 className="text-lg font-medium text-gray-900">
              Create New Price
            </h4>
            <p className="text-sm text-gray-600">
              Add pricing for a new pricebook
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pricebook Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pricebook
                </label>
                <select
                  value={newPricePricebookId}
                  onChange={(e) => setNewPricePricebookId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creatingNewPrice}
                >
                  <option value="">Select Pricebook</option>
                  {getUnattachedPricebooks().map((pricebook) => (
                    <option key={pricebook.id} value={pricebook.id}>
                      {pricebook.attributes?.name || pricebook.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency Inputs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Prices
                </label>
                <div className="space-y-2">
                  {currencies.map((currency) => {
                    const currencyCode = currency.code || currency.id;
                    return (
                      <div
                        key={currency.id}
                        className="flex items-center space-x-2"
                      >
                        <span className="text-sm font-medium text-gray-600 w-12">
                          {currencyCode.toUpperCase()}:
                        </span>
                        <input
                          type="text"
                          value={newPriceValues[currencyCode] || ""}
                          onChange={(e) =>
                            setNewPriceValues({
                              ...newPriceValues,
                              [currencyCode]: e.target.value,
                            })
                          }
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={creatingNewPrice}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={cancelNewPriceCreation}
                disabled={creatingNewPrice}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNewPriceCreation}
                disabled={!newPricePricebookId || creatingNewPrice}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {creatingNewPrice ? "Creating..." : "Create Price"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
