"use client";

import React, { useState, useEffect } from "react";
import { useEpccApi } from "../../hooks/useEpccApi";
import { useToast } from "@/contexts/ToastContext";

interface ProductInventoryProps {
  productId: string;
  productSku?: string;
  selectedOrgId?: string;
  selectedStoreId?: string;
}

export const ProductInventory: React.FC<ProductInventoryProps> = ({
  productId,
  productSku,
  selectedOrgId,
  selectedStoreId,
}) => {
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [editingInventory, setEditingInventory] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);
  const [newInventory, setNewInventory] = useState({
    ep_available_date: "",
    ep_shelf_life_days: 0,
    ep_available: 0,
  });
  const [showNewInventoryForm, setShowNewInventoryForm] = useState(false);
  const { showToast } = useToast();

  const {
    fetchInventoryBySku,
    createInventory,
    updateInventory,
    deleteInventory,
  } = useEpccApi(selectedOrgId, selectedStoreId);

  // Utility functions
  const ensureInteger = (value: any): number => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  };

  const formatDateToISO = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString();
  };

  // Fetch inventory data
  const fetchInventory = async (sku: string) => {
    if (!sku) return;

    try {
      setInventoryLoading(true);

      const result = await fetchInventoryBySku(sku);
      if (result && result.data) {
        setInventoryData(result.data);
      } else {
        setInventoryData([]);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      showToast("Failed to fetch inventory data", "error");
    } finally {
      setInventoryLoading(false);
    }
  };

  // Load inventory when component mounts or SKU changes
  useEffect(() => {
    if (productSku) {
      fetchInventory(productSku);
    }
  }, [productSku]);

  // Edit inventory functions
  const startEditInventory = (inventory: any) => {
    setEditingInventory(inventory.id);
    setEditingQuantity(inventory.ep_available || 0);
  };

  const cancelEditInventory = () => {
    setEditingInventory(null);
    setEditingQuantity(0);
  };

  const saveInventoryQuantity = async (inventoryId: string) => {
    try {
      // Find the current inventory record to get existing values
      const currentInventory = inventoryData.find(
        (inv) => inv.id === inventoryId
      );
      if (!currentInventory) {
        showToast("Inventory record not found", "error");
        return;
      }

      const updatedData = {
        data: {
          type: "inventory_ext",
          id: currentInventory.ep_id,
          ep_id: currentInventory.ep_id,
          ep_available_date: currentInventory.ep_available_date,
          ep_sku: currentInventory.ep_sku,
          ep_available: ensureInteger(editingQuantity),
        },
      };

      const result = await updateInventory(currentInventory.ep_id, updatedData);
      if (result) {
        showToast("Inventory quantity updated successfully!", "success");
        setEditingInventory(null);
        setEditingQuantity(0);
        // Refresh inventory data
        if (productSku) {
          fetchInventory(productSku);
        }
      } else {
        showToast("Failed to update inventory quantity", "error");
      }
    } catch (err) {
      showToast("Failed to update inventory quantity", "error");
      console.error("Error updating inventory quantity:", err);
    }
  };

  // Inventory management functions
  const handleCreateInventory = async () => {
    try {
      // Convert available date to ISO format if provided
      const formattedAvailableDate = formatDateToISO(
        newInventory.ep_available_date
      );

      const inventoryData = {
        data: {
          type: "inventory_ext",
          ...newInventory,
          ep_id: productSku + newInventory.ep_available_date,
          ep_shelf_life_days: ensureInteger(newInventory.ep_shelf_life_days),
          ep_available_date: formattedAvailableDate,
          ep_sku: productSku || "",
        },
      };

      const result = await createInventory(inventoryData);
      if (result) {
        showToast("Inventory record created successfully!", "success");
        setShowNewInventoryForm(false);
        setNewInventory({
          ep_available_date: "",
          ep_shelf_life_days: 0,
          ep_available: 0,
        });
        // Refresh inventory data
        if (productSku) {
          fetchInventory(productSku);
        }
      } else {
        showToast("Failed to create inventory record", "error");
      }
    } catch (err) {
      showToast("Failed to create inventory record", "error");
      console.error("Error creating inventory:", err);
    }
  };

  const handleDeleteInventory = async (inventoryId: string) => {
    try {
      const currentInventory = inventoryData.find(
        (inv) => inv.id === inventoryId
      );
      if (!currentInventory) {
        showToast("Inventory record not found", "error");
        return;
      }

      const result = await deleteInventory(currentInventory.ep_id);
      if (result) {
        showToast("Inventory record deleted successfully!", "success");
        // Refresh inventory data
        if (productSku) {
          fetchInventory(productSku);
        }
      } else {
        showToast("Failed to delete inventory record", "error");
      }
    } catch (err) {
      showToast("Failed to delete inventory record", "error");
      console.error("Error deleting inventory:", err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Inventory Records</h2>

      {/* Add New Inventory Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowNewInventoryForm(!showNewInventoryForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Inventory
        </button>
      </div>

      {/* New Inventory Form */}
      {showNewInventoryForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Inventory Record
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="ep_available_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Available Date *
              </label>
              <input
                type="date"
                id="ep_available_date"
                value={newInventory.ep_available_date}
                onChange={(e) =>
                  setNewInventory({
                    ...newInventory,
                    ep_available_date: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="ep_shelf_life_days"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Shelf Life (Days)
              </label>
              <input
                type="number"
                id="ep_shelf_life_days"
                value={newInventory.ep_shelf_life_days}
                onChange={(e) =>
                  setNewInventory({
                    ...newInventory,
                    ep_shelf_life_days: ensureInteger(e.target.value),
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0"
                min="0"
                step="1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter whole number of days (e.g., 30, 90, 365)
              </p>
            </div>
            <div>
              <label
                htmlFor="ep_available"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Available Quantity *
              </label>
              <input
                type="number"
                id="ep_available"
                value={newInventory.ep_available}
                onChange={(e) =>
                  setNewInventory({
                    ...newInventory,
                    ep_available: ensureInteger(e.target.value),
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setShowNewInventoryForm(false)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateInventory}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Inventory
            </button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      {inventoryLoading ? (
        <div className="text-center py-12">
          <svg
            className="animate-spin h-12 w-12 text-indigo-600 mx-auto"
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
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      ) : inventoryData.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="h-12 w-12 text-gray-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <p className="mt-4 text-gray-600">
            No inventory records found for this product.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  SKU
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Available Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Shelf Life (Days)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Available Quantity
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryData.map((inventory) => (
                <tr
                  key={inventory.id}
                  className={`${
                    editingInventory === inventory.id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {inventory.ep_sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inventory.ep_available_date
                      ? new Date(
                          inventory.ep_available_date
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inventory.ep_shelf_life_days}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingInventory === inventory.id ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 mb-1">
                            Edit Quantity:
                          </label>
                          <input
                            type="number"
                            value={editingQuantity}
                            onChange={(e) =>
                              setEditingQuantity(ensureInteger(e.target.value))
                            }
                            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            min="0"
                            step="1"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => saveInventoryQuantity(inventory.id)}
                            className="text-green-600 hover:text-green-900 text-xs font-medium px-2 py-1 bg-green-50 rounded hover:bg-green-100"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditInventory}
                            className="text-gray-600 hover:text-gray-900 text-xs font-medium px-2 py-1 bg-gray-50 rounded hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (inventory.ep_available || 0) > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {inventory.ep_available || 0}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => startEditInventory(inventory)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInventory(inventory.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
