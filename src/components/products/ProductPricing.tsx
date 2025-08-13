"use client";

import React, { useState, useEffect } from "react";
import { useEpccApi } from "../../hooks/useEpccApi";

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
  const [prices, setPrices] = useState<any[]>([]);
  const [pricebooks, setPricebooks] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { fetchPricesBySKU, fetchAllPricebooks, fetchCurrencies } = useEpccApi(
    selectedOrgId,
    selectedStoreId
  );

  useEffect(() => {
    if (productSku) {
      loadAllData();
    }
  }, [productSku]);

  const loadAllData = async () => {
    if (!productSku) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [pricesData, pricebooksData, currenciesData] = await Promise.all([
        fetchPricesBySKU(productSku),
        fetchAllPricebooks(),
        fetchCurrencies(),
      ]);
      console.log("pricesData", pricesData);
      console.log("pricebooksData", pricebooksData);
      console.log("currenciesData", currenciesData);

      if (pricesData && pricesData.data) {
        setPrices(pricesData.data);
      } else {
        setPrices([]);
      }

      if (pricebooksData && pricebooksData.data) {
        setPricebooks(pricebooksData.data);
      } else {
        setPricebooks([]);
      }

      if (currenciesData && currenciesData.data) {
        setCurrencies(currenciesData.data);
      } else {
        setCurrencies([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch pricing data");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getPricebookName = (pricebookId: string) => {
    const pricebook = pricebooks.find((pb) => pb.id === pricebookId);
    return pricebook?.attributes?.name || pricebookId;
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

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amount / 100); // Assuming amount is in cents
    } catch {
      return `${amount / 100} ${currency.toUpperCase()}`;
    }
  };

  if (!productSku) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No product SKU available to fetch pricing
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="mt-2 text-gray-600">Loading pricing information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <svg
            className="h-12 w-12 text-yellow-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-yellow-800">
            No Pricing Found
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            No pricing information found for SKU:{" "}
            <span className="font-mono">{productSku}</span>
          </p>
          <p className="mt-2 text-xs text-yellow-600">
            Pricing may need to be configured in your price books
          </p>
        </div>
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
                      return (
                        <td
                          key={currency.id}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {priceAmount ? (
                            <span className="font-mono">
                              {formatCurrency(priceAmount, currencyCode)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
