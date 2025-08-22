"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mapping,
  MappingData,
  MappingDataset,
  ValidationError,
} from "@/types/mapping";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import { useMappingManager } from "@/hooks/useMappingManager";
import MappingDataGrid from "@/components/mapping/MappingDataGrid";

const DatasetEditorPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const { fetchMapping, fetchMappingsFields } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );
  const { showToast } = useToast();
  const {
    datasets,
    getDataset,
    updateDataset,
    exportDatasetToCSV,
    exportDatasetToJSON,
  } = useMappingManager();

  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [dataset, setDataset] = useState<MappingDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mappingId = params.mappingId as string;
  const datasetId = params.datasetId as string;

  // Fetch mapping, fields, and dataset on component mount
  useEffect(() => {
    if (selectedOrgId && selectedStoreId && mappingId && datasetId) {
      fetchMappingAndDataset();
    }
  }, [selectedOrgId, selectedStoreId, mappingId, datasetId]);

  const fetchMappingAndDataset = async () => {
    if (!selectedOrgId || !selectedStoreId || !mappingId || !datasetId) return;

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

      // Get the dataset from local storage
      const foundDataset = getDataset(datasetId);
      if (!foundDataset) {
        throw new Error("Dataset not found");
      }

      setMapping(mappingData);
      setDataset(foundDataset);
    } catch (error) {
      console.error("Error fetching mapping and dataset:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch mapping and dataset"
      );
      showToast("Failed to fetch mapping and dataset", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetDataChange = (data: MappingData[]) => {
    if (dataset) {
      updateDataset(dataset.id, {
        rows: data,
      });
      // Update local state to reflect changes
      setDataset((prev) => (prev ? { ...prev, rows: data } : null));
      showToast("Dataset updated", "success");
    }
  };

  const validateRow = (
    mapping: Mapping,
    rowData: Record<string, any>
  ): ValidationError[] => {
    const errors: ValidationError[] = [];

    mapping.fields.forEach((field) => {
      const value = rowData[field.name];
      const fieldErrors: string[] = [];

      // Check required fields
      if (field.required && (!value || value.toString().trim() === "")) {
        fieldErrors.push(`${field.label} is required`);
      }

      // Type-specific validation
      if (value && value.toString().trim() !== "") {
        switch (field.type) {
          case "email":
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              fieldErrors.push(`${field.label} must be a valid email address`);
            }
            break;
          case "number":
            if (isNaN(Number(value))) {
              fieldErrors.push(`${field.label} must be a valid number`);
            }
            break;
          case "url":
            try {
              new URL(value);
            } catch {
              fieldErrors.push(`${field.label} must be a valid URL`);
            }
            break;
        }
      }

      if (fieldErrors.length > 0) {
        errors.push({
          fieldId: field.id,
          fieldName: field.name,
          errors: fieldErrors,
        });
      }
    });

    return errors;
  };

  const handleExportCSV = () => {
    if (dataset) {
      exportDatasetToCSV(dataset.id);
      showToast("Dataset exported to CSV", "success");
    }
  };

  const handleExportJSON = () => {
    if (dataset) {
      exportDatasetToJSON(dataset.id);
      showToast("Dataset exported to JSON", "success");
    }
  };

  const handleBackToMappings = () => {
    router.push("/upload/mapping");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dataset...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mapping || !dataset) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Error Loading Dataset
            </h3>
            <p className="text-gray-500 mb-4">{error || "Dataset not found"}</p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={fetchMappingAndDataset}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToMappings}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={handleBackToMappings}
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

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {dataset.name}
              </h1>
              <p className="text-gray-600">
                Dataset for <span className="font-medium">{mapping.name}</span>{" "}
                mapping
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Export CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export JSON
              </button>
            </div>
          </div>

          {/* Dataset Stats */}
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Rows
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {dataset.rows.length}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fields
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {mapping.fields.length}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Modified
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(dataset.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="bg-white rounded-lg border border-gray-200">
          <MappingDataGrid
            mapping={mapping}
            data={dataset.rows}
            onDataChange={handleDatasetDataChange}
            onValidate={validateRow}
          />
        </div>
      </div>
    </div>
  );
};

export default DatasetEditorPage;
