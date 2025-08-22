"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mapping, MappingDataset } from "@/types/mapping";
import { useMappingManager } from "@/hooks/useMappingManager";
import { useToast } from "@/contexts/ToastContext";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";

type ViewMode = "mappings";

const MappingPage: React.FC = () => {
  const router = useRouter();
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const {
    checkCustomAPIBySlug,
    createMappingAPI,
    createMappingFieldsAPI,
    fetchAllMappings,
    fetchMappingsFields,
    deleteMapping: deleteMappingFromAPI,
    deleteMappingField: deleteMappingFieldFromAPI,
  } = useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);

  const {
    mappings,
    datasets,
    deleteMapping,
    deleteDataset,

    exportDatasetToCSV,
    exportDatasetToJSON,
  } = useMappingManager();

  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>("mappings");

  const [customApiExists, setCustomApiExists] = useState<boolean | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [apiMappings, setApiMappings] = useState<any[]>([]);
  const [apiMappingsFields, setApiMappingsFields] = useState<{
    [key: string]: any[];
  }>({});
  const [loadingMappings, setLoadingMappings] = useState(false);

  // Check if custom API exists on component mount
  useEffect(() => {
    if (selectedOrgId && selectedStoreId) {
      checkCustomAPIStatus();
    }
  }, [selectedOrgId, selectedStoreId]);

  const checkCustomAPIStatus = async () => {
    try {
      const result = await checkCustomAPIBySlug("mappings");
      setCustomApiExists(result.exists);

      // If custom API exists, fetch mappings
      if (result.exists) {
        await fetchMappingsFromAPI();
      }
    } catch (error) {
      console.error("Error checking custom API status:", error);
      setCustomApiExists(false);
    }
  };

  const fetchMappingsFromAPI = async () => {
    if (!selectedOrgId || !selectedStoreId) return;

    setLoadingMappings(true);
    try {
      // Fetch all mappings
      const mappingsResult = await fetchAllMappings();
      if (mappingsResult?.data) {
        const mappings = mappingsResult.data;
        setApiMappings(mappings);

        // Fetch fields for each mapping
        const fieldsPromises = mappings.map(async (mapping: any) => {
          const fieldsResult = await fetchMappingsFields(mapping.id);
          return {
            mappingId: mapping.id,
            fields: fieldsResult?.data || [],
          };
        });

        const fieldsResults = await Promise.all(fieldsPromises);
        const fieldsMap: { [key: string]: any[] } = {};
        fieldsResults.forEach((result) => {
          fieldsMap[result.mappingId] = result.fields;
        });

        setApiMappingsFields(fieldsMap);
      }
    } catch (error) {
      console.error("Error fetching mappings from API:", error);
      showToast("Failed to fetch mappings from API", "error");
    } finally {
      setLoadingMappings(false);
    }
  };

  const handleSetupCustomAPI = async () => {
    if (!selectedOrgId || !selectedStoreId) {
      showToast("Please select an organization and store first", "error");
      return;
    }

    setIsSettingUp(true);
    try {
      // Create the mappings custom API
      const mappingApiResult = await createMappingAPI();
      if (!mappingApiResult?.flow) {
        throw new Error("Failed to create mappings custom API");
      }

      // Create the mappings fields custom API
      const fieldsApiResult = await createMappingFieldsAPI();
      if (!fieldsApiResult?.flow) {
        throw new Error("Failed to create mappings fields custom API");
      }

      showToast("Custom APIs setup completed successfully!", "success");
      setCustomApiExists(true);
    } catch (error) {
      console.error("Error setting up custom APIs:", error);
      showToast("Failed to setup custom APIs. Please try again.", "error");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleCreateMapping = () => {
    router.push("/upload/mapping/create");
  };

  const handleEditMapping = (mapping: Mapping) => {
    router.push(`/upload/mapping/${mapping.id}`);
  };

  const handleDeleteMapping = async (mapping: Mapping) => {
    if (
      confirm(
        `Are you sure you want to delete "${mapping.name}"? This will also delete all associated datasets and fields.`
      )
    ) {
      try {
        // Find the API mapping data to get the actual mapping ID
        const apiMapping = apiMappings.find((m: any) => m.id === mapping.id);
        if (!apiMapping) {
          throw new Error("Mapping not found in API data");
        }

        // Get all fields for this mapping
        const mappingFields = apiMappingsFields[mapping.id] || [];

        // Delete all mapping fields first
        if (mappingFields.length > 0) {
          const deleteFieldPromises = mappingFields.map(async (field: any) => {
            try {
              await deleteMappingFieldFromAPI(field.id);
            } catch (error) {
              console.warn(`Failed to delete field ${field.name}:`, error);
            }
          });

          await Promise.all(deleteFieldPromises);
        }

        // Delete the mapping
        await deleteMappingFromAPI(mapping.id);

        // Also delete from local storage for datasets
        deleteMapping(mapping.id);

        // Clean up any local datasets associated with this mapping
        const associatedDatasets = datasets.filter(
          (dataset) => dataset.mappingId === mapping.id
        );
        associatedDatasets.forEach((dataset) => {
          deleteDataset(dataset.id);
        });

        showToast("Mapping and all fields deleted successfully", "success");

        // Refresh mappings from API
        await fetchMappingsFromAPI();
      } catch (error) {
        console.error("Error deleting mapping:", error);
        showToast("Failed to delete mapping", "error");
      }
    }
  };

  const handleCreateDataset = (mapping: any) => {
    // Navigate to the dataset creation page
    router.push(`/upload/mapping/${mapping.id}/dataset/create`);
  };

  const handleOpenDataset = (dataset: MappingDataset) => {
    // Navigate to the dataset editor page
    router.push(`/upload/mapping/${dataset.mappingId}/dataset/${dataset.id}`);
  };

  const handleDeleteDataset = (dataset: MappingDataset) => {
    if (confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      deleteDataset(dataset.id);
      showToast("Dataset deleted successfully", "success");
    }
  };

  // Show setup message if custom API doesn't exist
  if (customApiExists === false) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Mapping Setup Required
            </h1>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              The mapping system requires custom APIs to be set up in your
              Elastic Path store. These APIs will enable you to create and
              manage mappings with custom fields.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="text-lg font-medium text-blue-900 mb-3">
                What will be created:
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <strong>Mappings API:</strong> For managing mapping
                  definitions
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <strong>Mapping Fields API:</strong> For managing individual
                  field definitions
                </li>
              </ul>
            </div>
            <button
              onClick={handleSetupCustomAPI}
              disabled={isSettingUp}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSettingUp ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Setting up...
                </div>
              ) : (
                "Setup Custom APIs"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking custom API status
  if (customApiExists === null) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg
                className="animate-spin h-6 w-6 text-gray-600"
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
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Checking System Status
            </h1>
            <p className="text-gray-600">Verifying custom API setup...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderMappingsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapping</h1>
          <p className="text-gray-600">
            Create and manage data templates with field mapping for bulk
            operations
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleCreateMapping}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Mapping
          </button>
        </div>
      </div>

      {/* Mappings Grid */}
      {loadingMappings ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading mappings from API...</p>
          </div>
        </div>
      ) : apiMappings.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No mappings found
          </h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first mapping or loading sample
            mappings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiMappings.map((mapping) => {
            const mappingFields = apiMappingsFields[mapping.id] || [];
            const mappingDatasets = datasets.filter(
              (d) => d.mappingId === mapping.id
            );
            return (
              <div
                key={mapping.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {mapping.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {mapping.entity_type || mapping.entityType}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditMapping(mapping)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit Mapping"
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
                    <button
                      onClick={() => handleDeleteMapping(mapping)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete Mapping"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {mapping.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {mapping.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">{mappingFields.length}</span>{" "}
                    fields
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {mappingFields.slice(0, 3).map((field: any) => (
                      <span
                        key={field.id}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {field.label}
                      </span>
                    ))}
                    {mappingFields.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{mappingFields.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleCreateDataset(mapping)}
                      className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Create Dataset
                    </button>

                    {mappingDatasets.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {mappingDatasets.length} existing dataset(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {apiMappings.length === 0 && (
            <div className="col-span-full text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No mapping mappings yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first mapping mapping to get started with structured
                data entry and field mapping.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateMapping}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Mapping
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Datasets Section */}
      {datasets.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Recent Datasets
          </h2>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dataset Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mapping
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rows
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datasets.map((dataset) => {
                    const mapping = mappings.find(
                      (m) => m.id === dataset.mappingId
                    );
                    return (
                      <tr key={dataset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {dataset.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {mapping?.name || "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {dataset.rows.length}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(dataset.updatedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOpenDataset(dataset)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => exportDatasetToCSV(dataset.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              CSV
                            </button>
                            <button
                              onClick={() => exportDatasetToJSON(dataset.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => handleDeleteDataset(dataset)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {viewMode === "mappings" && renderMappingsView()}
      </div>
    </div>
  );
};

export default MappingPage;
