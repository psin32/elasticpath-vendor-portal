"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mapping, MappingField, MappingData } from "@/types/mapping";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import { useMappingManager } from "@/hooks/useMappingManager";
import MappingDataGrid from "@/components/mapping/MappingDataGrid";

const CreateDatasetPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const { fetchMapping, fetchMappingsFields, fetchCustomAPIFilteredData } =
    useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);
  const { showToast } = useToast();
  const { createDataset, validateRow } = useMappingManager();

  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [mappingFields, setMappingFields] = useState<any[]>([]);
  const [datasetName, setDatasetName] = useState("");
  const [datasetData, setDatasetData] = useState<MappingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state for custom API
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState<string>("eq");
  const [filterField, setFilterField] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [uploading, setUploading] = useState(false);

  const mappingId = params.mappingId as string;

  // Fetch mapping and fields on component mount
  useEffect(() => {
    if (selectedStoreId && mappingId) {
      fetchMappingAndFields();
    }
  }, [selectedOrgId, selectedStoreId, mappingId]);

  const fetchMappingAndFields = async () => {
    if (!selectedStoreId || !mappingId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch the specific mapping by ID
      const mappingResult = await fetchMapping(mappingId);
      if (!mappingResult?.data) {
        throw new Error("Failed to fetch mapping");
      }

      const foundMapping = mappingResult.data;

      // Fetch fields for this mapping
      const fieldsResult = await fetchMappingsFields(mappingId);
      let fields = fieldsResult?.data || [];

      // Sort fields by sequence (from mapping_fields) for proper ordering
      if (fields.length > 0) {
        fields = fields.sort((a: any, b: any) => {
          const sequenceA = a.sequence ?? 0;
          const sequenceB = b.sequence ?? 0;
          // Lower sequence numbers should appear first (ascending order)
          return sequenceA - sequenceB;
        });
      }

      // Convert API data to Mapping format
      const mappingData: Mapping = {
        id: foundMapping.id,
        name: foundMapping.name,
        description: foundMapping.description || "",
        entityType: foundMapping.entity_type || "custom",
        externalReference: foundMapping.external_reference,
        externalType: foundMapping.external_type,
        fields: fields.map((field: any, index: number) => ({
          id: field.id,
          name: field.name,
          label: field.label,
          type: field.field_type,
          required: field.required,
          description: field.description || "",
          validationRules: field.validation_rules || [],
          selectOptions: field.select_options || [],
          order: field.sequence || index,
        })),
        createdAt: foundMapping.created_at || new Date().toISOString(),
        updatedAt: foundMapping.updated_at || new Date().toISOString(),
      };

      setMapping(mappingData);
      setMappingFields(fields);

      // Set default dataset name
      setDatasetName(
        `${mappingData.name} Data - ${new Date().toLocaleDateString()}`
      );
    } catch (error) {
      console.error("Error fetching mapping:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch mapping"
      );
      showToast("Failed to fetch mapping", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetDataChange = (data: MappingData[]) => {
    setDatasetData(data);
  };

  const handleFilterData = async () => {
    if (!mapping || !filterField || !filterValue) {
      showToast("Please fill in all filter fields", "error");
      return;
    }

    if (mapping.entityType !== "custom" || !mapping.externalReference) {
      showToast("Filtering is only available for custom API mappings", "error");
      return;
    }

    setFiltering(true);
    try {
      const result = await fetchCustomAPIFilteredData(
        mapping.externalReference,
        filterType,
        filterField,
        filterValue
      );

      if (result?.data) {
        setFilteredData(result.data);
        showToast(
          `Found ${result.data.length} records matching the filter`,
          "success"
        );
      } else {
        setFilteredData([]);
        showToast("No records found matching the filter", "info");
      }
    } catch (error) {
      console.error("Error filtering data:", error);
      showToast("Failed to filter data. Please try again.", "error");
      setFilteredData([]);
    } finally {
      setFiltering(false);
    }
  };

  const handleClearFilter = () => {
    setFilteredData([]);
    setFilterField("");
    setFilterValue("");
    setFilterType("eq");
  };

  const handleUseFilteredData = () => {
    if (filteredData.length > 0) {
      // Convert filtered data to MappingData format
      const convertedData: MappingData[] = filteredData.map((item: any) => ({
        id: item.id,
        mappingId: mappingId,
        data: item,
        errors: {},
        isValid: true,
      }));

      setDatasetData(convertedData);
      showToast(
        `Loaded ${convertedData.length} records from filtered data`,
        "success"
      );
      setShowFilter(false);
    }
  };

  const handleUploadData = async () => {
    if (!mapping || datasetData.length === 0) {
      showToast("No data to upload", "error");
      return;
    }

    // Check if all rows are valid
    const invalidRows = datasetData.filter((row) => !row.isValid);
    if (invalidRows.length > 0) {
      showToast(
        `Please fix ${invalidRows.length} invalid rows before uploading`,
        "error"
      );
      return;
    }

    setUploading(true);
    try {
      const uploadEndpoint = process.env.NEXT_PUBLIC_EPCC_UPLOAD_ENDPOINT;
      if (!uploadEndpoint) {
        throw new Error("Upload endpoint not configured");
      }

      // Prepare data for upload
      const uploadData = {
        mappingId: mapping.id,
        mappingName: mapping.name,
        entityType: mapping.entityType,
        externalReference: mapping.externalReference,
        externalType: mapping.externalType,
        fields: mapping.fields,
        data: datasetData.map((row) => row.data),
        timestamp: new Date().toISOString(),
      };

      // Get authorization token and store ID from dashboard context
      const authToken = localStorage.getItem("epcc_access_token") || "";
      const storeId = selectedStoreId || "";
      const endpointUrl = process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL || "";
      const orgId = localStorage.getItem("selected_org_id") || "";

      const headers: any = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken,
        "ep-store-id": storeId,
        endpoint_url: endpointUrl,
      };

      if (orgId) {
        headers["ep-org-id"] = orgId;
      }

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      showToast(
        `Successfully uploaded ${datasetData.length} records!`,
        "success"
      );

      // Optionally redirect or clear data after successful upload
      // router.push(`/upload/mapping/${mappingId}/dataset/${result.datasetId}`);
    } catch (error) {
      console.error("Error uploading data:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to upload data. Please try again.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCreateDataset = async () => {
    if (!mapping || !datasetName.trim()) {
      showToast("Please enter a dataset name", "error");
      return;
    }

    setCreating(true);

    try {
      const dataset = createDataset({
        mappingId: mapping.id,
        name: datasetName.trim(),
        rows: datasetData,
      });

      showToast("Dataset created successfully!", "success");

      // Navigate to the dataset for data entry
      router.push(`/upload/mapping/${mappingId}/dataset/${dataset.id}`);
    } catch (error) {
      console.error("Error creating dataset:", error);
      showToast("Failed to create dataset. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    router.push("/upload/mapping");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading mapping...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mapping) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Mapping
            </h3>
            <p className="text-gray-500 mb-4">{error || "Mapping not found"}</p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={fetchMappingAndFields}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back to Mappings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Mappings
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Dataset
          </h1>
          <p className="text-gray-600">Create a new dataset for data entry</p>
        </div>

        {/* Filter Section for Custom API */}
        {mapping.entityType === "custom" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Filter Existing Data
              </h3>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded-md hover:bg-indigo-50"
              >
                {showFilter ? "Hide Filter" : "Show Filter"}
              </button>
            </div>

            {showFilter && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="eq">Equals</option>
                      <option value="in">In</option>
                      <option value="lt">Less Than</option>
                      <option value="gt">Greater Than</option>
                      <option value="ge">Greater Than or Equal</option>
                      <option value="le">Less Than or Equal</option>
                      <option value="contains">Contains</option>
                      <option value="like">Like</option>
                      <option value="is_null">Is Null</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter Field
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filterField}
                      onChange={(e) => setFilterField(e.target.value)}
                    >
                      <option value="">Select a field</option>
                      {mapping.fields.map((field) => (
                        <option key={field.id} value={field.name}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter Value
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="Enter filter value"
                      disabled={filterType === "is_null"}
                    />
                  </div>

                  <div className="flex items-end space-x-2">
                    <button
                      onClick={handleFilterData}
                      disabled={
                        !filterField ||
                        (!filterValue && filterType !== "is_null") ||
                        filtering
                      }
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {filtering ? "Filtering..." : "Filter"}
                    </button>
                    <button
                      onClick={handleClearFilter}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Filter Results */}
                {filteredData.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-green-700">
                        Found <strong>{filteredData.length}</strong> records
                        matching the filter
                      </p>
                      <button
                        onClick={handleUseFilteredData}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Use This Data
                      </button>
                    </div>
                    <p className="text-xs text-green-600">
                      Click "Use This Data" to load the filtered records into
                      the dataset grid
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Data Entry Grid */}
        <MappingDataGrid
          mapping={mapping}
          data={datasetData}
          onDataChange={handleDatasetDataChange}
          onValidate={validateRow}
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-4">
          <button
            onClick={handleCancel}
            disabled={creating}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Upload Button - only show when there's data and all rows are valid */}
          {datasetData.length > 0 && (
            <button
              onClick={handleUploadData}
              disabled={
                uploading ||
                datasetData.length === 0 ||
                datasetData.some((row) => !row.isValid)
              }
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                datasetData.length === 0
                  ? "No data to upload"
                  : datasetData.some((row) => !row.isValid)
                  ? "Please fix all validation errors before uploading"
                  : "Upload data to external endpoint"
              }
            >
              {uploading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                  Uploading...
                </div>
              ) : (
                "Upload Data"
              )}
            </button>
          )}

          <button
            onClick={handleCreateDataset}
            disabled={creating || !datasetName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                Creating...
              </div>
            ) : (
              "Create Dataset"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDatasetPage;
