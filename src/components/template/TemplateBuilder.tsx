"use client";

import React, { useState, useEffect } from "react";
import {
  Template,
  TemplateField,
  FieldType,
  ValidationRule,
  SelectOption,
} from "../../types/template";
import { useToast } from "../../contexts/ToastContext";
import { useEpccApi } from "../../hooks/useEpccApi";
import { useDashboard } from "@/hooks";

interface TemplateBuilderProps {
  template?: Template;
  onSave: (template: Omit<Template, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean (Yes/No)" },
  { value: "select", label: "Select (Dropdown)" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "currency", label: "Currency" },
];

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const [templateName, setTemplateName] = useState(template?.name || "");
  const [templateDescription, setTemplateDescription] = useState(
    template?.description || ""
  );
  const [entityType, setEntityType] = useState<Template["entityType"]>(
    template?.entityType || "custom"
  );
  const [selectedCustomApi, setSelectedCustomApi] = useState<string>("");
  const [customApis, setCustomApis] = useState<any[]>([]);
  const [loadingCustomApis, setLoadingCustomApis] = useState(false);
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);
  const [fields, setFields] = useState<TemplateField[]>(template?.fields || []);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  const { showToast } = useToast();
  const { selectedOrgId, selectedStoreId } = useDashboard();

  const { fetchAllCustomApis, fetchAllCustomFields } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );

  const fetchCustomApis = async () => {
    if (entityType === "custom") {
      setLoadingCustomApis(true);
      try {
        const result = await fetchAllCustomApis();
        if (result?.data) {
          setCustomApis(result.data);
        }
      } catch (error) {
        showToast("Failed to fetch custom APIs", "error");
      } finally {
        setLoadingCustomApis(false);
      }
    }
  };

  const fetchCustomFields = async (customApiId: string) => {
    if (!customApiId) return;

    setLoadingCustomFields(true);
    try {
      const result = await fetchAllCustomFields(customApiId);
      if (result?.data) {
        // Convert EPCC custom fields to template field format
        const convertedFields: TemplateField[] = result.data.map(
          (field: any, index: number) => {
            const fieldType = mapEpccFieldTypeToTemplateFieldType(
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
              // Add select options for choice fields
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

  // Helper function to map EPCC field types to template field types
  const mapEpccFieldTypeToTemplateFieldType = (
    epccFieldType: string,
    validationRules?: any
  ): FieldType => {
    switch (epccFieldType) {
      case "string":
        // Check if it has options (choice field) to make it a select
        if (validationRules?.options && validationRules.options.length > 0) {
          return "select";
        }
        // Check for email validation
        if (validationRules?.email) {
          return "email";
        }
        // Check for URL validation
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

  // Helper function to convert EPCC validation rules to template validation rules
  const convertEpccValidationRules = (
    epccValidationRules: any
  ): ValidationRule[] => {
    if (!epccValidationRules) return [];

    const rules: ValidationRule[] = [];

    // Min length validation
    if (epccValidationRules.min_length) {
      rules.push({
        type: "minLength",
        value: epccValidationRules.min_length,
        message: `Minimum length is ${epccValidationRules.min_length} characters`,
      });
    }

    // Max length validation
    if (epccValidationRules.max_length) {
      rules.push({
        type: "maxLength",
        value: epccValidationRules.max_length,
        message: `Maximum length is ${epccValidationRules.max_length} characters`,
      });
    }

    // Min value validation (for numbers)
    if (epccValidationRules.min) {
      rules.push({
        type: "min",
        value: epccValidationRules.min,
        message: `Minimum value is ${epccValidationRules.min}`,
      });
    }

    // Max value validation (for numbers)
    if (epccValidationRules.max) {
      rules.push({
        type: "max",
        value: epccValidationRules.max,
        message: `Maximum value is ${epccValidationRules.max}`,
      });
    }

    // Email validation
    if (epccValidationRules.email) {
      rules.push({
        type: "email",
        message: "Must be a valid email address",
      });
    }

    // URL validation
    if (epccValidationRules.uri) {
      rules.push({
        type: "url",
        message: "Must be a valid URL",
      });
    }

    return rules;
  };

  useEffect(() => {
    if (selectedStoreId) {
      fetchCustomApis();
    }
  }, [entityType, fetchAllCustomApis, selectedOrgId, selectedStoreId]);

  // Fetch custom fields when a custom API is selected
  useEffect(() => {
    if (selectedCustomApi && entityType === "custom") {
      fetchCustomFields(selectedCustomApi);
    }
  }, [selectedCustomApi, entityType, fetchAllCustomFields]);

  const handleAddField = () => {
    const newField: TemplateField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      label: "",
      type: "text",
      required: false,
      validationRules: [],
      order: fields.length,
    };
    setEditingField(newField);
    setShowFieldEditor(true);
  };

  const handleEditField = (field: TemplateField) => {
    setEditingField({ ...field });
    setShowFieldEditor(true);
  };

  const handleSaveField = (field: TemplateField) => {
    if (!field.name.trim() || !field.label.trim()) {
      showToast("Field name and label are required", "error");
      return;
    }

    // Check for duplicate field names
    const existingField = fields.find(
      (f) => f.name === field.name && f.id !== field.id
    );
    if (existingField) {
      showToast("Field name must be unique", "error");
      return;
    }

    const updatedFields =
      editingField && fields.find((f) => f.id === editingField.id)
        ? fields.map((f) => (f.id === field.id ? field : f))
        : [...fields, field];

    setFields(updatedFields);
    setShowFieldEditor(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const handleReorderField = (fieldId: string, direction: "up" | "down") => {
    const fieldIndex = fields.findIndex((f) => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newIndex = direction === "up" ? fieldIndex - 1 : fieldIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const reorderedFields = [...fields];
    [reorderedFields[fieldIndex], reorderedFields[newIndex]] = [
      reorderedFields[newIndex],
      reorderedFields[fieldIndex],
    ];

    // Update order values
    reorderedFields.forEach((field, index) => {
      field.order = index;
    });

    setFields(reorderedFields);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      showToast("Template name is required", "error");
      return;
    }

    if (entityType === "custom" && !selectedCustomApi) {
      showToast("Please select a custom API for Custom API", "error");
      return;
    }

    if (fields.length === 0) {
      showToast("Template must have at least one field", "error");
      return;
    }

    onSave({
      name: templateName,
      description: templateDescription,
      entityType,
      fields: fields.map((field, index) => ({ ...field, order: index })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Template Information
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="template-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Template Name *
            </label>
            <input
              id="template-name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter template name"
            />
          </div>

          <div>
            <label
              htmlFor="template-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="template-description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter template description"
            />
          </div>

          <div>
            <label
              htmlFor="entity-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Entity Type
            </label>
            <select
              id="entity-type"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value as Template["entityType"]);
                setSelectedCustomApi(""); // Reset custom API selection when entity type changes
                setFields([]); // Clear fields when entity type changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="custom">Custom API</option>
              <option value="products">Products</option>
              <option value="orders">Prices</option>
              <option value="customers">Media Files</option>
            </select>
          </div>

          {/* Custom API Selection - Only show for Custom API */}
          {entityType === "custom" && (
            <div>
              <label
                htmlFor="template-selection"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Custom API *
              </label>
              <select
                id="custom-api-selection"
                value={selectedCustomApi}
                onChange={(e) => setSelectedCustomApi(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loadingCustomApis}
              >
                <option value="">Select a custom API...</option>
                {loadingCustomApis ? (
                  <option value="" disabled>
                    Loading custom APIs...
                  </option>
                ) : customApis.length === 0 ? (
                  <option value="" disabled>
                    No custom APIs available
                  </option>
                ) : (
                  customApis.map((customApi) => (
                    <option key={customApi.id} value={customApi.id}>
                      {customApi?.name || customApi.id}
                    </option>
                  ))
                )}
              </select>
              {loadingCustomApis && (
                <p className="mt-1 text-sm text-gray-500">
                  <svg
                    className="inline w-4 h-4 animate-spin mr-1"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading custom APIs...
                </p>
              )}
              {!loadingCustomApis && customApis.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  <svg
                    className="inline w-4 h-4 mr-1"
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
                  No custom APIs found. Please create a custom API first.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fields - Only show when custom API is selected for Custom API, or always for other entity types */}
      {(entityType !== "custom" || selectedCustomApi) && (
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Field
            </button>
          </div>

          {fields.length === 0 && !loadingCustomFields ? (
            <div className="text-center py-8 text-gray-500">
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
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
                      onClick={() => handleReorderField(field.id, "up")}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      onClick={() => handleReorderField(field.id, "down")}
                      disabled={index === fields.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="p-1 text-blue-600 hover:text-blue-800"
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
                      className="p-1 text-red-600 hover:text-red-800"
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

      {/* Custom API Selection Required Message */}
      {entityType === "custom" && !selectedCustomApi && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-blue-400 mb-4"
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
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Custom API Selection Required
          </h3>
          <p className="text-blue-700">
            Please select a custom API above to start building your fields.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveTemplate}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Template
        </button>
      </div>

      {/* Field Editor Modal */}
      {showFieldEditor && editingField && (
        <FieldEditor
          field={editingField}
          onSave={handleSaveField}
          onCancel={() => {
            setShowFieldEditor(false);
            setEditingField(null);
          }}
        />
      )}
    </div>
  );
};

// Field Editor Component
interface FieldEditorProps {
  field: TemplateField;
  onSave: (field: TemplateField) => void;
  onCancel: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  onSave,
  onCancel,
}) => {
  const [editedField, setEditedField] = useState<TemplateField>({ ...field });
  const [validationRule, setValidationRule] = useState<Partial<ValidationRule>>(
    {}
  );
  const [selectOption, setSelectOption] = useState({ value: "", label: "" });

  const handleFieldChange = (key: keyof TemplateField, value: any) => {
    setEditedField((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddValidationRule = () => {
    if (validationRule.type) {
      const newRule: ValidationRule = {
        type: validationRule.type,
        value: validationRule.value,
        message: validationRule.message,
      };

      setEditedField((prev) => ({
        ...prev,
        validationRules: [...prev.validationRules, newRule],
      }));

      setValidationRule({});
    }
  };

  const handleRemoveValidationRule = (index: number) => {
    setEditedField((prev) => ({
      ...prev,
      validationRules: prev.validationRules.filter((_, i) => i !== index),
    }));
  };

  const handleAddSelectOption = () => {
    if (selectOption.value && selectOption.label) {
      const newOptions = [...(editedField.selectOptions || []), selectOption];
      setEditedField((prev) => ({ ...prev, selectOptions: newOptions }));
      setSelectOption({ value: "", label: "" });
    }
  };

  const handleRemoveSelectOption = (index: number) => {
    const newOptions =
      editedField.selectOptions?.filter((_, i) => i !== index) || [];
    setEditedField((prev) => ({ ...prev, selectOptions: newOptions }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {field.name ? "Edit Field" : "Add Field"}
          </h3>

          <div className="space-y-4">
            {/* Basic Field Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={editedField.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="field_name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in data export (no spaces, lowercase recommended)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label *
                </label>
                <input
                  type="text"
                  value={editedField.label}
                  onChange={(e) => handleFieldChange("label", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Field Label"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Display name for users
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type
              </label>
              <select
                value={editedField.type}
                onChange={(e) =>
                  handleFieldChange("type", e.target.value as FieldType)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {fieldTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editedField.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Optional field description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Value
              </label>
              <input
                type="text"
                value={editedField.defaultValue || ""}
                onChange={(e) =>
                  handleFieldChange("defaultValue", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Optional default value"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={editedField.required}
                onChange={(e) =>
                  handleFieldChange("required", e.target.checked)
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="required"
                className="ml-2 block text-sm text-gray-900"
              >
                Required field
              </label>
            </div>

            {/* Select Options */}
            {editedField.type === "select" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Options
                </label>

                <div className="space-y-2 mb-3">
                  {editedField.selectOptions?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="flex-1 text-sm">
                        {option.label} ({option.value})
                      </span>
                      <button
                        onClick={() => handleRemoveSelectOption(index)}
                        className="text-red-600 hover:text-red-800"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Option label"
                    value={selectOption.label}
                    onChange={(e) =>
                      setSelectOption((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Option value"
                    value={selectOption.value}
                    onChange={(e) =>
                      setSelectOption((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddSelectOption}
                    className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Validation Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validation Rules
              </label>

              <div className="space-y-2 mb-3">
                {editedField.validationRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm">
                      {rule.type} {rule.value && `(${rule.value})`}
                      {rule.message && ` - ${rule.message}`}
                    </span>
                    <button
                      onClick={() => handleRemoveValidationRule(index)}
                      className="text-red-600 hover:text-red-800"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={validationRule.type || ""}
                  onChange={(e) =>
                    setValidationRule((prev) => ({
                      ...prev,
                      type: e.target.value as ValidationRule["type"],
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select rule type</option>
                  <option value="minLength">Min Length</option>
                  <option value="maxLength">Max Length</option>
                  <option value="min">Min Value</option>
                  <option value="max">Max Value</option>
                  <option value="regex">Regex Pattern</option>
                </select>

                {(validationRule.type === "minLength" ||
                  validationRule.type === "maxLength" ||
                  validationRule.type === "min" ||
                  validationRule.type === "max" ||
                  validationRule.type === "regex") && (
                  <input
                    type={validationRule.type === "regex" ? "text" : "number"}
                    placeholder={
                      validationRule.type === "regex" ? "Pattern" : "Value"
                    }
                    value={validationRule.value || ""}
                    onChange={(e) =>
                      setValidationRule((prev) => ({
                        ...prev,
                        value:
                          validationRule.type === "regex"
                            ? e.target.value
                            : Number(e.target.value),
                      }))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}

                <button
                  onClick={handleAddValidationRule}
                  disabled={!validationRule.type}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedField)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Field
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;
