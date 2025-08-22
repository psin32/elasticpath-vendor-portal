"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Mapping } from "@/types/mapping";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import MappingBuilder from "@/components/mapping/MappingBuilder";

const CreateMappingPage: React.FC = () => {
  const router = useRouter();
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const {
    createMapping: createMappingInAPI,
    createMappingFields: createMappingFieldsInAPI,
  } = useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);
  const { showToast } = useToast();

  const handleSaveMapping = async (
    mappingData: Omit<Mapping, "id" | "createdAt" | "updatedAt"> & {
      externalReference?: string;
      externalType?: string;
    }
  ) => {
    try {
      // Create mapping in the custom API
      const mappingResult = await createMappingInAPI({
        name: mappingData.name,
        description: mappingData.description,
        entityType: mappingData.entityType,
        externalReference: mappingData.externalReference,
        externalType: mappingData.externalType,
      });

      if (!mappingResult?.data) {
        throw new Error("Failed to create mapping in custom API");
      }

      const mappingId = mappingResult.data.id;

      // Create mapping fields in the custom API
      const fieldsData = mappingData.fields
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

      await createMappingFieldsInAPI(mappingId, fieldsData);

      showToast("Mapping created successfully!", "success");

      // Redirect back to mappings list
      router.push("/upload/mapping");
    } catch (error) {
      console.error("Error creating mapping in custom API:", error);
      showToast(
        "Failed to create mapping in custom API. Please try again.",
        "error"
      );
    }
  };

  const handleCancel = () => {
    router.push("/upload/mapping");
  };

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
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Mapping
          </h1>
          <p className="text-gray-600">Define a new mapping configuration</p>
        </div>

        <MappingBuilder onSave={handleSaveMapping} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default CreateMappingPage;
