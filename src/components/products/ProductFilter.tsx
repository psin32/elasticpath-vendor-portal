"use client";

import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export interface ProductFilterState {
  // Basic filters
  name?: string;
  sku?: string;
  slug?: string;
  upc_ean?: string;
  manufacturer_part_num?: string;
  description?: string;
  external_ref?: string;

  // Status and type filters
  status?: string;
  commodity_type?: string;
  product_types?: string;

  // Relationship filters
  parent_id?: string;
  tags?: string;
  templates?: string;
  owner?: string;

  // Date filters
  created_at_from?: string;
  created_at_to?: string;
  updated_at_from?: string;
  updated_at_to?: string;

  // ID filters
  id_from?: string;
  id_to?: string;

  // Special filters
  has_nodes?: boolean;
}

export interface ProductFilterFormState {
  // Basic filters
  name?: string;
  sku?: string;
  slug?: string;
  upc_ean?: string;
  manufacturer_part_num?: string;
  description?: string;
  external_ref?: string;

  // Status and type filters
  status?: string;
  commodity_type?: string;
  product_types?: string;

  // Relationship filters
  parent_id?: string;
  tags?: string;
  templates?: string;
  owner?: string;

  // Date filters
  created_at_from?: string;
  created_at_to?: string;
  updated_at_from?: string;
  updated_at_to?: string;

  // ID filters
  id_from?: string;
  id_to?: string;

  // Special filters
  has_nodes?: boolean;
}

interface ProductFilterProps {
  onFilterChange: (filters: ProductFilterState) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "live", label: "Live" },
  { value: "draft", label: "Draft" },
];

const commodityTypeOptions = [
  { value: "", label: "All Types" },
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
];

const productTypeOptions = [
  { value: "", label: "All Product Types" },
  { value: "standard", label: "Standard" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "bundle", label: "Bundle" },
];

