"use client";

import React, { useState, useEffect } from "react";
import {
  Mapping,
  MappingField,
  FieldType,
  ValidationRule,
} from "../../types/mapping";
import { useEpccApi } from "../../hooks/useEpccApi";
import { useDashboard } from "../../hooks/useDashboard";
import { useToast } from "../../contexts/ToastContext";

interface MappingBuilderProps {
  mapping?: Mapping;
  onSave: (
    mapping: Omit<Mapping, "id" | "createdAt" | "updatedAt"> & {
      externalReference?: string;
    }
  ) => void;
  onCancel: () => void;
}

interface FieldEditorProps {
  field: MappingField;
  onSave: (field: MappingField) => void;
  onCancel: () => void;
}

const MappingBuilder: React.FC<MappingBuilderProps> = ({
  mapping,
  onSave,
  onCancel,
}) => {
  const { showToast } = useToast();
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const { fetchAllCustomApis, fetchAllCustomFields } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );

  const [mappingName, setMappingName] = useState(mapping?.name || "");
  const [mappingDescription, setMappingDescription] = useState(
    mapping?.description || ""
  );
  const [entityType, setEntityType] = useState<Mapping["entityType"]>(
    mapping?.entityType || "custom"
  );
  const [selectedCustomApi, setSelectedCustomApi] = useState<string>(
    mapping?.entityType === "custom" ? mapping.externalReference || "" : ""
  );
  const [customApis, setCustomApis] = useState<any[]>([]);
  const [loadingCustomApis, setLoadingCustomApis] = useState(false);
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);
  const [fields, setFields] = useState<MappingField[]>(mapping?.fields || []);
  const [editingField, setEditingField] = useState<MappingField | null>(null);

  // Fetch custom APIs when component mounts
  useEffect(() => {
    if (selectedOrgId && selectedStoreId) {
      fetchCustomApis();
    }
  }, [selectedOrgId, selectedStoreId, fetchAllCustomApis]);

  // Fetch custom fields when custom API is selected
  useEffect(() => {
    if (selectedCustomApi && entityType === "custom") {
      fetchCustomFields(selectedCustomApi);
    }
  }, [selectedCustomApi, entityType, fetchAllCustomFields]);

  // Update state when mapping prop changes
  useEffect(() => {
    if (mapping) {
      setMappingName(mapping.name);
      setMappingDescription(mapping.description || "");
      setEntityType(mapping.entityType);
      setFields(mapping.fields || []);
      // Set selectedCustomApi for custom entity types
      if (mapping.entityType === "custom") {
        setSelectedCustomApi(mapping.externalReference || "");
      }
    }
  }, [mapping]);

  const fetchCustomApis = async () => {
    setLoadingCustomApis(true);
    try {
      const result = await fetchAllCustomApis();
      if (result?.data) {
        // Filter out the mappings and mappings_fields custom APIs to prevent circular references
        // These APIs are used internally by the mapping system and shouldn't be selectable
        const filteredApis = result.data.filter(
          (api: any) =>
            api.slug !== "mappings" && api.slug !== "mappings_fields"
        );
        setCustomApis(filteredApis);
      }
    } catch (error) {
      console.error("Error fetching custom APIs:", error);
      showToast("Failed to fetch custom APIs", "error");
    } finally {
      setLoadingCustomApis(false);
    }
  };

  const fetchCustomFields = async (customApiId: string) => {
    if (!customApiId) return;

    setLoadingCustomFields(true);
    try {
      const result = await fetchAllCustomFields(customApiId);
      if (result?.data) {
        const convertedFields: MappingField[] = result.data.map(
          (field: any, index: number) => {
            const fieldType = mapEpccFieldTypeToMappingFieldType(
              field.field_type,
              field.validation_rules
            );

            return {
              id: field.id,
              name: field.slug,
              label: field.name,
              type: fieldType,
              required: field.required || false,
              validationRules: convertEpccValidationRules(
                field.validation_rules
              ),
              description: field.description || "",
              order: index,
              ...(fieldType === "select" && field.validation_rules?.options
                ? {
                    selectOptions: field.validation_rules.options.map(
                      (option: any) => ({
                        value: option.option,
                        label: option.option,
                      })
                    ),
                  }
                : {}),
            };
          }
        );

        setFields(convertedFields);
        showToast(`Loaded ${convertedFields.length} custom fields`, "success");
      }
    } catch (error) {
      showToast("Failed to fetch custom fields", "error");
      setFields([]); // Clear fields on error
    } finally {
      setLoadingCustomFields(false);
    }
  };

  // Helper function to map EPCC field types to mapping field types
  const mapEpccFieldTypeToMappingFieldType = (
    epccFieldType: string,
    validationRules?: any
  ): FieldType => {
    switch (epccFieldType) {
      case "string":
        if (validationRules?.options && validationRules.options.length > 0) {
          return "select";
        }
        if (validationRules?.email) {
          return "email";
        }
        if (validationRules?.uri) {
          return "url";
        }
        return "text";
      case "integer":
      case "float":
        return "number";
      case "boolean":
        return "boolean";
      case "date":
        return "date";
      default:
        return "text";
    }
  };

  // Helper function to convert EPCC validation rules to mapping validation rules
  const convertEpccValidationRules = (
    epccValidationRules: any
  ): ValidationRule[] => {
    if (!epccValidationRules) return [];
    const rules: ValidationRule[] = [];
    if (epccValidationRules.min_length) {
      rules.push({
        type: "minLength",
        value: epccValidationRules.min_length,
        message: `Minimum length is ${epccValidationRules.min_length} characters`,
      });
    }
    if (epccValidationRules.max_length) {
      rules.push({
        type: "maxLength",
        value: epccValidationRules.max_length,
        message: `Maximum length is ${epccValidationRules.max_length} characters`,
      });
    }
    if (epccValidationRules.min) {
      rules.push({
        type: "min",
        value: epccValidationRules.min,
        message: `Minimum value is ${epccValidationRules.min}`,
      });
    }
    if (epccValidationRules.max) {
      rules.push({
        type: "max",
        value: epccValidationRules.max,
        message: `Maximum value is ${epccValidationRules.max}`,
      });
    }
    if (epccValidationRules.email) {
      rules.push({ type: "email", message: "Must be a valid email address" });
    }
    if (epccValidationRules.uri) {
      rules.push({ type: "url", message: "Must be a valid URL" });
    }
    return rules;
  };

  const handleEntityTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newEntityType = event.target.value as Mapping["entityType"];
    setEntityType(newEntityType);
    setSelectedCustomApi("");
    setFields([]); // Clear fields when entity type changes
  };

  const handleAddField = () => {
    const newField: MappingField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      label: "",
      type: "text",
      required: false,
      validationRules: [],
      description: "",
      order: fields.length,
    };
    setEditingField(newField);
  };

  const handleEditField = (field: MappingField) => {
    setEditingField({ ...field });
  };

  const handleSaveField = (field: MappingField) => {
    if (editingField) {
      // Update existing field
      setFields((prev) =>
        prev.map((f) => (f.id === editingField.id ? field : f))
      );
    } else {
      // Add new field
      setFields((prev) => [...prev, field]);
    }
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const handleMoveField = (fieldId: string, direction: "up" | "down") => {
    setFields((prev) => {
      const currentIndex = prev.findIndex((f) => f.id === fieldId);
      if (currentIndex === -1) return prev;

      const newFields = [...prev];
      if (direction === "up" && currentIndex > 0) {
        [newFields[currentIndex], newFields[currentIndex - 1]] = [
          newFields[currentIndex - 1],
          newFields[currentIndex],
        ];
        newFields[currentIndex].order = currentIndex;
        newFields[currentIndex - 1].order = currentIndex - 1;
      } else if (direction === "down" && currentIndex < newFields.length - 1) {
        [newFields[currentIndex], newFields[currentIndex + 1]] = [
          newFields[currentIndex + 1],
          newFields[currentIndex],
        ];
        newFields[currentIndex].order = currentIndex;
        newFields[currentIndex + 1].order = currentIndex + 1;
      }
      return newFields;
    });
  };

  const handleSaveMapping = () => {
    if (!mappingName.trim()) {
      showToast("Mapping name is required", "error");
      return;
    }

    if (entityType === "custom" && !selectedCustomApi) {
      showToast("Please select a custom API", "error");
      return;
    }

    if (fields.length === 0) {
      showToast("Mapping must have at least one field", "error");
      return;
    }

    // Call the onSave callback with form data - let the parent handle API calls
    onSave({
      name: mappingName,
      description: mappingDescription,
      entityType,
      externalReference: selectedCustomApi || undefined,
      fields: fields.sort((a, b) => a.order - b.order),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mapping Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Mapping Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="mapping-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mapping Name *
            </label>
            <input
              type="text"
              id="mapping-name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={mappingName}
              onChange={(e) => setMappingName(e.target.value)}
              placeholder="Enter mapping name"
              required
            />
          </div>
          <div>
            <label
              htmlFor="mapping-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <input
              type="text"
              id="mapping-description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={mappingDescription}
              onChange={(e) => setMappingDescription(e.target.value)}
              placeholder="Enter mapping description"
            />
          </div>
        </div>
      </div>

      {/* Entity Type Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Entity Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="entity-type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Entity Type *
            </label>
            <select
              id="entity-type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={entityType}
              onChange={handleEntityTypeChange}
            >
              <option value="products">Products</option>
              <option value="orders">Orders</option>
              <option value="customers">Customers</option>
              <option value="custom">Custom API</option>
            </select>
          </div>

          {/* Custom API Selection */}
          {entityType === "custom" && (
            <div>
              <label
                htmlFor="custom-api-selection"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Custom API *
              </label>
              {mapping && mapping.entityType === "custom" ? (
                // Show custom API name when editing (read-only)
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                  {mapping.customApiName || "Custom API"}
                </div>
              ) : (
                // Show dropdown for new mappings
                <select
                  id="custom-api-selection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedCustomApi}
                  onChange={(e) => setSelectedCustomApi(e.target.value)}
                  disabled={loadingCustomApis}
                >
                  <option value="">
                    {loadingCustomApis
                      ? "Loading custom APIs..."
                      : "Select a custom API..."}
                  </option>
                  {customApis.map((api) => (
                    <option key={api.id} value={api.id}>
                      {api.name || api.slug}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Custom API Selection Required Message */}
        {entityType === "custom" && !selectedCustomApi && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Please select a custom API to continue. This will load the
              available fields for the selected API.
            </p>
          </div>
        )}
      </div>

      {/* Fields Section */}
      {(entityType !== "custom" ||
        selectedCustomApi ||
        (mapping && mapping.entityType === "custom")) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-medium text-gray-900">Fields</h3>
              {loadingCustomFields && (
                <div className="flex items-center space-x-1">
                  <svg
                    className="animate-spin w-4 h-4 text-gray-500"
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
                  <span className="text-sm text-gray-500">
                    Loading fields...
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleAddField}
              disabled={loadingCustomFields}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Field
            </button>
          </div>

          {fields.length === 0 && !loadingCustomFields ? (
            <div className="text-center py-8 text-gray-500">
              <p>
                {entityType === "custom" && selectedCustomApi
                  ? 'No custom fields found for this API. Click "Add Field" to create new fields.'
                  : 'No fields added yet. Click "Add Field" to get started.'}
              </p>
            </div>
          ) : loadingCustomFields ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="animate-spin mx-auto h-12 w-12 text-gray-400 mb-4"
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
              <p>Loading custom fields from API...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {field.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({field.type})
                      </span>
                      {field.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Required
                        </span>
                      )}
                      {entityType === "custom" &&
                        selectedCustomApi &&
                        field.id &&
                        !field.id.startsWith("field_") && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            From API
                          </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Field name: {field.name}
                    </div>
                    {field.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {field.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleMoveField(field.id, "up")}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Move up"
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
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveField(field.id, "down")}
                      disabled={index === fields.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Move down"
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditField(field)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit field"
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
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Delete field"
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Field Editor Modal */}
      {editingField && (
        <FieldEditor
          field={editingField}
          onSave={handleSaveField}
          onCancel={() => setEditingField(null)}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveMapping}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Save Mapping
        </button>
      </div>
    </div>
  );
};

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  onSave,
  onCancel,
}) => {
  const [editedField, setEditedField] = useState<MappingField>({
    ...field,
    validationRules: Array.isArray(field.validationRules)
      ? field.validationRules
      : [],
  });

  const handleFieldChange = (key: keyof MappingField, value: any) => {
    setEditedField((prev) => ({ ...prev, [key]: value }));
  };

  const handleValidationRuleChange = (
    index: number,
    key: keyof ValidationRule,
    value: any
  ) => {
    setEditedField((prev) => ({
      ...prev,
      validationRules: prev.validationRules.map((rule, i) =>
        i === index ? { ...rule, [key]: value } : rule
      ),
    }));
  };

  const addValidationRule = () => {
    setEditedField((prev) => ({
      ...prev,
      validationRules: [
        ...prev.validationRules,
        { type: "required", message: "" },
      ],
    }));
  };

  const removeValidationRule = (index: number) => {
    setEditedField((prev) => ({
      ...prev,
      validationRules: prev.validationRules.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!editedField.name.trim() || !editedField.label.trim()) {
      return;
    }
    onSave(editedField);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {field.id.startsWith("field_") ? "Add Field" : "Edit Field"}
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={editedField.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g., sku, name, price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Label *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={editedField.label}
                onChange={(e) => handleFieldChange("label", e.target.value)}
                placeholder="e.g., SKU, Product Name, Price"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Type *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={editedField.type}
                onChange={(e) => handleFieldChange("type", e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
                <option value="phone">Phone</option>
                <option value="url">URL</option>
                <option value="currency">Currency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={editedField.required}
                  onChange={(e) =>
                    handleFieldChange("required", e.target.checked)
                  }
                />
                <span className="ml-2 text-sm text-gray-700">
                  This field is required
                </span>
              </div>
            </div>
          </div>

          {editedField.type === "select" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Options
              </label>
              <div className="space-y-2">
                {(editedField.selectOptions || []).map((option, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Option value"
                      value={option.value}
                      onChange={(e) => {
                        const newOptions = [
                          ...(editedField.selectOptions || []),
                        ];
                        newOptions[index] = {
                          ...option,
                          value: e.target.value,
                        };
                        handleFieldChange("selectOptions", newOptions);
                      }}
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Display label"
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [
                          ...(editedField.selectOptions || []),
                        ];
                        newOptions[index] = {
                          ...option,
                          label: e.target.value,
                        };
                        handleFieldChange("selectOptions", newOptions);
                      }}
                    />
                    <button
                      onClick={() => {
                        const newOptions =
                          editedField.selectOptions?.filter(
                            (_, i) => i !== index
                          ) || [];
                        handleFieldChange("selectOptions", newOptions);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [
                      ...(editedField.selectOptions || []),
                      { value: "", label: "" },
                    ];
                    handleFieldChange("selectOptions", newOptions);
                  }}
                  className="px-3 py-2 text-indigo-600 hover:text-indigo-800"
                >
                  Add Option
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              value={editedField.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Field description (optional)"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Validation Rules
              </label>
              <button
                onClick={addValidationRule}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Add Rule
              </button>
            </div>
            <div className="space-y-2">
              {editedField.validationRules.map((rule, index) => (
                <div key={index} className="flex space-x-2">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={rule.type}
                    onChange={(e) =>
                      handleValidationRuleChange(index, "type", e.target.value)
                    }
                  >
                    <option value="required">Required</option>
                    <option value="minLength">Min Length</option>
                    <option value="maxLength">Max Length</option>
                    <option value="min">Min Value</option>
                    <option value="max">Max Value</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                    <option value="regex">Regex</option>
                  </select>
                  {rule.type !== "required" &&
                    rule.type !== "email" &&
                    rule.type !== "url" && (
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Value"
                        value={rule.value || ""}
                        onChange={(e) =>
                          handleValidationRuleChange(
                            index,
                            "value",
                            e.target.value
                          )
                        }
                      />
                    )}
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Error message (optional)"
                    value={rule.message || ""}
                    onChange={(e) =>
                      handleValidationRuleChange(
                        index,
                        "message",
                        e.target.value
                      )
                    }
                  />
                  <button
                    onClick={() => removeValidationRule(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Save Field
          </button>
        </div>
      </div>
    </div>
  );
};

export default MappingBuilder;
