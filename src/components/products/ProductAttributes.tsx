"use client";

import React, { useState, useEffect } from "react";
import { useEpccApi } from "../../hooks/useEpccApi";

interface ProductAttributesProps {
  productId: string;
  selectedOrgId?: string;
  selectedStoreId?: string;
}

export const ProductAttributes: React.FC<ProductAttributesProps> = ({
  productId,
  selectedOrgId,
  selectedStoreId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Template state
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [productTemplates, setProductTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [productTemplatesLoading, setProductTemplatesLoading] = useState(false);

  // Template fields state
  const [templateFields, setTemplateFields] = useState<Record<string, any[]>>(
    {}
  );
  const [templateFieldsLoading, setTemplateFieldsLoading] = useState(false);
  const [templateFormData, setTemplateFormData] = useState<Record<string, any>>(
    {}
  );
  const [showTemplateForms, setShowTemplateForms] = useState<
    Record<string, boolean>
  >({});
  const [savingTemplate, setSavingTemplate] = useState<Record<string, boolean>>(
    {}
  );
  const [templateData, setTemplateData] = useState<Record<string, any>>({});
  const [templateDataLoading, setTemplateDataLoading] = useState<
    Record<string, boolean>
  >({});
  const [templateDataInitializing, setTemplateDataInitializing] =
    useState(false);
  const [templateDataExists, setTemplateDataExists] = useState<
    Record<string, boolean>
  >({});

  const {
    fetchAllTemplates,
    fetchProductTemplates,
    fetchTemplateFields,
    fetchTemplateData,
    updateTemplateData,
    createTemplateData,
    createProductTemplateRelationship,
    apiError,
  } = useEpccApi(selectedOrgId, selectedStoreId);

  // Load all templates
  const loadAllTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const result = await fetchAllTemplates();
      if (result && result.data) {
        setAllTemplates(result.data);
        return result.data;
      } else {
        setAllTemplates([]);
        return [];
      }
    } catch (err) {
      console.error("Error fetching all templates:", err);
      setAllTemplates([]);
      return [];
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Load product templates
  const loadProductTemplates = async () => {
    if (!productId) return [];

    try {
      setProductTemplatesLoading(true);
      const result = await fetchProductTemplates(productId);
      if (result && result.data) {
        setProductTemplates(result.data);
        return result.data;
      } else {
        setProductTemplates([]);
        return [];
      }
    } catch (err) {
      console.error("Error fetching product templates:", err);
      setProductTemplates([]);
      return [];
    } finally {
      setProductTemplatesLoading(false);
    }
  };

  // Load template fields based on product template relationships
  const loadTemplateFields = async (
    allTemplatesData: any[],
    productTemplatesData: any[]
  ) => {
    if (!productTemplatesData.length || !allTemplatesData.length) return;

    try {
      setTemplateFieldsLoading(true);
      const fieldsData: Record<string, any[]> = {};
      const formData: Record<string, any> = {};

      // Find template slugs from product template relationships
      for (const productTemplate of productTemplatesData) {
        const templateId = productTemplate.id;

        // Find the corresponding template in allTemplatesData to get the slug
        const template = allTemplatesData.find((t) => t.id === templateId);
        if (template && template?.slug) {
          const slug = template.slug;

          try {
            // Fetch fields for this template
            const fieldsResult = await fetchTemplateFields(slug);
            if (fieldsResult && fieldsResult.data) {
              fieldsData[slug] = fieldsResult.data;

              // Initialize form data for this template
              fieldsResult.data.forEach((field: any) => {
                const fieldKey = `${slug}_${field.slug}`;

                // Check if field has validation rules and find enum type
                let enumOptions: string[] = [];
                if (
                  field.validation_rules &&
                  Array.isArray(field.validation_rules)
                ) {
                  const enumRule = field.validation_rules.find(
                    (rule: any) => rule.type === "enum"
                  );
                  if (
                    enumRule &&
                    enumRule.options &&
                    Array.isArray(enumRule.options)
                  ) {
                    enumOptions = enumRule.options;
                  }
                }

                if (enumOptions.length > 0) {
                  // For enum fields, set first option as default
                  formData[fieldKey] = enumOptions[0] || "";
                } else {
                  // For other fields, set empty string as default
                  formData[fieldKey] = "";
                }
              });
            }
          } catch (err) {
            console.error(`Error fetching fields for template ${slug}:`, err);
            fieldsData[slug] = [];
          }
        }
      }
      setTemplateFields(fieldsData);
      setTemplateFormData(formData);

      // After setting form data, fetch and populate template data for all templates
      setTimeout(async () => {
        setTemplateDataInitializing(true);

        try {
          for (const productTemplate of productTemplatesData) {
            const templateId = productTemplate.id;
            const template = allTemplatesData.find((t) => t.id === templateId);
            if (template && template?.slug) {
              const slug = template.slug;
              try {
                await fetchTemplateDataForSlug(slug);
              } catch (err) {
                console.error(`Error fetching template data for ${slug}:`, err);
              }
            }
          }
        } finally {
          setTemplateDataInitializing(false);
        }
      }, 200); // Small delay to ensure form data is set first
    } catch (err) {
      console.error("Error loading template fields:", err);
      setTemplateFields({});
      setTemplateFormData({});
    } finally {
      setTemplateFieldsLoading(false);
    }
  };

  // Refresh all template data
  const refreshTemplates = async () => {
    const [allTemplatesResult, productTemplatesResult] = await Promise.all([
      loadAllTemplates(),
      loadProductTemplates(),
    ]);
    // Load template fields after templates are loaded
    await loadTemplateFields(allTemplatesResult, productTemplatesResult);

    // Initialize showTemplateForms state for each template
    const initialShowState: Record<string, boolean> = {};
    allTemplatesResult.forEach((template) => {
      if (template.slug) {
        initialShowState[template.slug] = true; // Show by default
      }
    });
    setShowTemplateForms(initialShowState);
  };

  // Fetch template data for a specific template
  const fetchTemplateDataForSlug = async (slug: string) => {
    if (!productId) return;

    try {
      setTemplateDataLoading((prev) => ({ ...prev, [slug]: true }));

      const result = await fetchTemplateData(slug, productId);

      if (result && result.data) {
        setTemplateData((prev) => ({ ...prev, [slug]: result.data }));
        setTemplateDataExists((prev) => ({ ...prev, [slug]: true }));

        // Populate form data with existing template data
        const existingData = result.data;

        setTemplateFormData((prevFormData) => {
          const updatedFormData = { ...prevFormData };

          // Update form data for fields that have existing values
          Object.keys(prevFormData).forEach((key) => {
            if (key.startsWith(`${slug}_`)) {
              const fieldId = key.replace(`${slug}_`, "");
              if (existingData[fieldId] !== undefined) {
                updatedFormData[key] = existingData[fieldId];
              }
            }
          });

          return updatedFormData;
        });
      }
    } catch (error: any) {
      console.error(`Error fetching template data for ${slug}:`, error);

      // Check if it's a 404 error (template attached but no data)
      if (error && error.status === 404) {
        setTemplateDataExists((prev) => ({ ...prev, [slug]: false }));
        setTemplateData((prev) => ({ ...prev, [slug]: {} }));
      } else {
        // For other errors, assume template data exists but failed to load
        setTemplateDataExists((prev) => ({ ...prev, [slug]: true }));
      }

      // Don't show error to user as this is optional data
    } finally {
      setTemplateDataLoading((prev) => ({ ...prev, [slug]: false }));
    }
  };

  // Handle attaching template to product
  const handleAttachTemplate = async (templateId: string) => {
    try {
      const request: any = [
        {
          id: templateId,
          meta: {
            tags: [],
          },
        },
      ];

      const result = await createProductTemplateRelationship(
        productId,
        request
      );
      if (result) {
        // Refresh templates to update the UI
        await refreshTemplates();
      } else {
        console.error("Failed to attach template");
      }
    } catch (error: any) {
      console.error("Error attaching template:", error);
    }
  };

  // Handle detaching template from product
  const handleDetachTemplate = async (templateId: string) => {
    try {
      // Find the relationship ID
      const relationship = productTemplates.find((pt) => pt.id === templateId);
      if (!relationship) {
        console.error("Template relationship not found");
        return;
      }
    } catch (error: any) {
      console.error("Error detaching template:", error);
    }
  };

  // Handle saving individual template data
  const handleSaveTemplateData = async (templateSlug: string) => {
    try {
      setSavingTemplate((prev) => ({ ...prev, [templateSlug]: true }));

      // Get the form data for this specific template
      const templateDataToSave: Record<string, any> = {};
      Object.keys(templateFormData).forEach((key) => {
        if (key.startsWith(`${templateSlug}_`)) {
          const fieldId = key.replace(`${templateSlug}_`, "");
          templateDataToSave[fieldId] = templateFormData[key];
        }
      });

      // Check if template data exists or needs to be created
      const dataExists = templateDataExists[templateSlug];
      let result;

      if (dataExists) {
        // Update existing template data
        result = await updateTemplateData(
          templateSlug,
          productId,
          templateDataToSave
        );
      } else {
        // Create new template data
        templateDataToSave.id = productId;
        result = await createTemplateData(templateSlug, templateDataToSave);
      }

      if (result === null) {
        // API call failed, error is already set in apiCall
        setError(apiError);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Update the template data exists flag
      setTemplateDataExists((prev) => ({ ...prev, [templateSlug]: true }));

      // Update local template data with the saved data
      setTemplateData((prev) => ({
        ...prev,
        [templateSlug]: templateDataToSave,
      }));

      setSuccess(
        `Template ${templateSlug} data ${
          dataExists ? "updated" : "created"
        } successfully`
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error(`Error saving template ${templateSlug} data:`, error);

      // Handle error array structure
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((err: any) => {
          if (err?.title?.detail) {
            return err.title.detail;
          }
          return "Unknown error";
        });

        setError(errorMessages);
      } else {
        setError(apiError);
      }

      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingTemplate((prev) => ({ ...prev, [templateSlug]: false }));
    }
  };

  // Handle template form changes
  const handleTemplateFormChange = (fieldKey: string, value: any) => {
    setTemplateFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  // Load data when component mounts
  useEffect(() => {
    const init = async () => {
      const [allTemplatesResult, productTemplatesResult] = await Promise.all([
        loadAllTemplates(),
        loadProductTemplates(),
      ]);

      // Load template fields with the actual data returned from the functions
      await loadTemplateFields(allTemplatesResult, productTemplatesResult);

      // Initialize showTemplateForms state for each template
      const initialShowState: Record<string, boolean> = {};
      allTemplatesResult.forEach((template) => {
        if (template.slug) {
          initialShowState[template.slug] = true; // Show by default
        }
      });
      setShowTemplateForms(initialShowState);
    };
    init();
  }, [productId]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Product Attributes
        </h2>

        {/* Templates Accordion */}
        <div className="mb-6">
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() =>
                setShowTemplateForms((prev) => ({
                  ...prev,
                  accordion: !prev.accordion,
                }))
              }
              className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-t-lg border-b border-gray-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Templates ({allTemplates.length})
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                    showTemplateForms.accordion ? "rotate-180" : ""
                  }`}
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
              </div>
            </button>

            {showTemplateForms.accordion && (
              <div className="p-6 bg-white rounded-b-lg">
                {templatesLoading || productTemplatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading templates...
                    </span>
                  </div>
                ) : allTemplates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No templates available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allTemplates.map((template) => {
                      const isAssociated = productTemplates.some(
                        (pt) => pt.id === template.id
                      );
                      const slug = template.slug;
                      const fields = templateFields[slug] || [];

                      return (
                        <div
                          key={template.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-md font-semibold text-gray-900">
                                {template.name || slug}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Slug: {slug}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!isAssociated ? (
                                <button
                                  onClick={() =>
                                    handleAttachTemplate(template.id)
                                  }
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-200"
                                >
                                  Attach Template
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleDetachTemplate(template.id)
                                  }
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors duration-200"
                                >
                                  Detach Template
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Associated Templates Forms */}
        {productTemplates.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Associated Template Forms
            </h3>
            {productTemplates.map((productTemplate) => {
              const templateId = productTemplate.id;
              const template = allTemplates.find((t) => t.id === templateId);
              if (!template || !template.slug) return null;

              const slug = template.slug;
              const fields = templateFields[slug] || [];
              const templateName = template.name || slug;

              return (
                <div
                  key={template.id}
                  className="bg-purple-50 rounded-lg p-6 border border-purple-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-900">
                      {templateName}
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() =>
                          setShowTemplateForms((prev) => ({
                            ...prev,
                            [slug]: !prev[slug],
                          }))
                        }
                        className="inline-flex items-center px-3 py-2 border border-purple-300 shadow-sm text-sm font-medium rounded-lg text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                      >
                        {showTemplateForms[slug] ? (
                          <>
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Hide Form
                          </>
                        ) : (
                          <>
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
                                d="M4 6h16M4 10h16M4 14h16M4 18h16"
                              />
                            </svg>
                            Show Form
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleSaveTemplateData(slug)}
                        disabled={savingTemplate[slug]}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingTemplate[slug] ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                            {templateDataExists[slug]
                              ? "Updating..."
                              : "Creating..."}
                          </>
                        ) : (
                          <>
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {templateDataExists[slug] ? "Update" : "Create"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {showTemplateForms[slug] && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {fields.map((field: any) => {
                            const fieldKey = `${slug}_${field.slug}`;
                            const fieldValue = templateFormData[fieldKey] || "";
                            const fieldName = field.name || field.slug;
                            const fieldType = field.type || "text";
                            const fieldRequired = field.required || false;

                            // Extract validation rules and find enum options
                            let enumOptions: string[] = [];
                            let fieldValidationRules: any = {};

                            if (
                              field.validation_rules &&
                              Array.isArray(field.validation_rules)
                            ) {
                              field.validation_rules.forEach((rule: any) => {
                                if (
                                  rule.type === "enum" &&
                                  rule.options &&
                                  Array.isArray(rule.options)
                                ) {
                                  enumOptions = rule.options;
                                } else {
                                  // Store other validation rules
                                  fieldValidationRules[rule.type] =
                                    rule.value || rule.options;
                                }
                              });
                            }

                            const fieldDescription = field.description;

                            return (
                              <div key={field.slug} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {fieldName}
                                  {fieldRequired && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>

                                {enumOptions.length > 0 ? (
                                  // Enum field - show as dropdown
                                  <select
                                    value={fieldValue}
                                    onChange={(e) =>
                                      handleTemplateFormChange(
                                        fieldKey,
                                        e.target.value
                                      )
                                    }
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    required={fieldRequired}
                                  >
                                    {enumOptions.map(
                                      (option: string, index: number) => (
                                        <option key={index} value={option}>
                                          {option}
                                        </option>
                                      )
                                    )}
                                  </select>
                                ) : fieldType === "textarea" ? (
                                  // Textarea field
                                  <textarea
                                    value={fieldValue}
                                    onChange={(e) =>
                                      handleTemplateFormChange(
                                        fieldKey,
                                        e.target.value
                                      )
                                    }
                                    rows={3}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm resize-none"
                                    placeholder={`Enter ${fieldName.toLowerCase()}`}
                                    required={fieldRequired}
                                  />
                                ) : fieldType === "number" ? (
                                  // Number field
                                  <input
                                    type="number"
                                    value={fieldValue}
                                    onChange={(e) =>
                                      handleTemplateFormChange(
                                        fieldKey,
                                        e.target.value
                                      )
                                    }
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    placeholder={`Enter ${fieldName.toLowerCase()}`}
                                    required={fieldRequired}
                                  />
                                ) : (
                                  // Default text field
                                  <input
                                    type="text"
                                    value={fieldValue}
                                    onChange={(e) =>
                                      handleTemplateFormChange(
                                        fieldKey,
                                        e.target.value
                                      )
                                    }
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    placeholder={`Enter ${fieldName.toLowerCase()}`}
                                    required={fieldRequired}
                                  />
                                )}

                                {fieldDescription && (
                                  <p className="text-xs text-gray-500">
                                    {fieldDescription}
                                  </p>
                                )}

                                {Object.keys(fieldValidationRules).length >
                                  0 && (
                                  <div className="text-xs text-purple-600">
                                    {fieldValidationRules.min && (
                                      <div>Min: {fieldValidationRules.min}</div>
                                    )}
                                    {fieldValidationRules.max && (
                                      <div>Max: {fieldValidationRules.max}</div>
                                    )}
                                    {fieldValidationRules.pattern && (
                                      <div>
                                        Pattern: {fieldValidationRules.pattern}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