export default function ProductFilter({
  onFilterChange,
  onClearFilters,
  loading = false,
}: ProductFilterProps) {
  const [formFilters, setFormFilters] = useState<ProductFilterFormState>({});
  const [appliedFilters, setAppliedFilters] = useState<ProductFilterState>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFormChange = (
    field: keyof ProductFilterFormState,
    value: any
  ) => {
    setFormFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    // Clean up empty values
    const cleanedFilters: ProductFilterState = {};

    Object.entries(formFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        if (key === "has_nodes") {
          (cleanedFilters as any)[key] = value as boolean;
        } else {
          (cleanedFilters as any)[key] = value as string;
        }
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

  const hasFilters = Object.keys(appliedFilters).length > 0;

  const removeFilter = (key: keyof ProductFilterState) => {
    const newFormFilters = { ...formFilters };
    const newAppliedFilters = { ...appliedFilters };
    delete newFormFilters[key as keyof ProductFilterFormState];
    delete newAppliedFilters[key as keyof ProductFilterState];
    setFormFilters(newFormFilters);
    setAppliedFilters(newAppliedFilters);
    onFilterChange(newAppliedFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter Products</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {isExpanded ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {/* Filter Form - Only show when expanded */}
      {isExpanded && (
        <>
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formFilters.name || ""}
                onChange={(e) => handleFormChange("name", e.target.value)}
                disabled={loading}
                placeholder="Product name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={formFilters.sku || ""}
                onChange={(e) => handleFormChange("sku", e.target.value)}
                disabled={loading}
                placeholder="Product SKU"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

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
                Commodity Type
              </label>
              <div className="relative">
                <select
                  value={formFilters.commodity_type || ""}
                  onChange={(e) =>
                    handleFormChange(
                      "commodity_type",
                      e.target.value || undefined
                    )
                  }
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 appearance-none bg-white"
                >
                  {commodityTypeOptions.map((option) => (
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
                Product Type
              </label>
              <div className="relative">
                <select
                  value={formFilters.product_types || ""}
                  onChange={(e) =>
                    handleFormChange(
                      "product_types",
                      e.target.value || undefined
                    )
                  }
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 appearance-none bg-white"
                >
                  {productTypeOptions.map((option) => (
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
                UPC/EAN
              </label>
              <input
                type="text"
                value={formFilters.upc_ean || ""}
                onChange={(e) => handleFormChange("upc_ean", e.target.value)}
                disabled={loading}
                placeholder="UPC/EAN code"
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

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
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
                      Filtering Tips
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong>Name/SKU/Slug:</strong> Use wildcards like{" "}
                          <code>*swan*</code> for partial matches
                        </li>
                        <li>
                          <strong>Dates:</strong> Use ISO format (YYYY-MM-DD)
                          for date filtering
                        </li>
                        <li>
                          <strong>Tags:</strong> Use comma-separated values for
                          multiple tags
                        </li>
                        <li>
                          <strong>Examples:</strong>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>
                              • Name: <code>*swan*</code> (contains "swan")
                            </li>
                            <li>
                              • SKU: <code>SWAN*</code> (starts with "SWAN")
                            </li>
                            <li>
                              • Tags: <code>electronics,phone</code> (multiple
                              tags)
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formFilters.slug || ""}
                    onChange={(e) => handleFormChange("slug", e.target.value)}
                    disabled={loading}
                    placeholder="Product slug"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer Part Number
                  </label>
                  <input
                    type="text"
                    value={formFilters.manufacturer_part_num || ""}
                    onChange={(e) =>
                      handleFormChange("manufacturer_part_num", e.target.value)
                    }
                    disabled={loading}
                    placeholder="Manufacturer part number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formFilters.description || ""}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                    disabled={loading}
                    placeholder="Product description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    External Reference
                  </label>
                  <input
                    type="text"
                    value={formFilters.external_ref || ""}
                    onChange={(e) =>
                      handleFormChange("external_ref", e.target.value)
                    }
                    disabled={loading}
                    placeholder="External reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent ID
                  </label>
                  <input
                    type="text"
                    value={formFilters.parent_id || ""}
                    onChange={(e) =>
                      handleFormChange("parent_id", e.target.value)
                    }
                    disabled={loading}
                    placeholder="Parent product ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formFilters.tags || ""}
                    onChange={(e) => handleFormChange("tags", e.target.value)}
                    disabled={loading}
                    placeholder="Comma-separated tags"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Templates
                  </label>
                  <input
                    type="text"
                    value={formFilters.templates || ""}
                    onChange={(e) =>
                      handleFormChange("templates", e.target.value)
                    }
                    disabled={loading}
                    placeholder="Product templates"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner
                  </label>
                  <input
                    type="text"
                    value={formFilters.owner || ""}
                    onChange={(e) => handleFormChange("owner", e.target.value)}
                    disabled={loading}
                    placeholder="Product owner"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created From
                  </label>
                  <input
                    type="date"
                    value={formFilters.created_at_from || ""}
                    onChange={(e) =>
                      handleFormChange("created_at_from", e.target.value)
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created To
                  </label>
                  <input
                    type="date"
                    value={formFilters.created_at_to || ""}
                    onChange={(e) =>
                      handleFormChange("created_at_to", e.target.value)
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Updated From
                  </label>
                  <input
                    type="date"
                    value={formFilters.updated_at_from || ""}
                    onChange={(e) =>
                      handleFormChange("updated_at_from", e.target.value)
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Updated To
                  </label>
                  <input
                    type="date"
                    value={formFilters.updated_at_to || ""}
                    onChange={(e) =>
                      handleFormChange("updated_at_to", e.target.value)
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID From
                  </label>
                  <input
                    type="text"
                    value={formFilters.id_from || ""}
                    onChange={(e) =>
                      handleFormChange("id_from", e.target.value)
                    }
                    disabled={loading}
                    placeholder="Starting ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID To
                  </label>
                  <input
                    type="text"
                    value={formFilters.id_to || ""}
                    onChange={(e) => handleFormChange("id_to", e.target.value)}
                    disabled={loading}
                    placeholder="Ending ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="has_nodes"
                    checked={formFilters.has_nodes || false}
                    onChange={(e) =>
                      handleFormChange("has_nodes", e.target.checked)
                    }
                    disabled={loading}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="has_nodes"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Has Nodes (false only)
                  </label>
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
              {loading ? "Loading..." : "Find Products"}
            </button>
          </div>
        </>
      )}

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Active Filters:
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(appliedFilters).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {key}: {String(value)}
                <button
                  onClick={() => removeFilter(key as keyof ProductFilterState)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
