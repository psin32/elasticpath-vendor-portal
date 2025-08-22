"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mapping } from "@/types/mapping";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import MappingBuilder from "@/components/mapping/MappingBuilder";

const EditMappingPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const {
    fetchMapping,
    fetchMappingsFields,
    fetchAllCustomApis,
    updateMapping: updateMappingInAPI,
    createMappingFields: createMappingFieldsInAPI,
    updateMappingFields: updateMappingFieldsInAPI,
    deleteMappingField: deleteMappingFieldInAPI,
  } = useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);
  const { showToast } = useToast();

  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [mappingFields, setMappingFields] = useState<any[]>([]);
  const [customApiName, setCustomApiName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mappingId = params.mappingId as string;

  // Fetch mapping and fields on component mount
  useEffect(() => {
    if (selectedOrgId && selectedStoreId && mappingId) {
      fetchMappingAndFields();
    }
  }, [selectedOrgId, selectedStoreId, mappingId]);

  const fetchMappingAndFields = async () => {
    if (!selectedOrgId || !selectedStoreId || !mappingId) return;

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

      // If entity type is custom, fetch custom API details
      let customApiName = "";
      if (
        foundMapping.entity_type === "custom" &&
        foundMapping.external_reference
      ) {
        try {
          const customApisResult = await fetchAllCustomApis();
          if (customApisResult?.data) {
            const customApi = customApisResult.data.find(
              (api: any) => api.id === foundMapping.external_reference
            );
            if (customApi) {
              customApiName = customApi.name || customApi.slug || "Custom API";
            }
          }
        } catch (error) {
          console.warn("Failed to fetch custom API details:", error);
          customApiName = "Custom API";
        }
      }

      // Convert API data to Mapping format
      const mappingData: Mapping = {
        id: foundMapping.id,
        name: foundMapping.name,
        description: foundMapping.description || "",
        entityType: foundMapping.entity_type || "custom",
        customApiName: customApiName,
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

      setMapping(mappingData);
      setMappingFields(fields);
      setCustomApiName(customApiName);
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

  const handleSaveMapping = async (
    mappingData: Omit<Mapping, "id" | "createdAt" | "updatedAt"> & {
      externalReference?: string;
    }
  ) => {
    if (!mapping) return;

    try {
      // Update mapping in the custom API
      const mappingResult = await updateMappingInAPI(mappingId, {
        name: mappingData.name,
        description: mappingData.description,
        entityType: mappingData.entityType,
        externalReference: mappingData.externalReference,
      });

      if (!mappingResult?.data) {
        throw new Error("Failed to update mapping in custom API");
      }

      // Handle field updates
      const currentFieldIds = new Set(mappingFields.map((f: any) => f.id));
      const newFieldIds = new Set(
        mappingData.fields
          .map((f) => f.id)
          .filter((id) => !id.startsWith("field_"))
      );

      // Fields to delete (exist in current but not in new)
      const fieldsToDelete = mappingFields.filter(
        (f: any) => !mappingData.fields.some((newField) => newField.id === f.id)
      );

      // Fields to update (exist in both)
      const fieldsToUpdate = mappingData.fields.filter(
        (field) =>
          !field.id.startsWith("field_") && currentFieldIds.has(field.id)
      );

      // Fields to create (new fields with temporary IDs)
      const fieldsToCreate = mappingData.fields.filter((field) =>
        field.id.startsWith("field_")
      );

      // Delete removed fields
      for (const field of fieldsToDelete) {
        try {
          await deleteMappingFieldInAPI(field.id);
        } catch (error) {
          console.warn(`Failed to delete field ${field.name}:`, error);
        }
      }

      // Update existing fields
      for (const field of fieldsToUpdate) {
        try {
          const fieldData = {
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            description: field.description,
            validationRules: field.validationRules,
            selectOptions: field.selectOptions,
            order: field.order,
          };

          await updateMappingFieldsInAPI(field.id, mappingId, fieldData);
        } catch (error) {
          console.warn(`Failed to update field ${field.name}:`, error);
        }
      }

      // Create new fields
      if (fieldsToCreate.length > 0) {
        const newFieldsData = fieldsToCreate
          .sort((a, b) => a.order - b.order)
          .map((field) => ({
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            description: field.description,
            validationRules: field.validationRules,
            selectOptions: field.selectOptions,
          }));

        await createMappingFieldsInAPI(mappingId, newFieldsData);
      }

      showToast("Mapping updated successfully!", "success");

      // Redirect back to mappings list
      router.push("/upload/mapping");
    } catch (error) {
      console.error("Error updating mapping in custom API:", error);
      showToast(
        "Failed to update mapping in custom API. Please try again.",
        "error"
      );
    }
  };

  const handleCancel = () => {
    router.push("/upload/mapping");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <p className="text-gray-500 mb-4">{error}</p>
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

  if (!mapping) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Mapping Not Found
            </h3>
            <p className="text-gray-500 mb-4">
              The mapping you're looking for doesn't exist.
            </p>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Mappings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Mapping</h1>
          <p className="text-gray-600">Update your mapping configuration</p>
        </div>

        <MappingBuilder
          mapping={mapping}
          onSave={handleSaveMapping}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default EditMappingPage;
