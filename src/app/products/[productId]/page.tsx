"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useEpccApi } from "../../../hooks/useEpccApi";
import { DashboardHeader } from "../../../components/layout/DashboardHeader";
import { useDashboard } from "../../../hooks/useDashboard";
import { ImageOverlay } from "../../../components/ui/ImageOverlay";
import { PcmProduct } from "@elasticpath/js-sdk";

interface ProductImage {
  url: string;
  alt: string;
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<PcmProduct | null>(null);
  const [mainImage, setMainImage] = useState<ProductImage | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inventory state
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "attributes" | "inventory"
  >("details");
  const [editingInventory, setEditingInventory] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);
  const [newInventory, setNewInventory] = useState({
    ep_available_date: "",
    ep_shelf_life_days: 0,
    ep_available: 0,
  });
  const [showNewInventoryForm, setShowNewInventoryForm] = useState(false);

  // Attributes state
  const [attributesData, setAttributesData] = useState<Record<string, any>>({});
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  const [editingAttributeValue, setEditingAttributeValue] =
    useState<string>("");
  const [newAttribute, setNewAttribute] = useState({
    key: "",
    value: "",
  });
  const [showNewAttributeForm, setShowNewAttributeForm] = useState(false);

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
  >({}); // Show by default for each template
  const [savingTemplate, setSavingTemplate] = useState<Record<string, boolean>>(
    {}
  ); // Track saving state for each template
  const [templateData, setTemplateData] = useState<Record<string, any>>({}); // Store fetched template data
  const [templateDataLoading, setTemplateDataLoading] = useState<
    Record<string, boolean>
  >({}); // Track loading state for each template data
  const [templateDataInitializing, setTemplateDataInitializing] =
    useState(false); // Track initial template data loading

  // Use the same dashboard state management
  const { selectedOrgId, selectedStoreId, handleOrgSelect, handleStoreSelect } =
    useDashboard();

  const {
    fetchProduct,
    updateProduct,
    fetchInventoryBySku,
    createInventory,
    updateInventory,
    deleteInventory,
    fetchAllTemplates,
    fetchProductTemplates,
    fetchTemplateFields,
    fetchTemplateData,
  } = useEpccApi(selectedOrgId || undefined, selectedStoreId || undefined);

  // Form state for editable fields
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    sku: "",
    status: "draft",
    commodity_type: "physical",
  });

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
      setInventoryData([]);
    } finally {
      setInventoryLoading(false);
    }
  };

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
      console.log("fieldsData", fieldsData);
      console.log("formData", formData);
      setTemplateFields(fieldsData);
      setTemplateFormData(formData);

      // After setting form data, fetch and populate template data for all templates
      setTimeout(async () => {
        console.log("Starting template data population...");
        setTemplateDataInitializing(true);

        try {
          for (const productTemplate of productTemplatesData) {
            const templateId = productTemplate.id;
            const template = allTemplatesData.find((t) => t.id === templateId);
            if (template && template?.slug) {
              const slug = template.slug;
              try {
                console.log(`Fetching template data for ${slug}...`);
                await fetchTemplateDataForSlug(slug);
              } catch (err) {
                console.error(`Error fetching template data for ${slug}:`, err);
              }
            }
          }
          console.log("Template data population completed");
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

    // Template data will be automatically fetched by loadTemplateFields
    console.log(
      "Template refresh completed - data should be automatically loaded"
    );
  };

  // Fetch template data for a specific template
  const fetchTemplateDataForSlug = async (slug: string) => {
    if (!productId) return;

    try {
      setTemplateDataLoading((prev) => ({ ...prev, [slug]: true }));

      const result = await fetchTemplateData(slug, productId);
      console.log(`Template data result for ${slug}:`, result);

      if (result && result.data) {
        setTemplateData((prev) => ({ ...prev, [slug]: result.data }));

        // Populate form data with existing template data
        const existingData = result.data;
        console.log(`Existing data for ${slug}:`, existingData);

        setTemplateFormData((prevFormData) => {
          const updatedFormData = { ...prevFormData };

          // Update form data for fields that have existing values
          Object.keys(prevFormData).forEach((key) => {
            if (key.startsWith(`${slug}_`)) {
              const fieldId = key.replace(`${slug}_`, "");
              if (existingData[fieldId] !== undefined) {
                console.log(
                  `Setting field ${key} to value:`,
                  existingData[fieldId]
                );
                updatedFormData[key] = existingData[fieldId];
              }
            }
          });

          console.log(`Updated form data for ${slug}:`, updatedFormData);
          return updatedFormData;
        });

        // Show success message
        const templateName =
          allTemplates.find((t) => t.slug === slug)?.name || slug;
        setSuccess(`Template data loaded for ${templateName}`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error(`Error fetching template data for ${slug}:`, error);
      // Don't show error to user as this is optional data
    } finally {
      setTemplateDataLoading((prev) => ({ ...prev, [slug]: false }));
    }
  };

  // Manually populate form with template data (for debugging)
  const populateFormWithTemplateData = (slug: string) => {
    const existingData = templateData[slug];
    if (!existingData) {
      setError(`No template data available for ${slug}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    console.log(`=== Manual Population for ${slug} ===`);
    console.log(`Template data:`, existingData);
    console.log(`Current form data:`, templateFormData);

    setTemplateFormData((prevFormData) => {
      const updatedFormData = { ...prevFormData };

      // Update form data for fields that have existing values
      Object.keys(prevFormData).forEach((key) => {
        if (key.startsWith(`${slug}_`)) {
          const fieldId = key.replace(`${slug}_`, "");
          if (existingData[fieldId] !== undefined) {
            console.log(
              `Manually setting field ${key} to value:`,
              existingData[fieldId]
            );
            updatedFormData[key] = existingData[fieldId];
          }
        }
      });

      console.log(`Updated form data for ${slug}:`, updatedFormData);
      return updatedFormData;
    });

    const templateName =
      allTemplates.find((t) => t.slug === slug)?.name || slug;
    setSuccess(`Form populated with template data for ${templateName}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Debug function to show current state
  const debugTemplateState = (slug: string) => {
    console.log(`=== Debug State for ${slug} ===`);
    console.log(`Template data:`, templateData[slug]);
    console.log(`Template fields:`, templateFields[slug]);
    console.log(
      `Form data keys:`,
      Object.keys(templateFormData).filter((key) => key.startsWith(`${slug}_`))
    );
    console.log(
      `Form data values:`,
      Object.fromEntries(
        Object.entries(templateFormData).filter(([key]) =>
          key.startsWith(`${slug}_`)
        )
      )
    );
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

      console.log(`Saving template ${templateSlug} data:`, templateDataToSave);

      // TODO: Implement actual save logic here
      // This could be an API call to save the template field values

      setSuccess(`Template ${templateSlug} data saved successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error(`Error saving template ${templateSlug} data:`, error);
      setError(`Failed to save template ${templateSlug} data`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingTemplate((prev) => ({ ...prev, [templateSlug]: false }));
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setProductLoading(true);
        setError(null);
        const productsData = await fetchProduct(productId);
        const foundProduct = productsData?.data;
        console.log("productsData", productsData);

        if (foundProduct) {
          setProduct(foundProduct);
          setMainImage({
            url: productsData?.included?.main_images?.[0]?.link?.href || "",
            alt: foundProduct.attributes.name || "Product Image",
          });

          // Initialize form data with product values
          setFormData({
            name: foundProduct.attributes.name || "",
            description: foundProduct.attributes.description || "",
            slug: foundProduct.attributes.slug || "",
            sku: foundProduct.attributes.sku || "",
            status: foundProduct.attributes.status || "draft",
            commodity_type:
              foundProduct.attributes.commodity_type || "physical",
          });

          // Initialize attributes data from product
          // Check for any custom attributes that might exist on the product
          const productAttributes =
            (foundProduct as any).attributes?.attributes || {};
          setAttributesData(productAttributes);

          // Fetch inventory data for this product
          if (foundProduct.attributes.sku) {
            fetchInventory(foundProduct.attributes.sku);
          }
        }
      } catch (err) {
        setError("Failed to load product");
        console.error("Error loading product:", err);
      } finally {
        setProductLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, fetchProduct]);

  // Load templates when attributes tab is selected
  useEffect(() => {
    const init = async () => {
      if (activeTab === "attributes") {
        console.log("loadAllTemplates");
        const [allTemplatesResult, productTemplatesResult] = await Promise.all([
          loadAllTemplates(),
          loadProductTemplates(),
        ]);

        // Load template fields with the actual data returned from the functions
        await loadTemplateFields(allTemplatesResult, productTemplatesResult);
        console.log("loadTemplateFields", templateFields);

        // Initialize showTemplateForms state for each template
        const initialShowState: Record<string, boolean> = {};
        allTemplatesResult.forEach((template) => {
          if (template.slug) {
            initialShowState[template.slug] = true; // Show by default
          }
        });
        setShowTemplateForms(initialShowState);
      }
    };
    init();
  }, [activeTab]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!product) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare update data
      const updateData = {
        type: "product",
        id: product.id,
        attributes: {
          name: formData.name,
          description: formData.description,
          slug: formData.slug,
          sku: formData.sku,
          status: formData.status,
          commodity_type: formData.commodity_type,
          attributes: attributesData, // Include custom attributes
        },
      };

      // Call update API
      const result = await updateProduct(product.id, updateData);

      if (result) {
        setSuccess("Product updated successfully!");
        // Update local product state
        setProduct((prev: PcmProduct | null) =>
          prev
            ? { ...prev, attributes: { ...prev.attributes, ...formData } }
            : null
        );

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update product");
      }
    } catch (err) {
      setError("Failed to update product");
      console.error("Error updating product:", err);
    } finally {
      setSaving(false);
    }
  };

  // Save attributes separately
  const handleSaveAttributes = async () => {
    if (!product) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare update data with only attributes
      const updateData = {
        type: "product",
        id: product.id,
        attributes: {
          ...product.attributes,
          attributes: attributesData, // Update only the custom attributes
        },
      };

      // Call update API
      const result = await updateProduct(product.id, updateData);

      if (result) {
        setSuccess("Attributes updated successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update attributes");
      }
    } catch (err) {
      setError("Failed to update attributes");
      console.error("Error updating attributes:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handle template form input changes
  const handleTemplateFormChange = (fieldKey: string, value: any) => {
    setTemplateFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const isFormChanged = () => {
    if (!product) return false;

    return (
      formData.name !== (product.attributes.name || "") ||
      formData.description !== (product.attributes.description || "") ||
      formData.slug !== (product.attributes.slug || "") ||
      formData.sku !== (product.attributes.sku || "") ||
      formData.status !== (product.attributes.status || "draft") ||
      formData.commodity_type !==
        (product.attributes.commodity_type || "physical")
    );
  };

  // Helper function to format date to ISO string
  const formatDateToISO = (dateString: string): string | undefined => {
    if (!dateString) return undefined;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateString);
        return undefined;
      }
      return date.toISOString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return undefined;
    }
  };

  // Helper function to ensure integer values
  const ensureInteger = (value: any, defaultValue: number = 0): number => {
    const parsed = parseInt(String(value));
    return isNaN(parsed) ? defaultValue : parsed;
  };

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
        setError("Inventory record not found");
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
        setSuccess("Inventory quantity updated successfully!");
        setEditingInventory(null);
        setEditingQuantity(0);
        // Refresh inventory data
        if (product?.attributes.sku) {
          fetchInventory(product.attributes.sku);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update inventory quantity");
      }
    } catch (err) {
      setError("Failed to update inventory quantity");
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
          ep_id: product?.attributes.sku + newInventory.ep_available_date,
          ep_shelf_life_days: ensureInteger(newInventory.ep_shelf_life_days),
          ep_available_date: formattedAvailableDate,
          ep_sku: product?.attributes.sku || "",
        },
      };

      const result = await createInventory(inventoryData);
      if (result) {
        setSuccess("Inventory record created successfully!");
        setShowNewInventoryForm(false);
        setNewInventory({
          ep_available_date: "",
          ep_shelf_life_days: 0,
          ep_available: 0,
        });
        // Refresh inventory data
        if (product?.attributes.sku) {
          fetchInventory(product.attributes.sku);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to create inventory record");
      }
    } catch (err) {
      setError("Failed to create inventory record");
      console.error("Error creating inventory:", err);
    }
  };

  const handleUpdateInventory = async (
    inventoryId: string,
    updatedData: any
  ) => {
    try {
      // Convert available date to ISO format if provided
      const formattedUpdatedData = {
        ...updatedData,
        attributes: {
          ...updatedData.attributes,
          ep_available_date: formatDateToISO(
            updatedData.attributes?.ep_available_date
          ),
          ep_shelf_life_days: ensureInteger(
            updatedData.attributes?.ep_shelf_life_days
          ),
          ep_available: ensureInteger(updatedData.attributes?.ep_available),
        },
      };

      const result = await updateInventory(inventoryId, formattedUpdatedData);
      if (result) {
        setSuccess("Inventory record updated successfully!");
        setEditingInventory(null);
        // Refresh inventory data
        if (product?.attributes.sku) {
          fetchInventory(product.attributes.sku);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update inventory record");
      }
    } catch (err) {
      setError("Failed to update inventory record");
      console.error("Error updating inventory:", err);
    }
  };

  const handleDeleteInventory = async (inventoryId: string) => {
    if (!confirm("Are you sure you want to delete this inventory record?"))
      return;

    try {
      const result = await deleteInventory(inventoryId);
      if (result) {
        setSuccess("Inventory record deleted successfully!");
        // Refresh inventory data
        if (product?.attributes.sku) {
          fetchInventory(product.attributes.sku);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to delete inventory record");
      }
    } catch (err) {
      setError("Failed to delete inventory record");
      console.error("Error deleting inventory:", err);
    }
  };

  if (productLoading) {
    return (
      <div className="p-6 bg-white">
        <div className="w-full">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
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
              <p className="mt-4 text-gray-600">Loading product...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="p-6 bg-white">
        <div className="w-full">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
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
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Product
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/products")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="p-6 bg-white">
      <div className="w-full">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-green-400 mr-2"
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
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-400 mr-2"
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
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {product && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-8 py-8">
              <div className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Edit Product
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Product ID: {product.id}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => router.push("/products")}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !isFormChanged()}
                      className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {saving ? (
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
                          Saving...
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
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "details"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Product Details
                  </button>
                  <button
                    onClick={() => setActiveTab("attributes")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "attributes"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Attributes
                    {Object.keys(attributesData).length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {Object.keys(attributesData).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "inventory"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Inventory
                    {inventoryData.length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {inventoryData.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {activeTab === "details" ? (
                /* Product Details Content */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-4">
                        Main Image
                      </label>
                      <div className="relative">
                        <div className="w-full flex justify-center">
                          <img
                            src={
                              mainImage?.url ||
                              "https://placehold.co/400x400?text=Product+Image"
                            }
                            alt={mainImage?.alt || "Product Image"}
                            className="w-80 h-80 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-all duration-200 shadow-lg border border-gray-200 hover:shadow-xl"
                            onClick={() => setSelectedImage(mainImage)}
                          />
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                          Image size: 400×400 pixels • Click to view larger
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-900 mb-4">
                        Quick Stats
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Status</span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              formData.status === "live"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {formData.status || "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Type</span>
                          <span className="text-sm font-medium text-blue-900">
                            {formData.commodity_type || "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Created</span>
                          <span className="text-sm font-medium text-blue-900">
                            {product.meta?.created_at
                              ? new Date(
                                  product.meta.created_at
                                ).toLocaleDateString()
                              : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="space-y-6">
                      {/* Product Name */}
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Product Name *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                            placeholder="Enter product name"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* SKU and Slug Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            SKU *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="sku"
                              id="sku"
                              value={formData.sku}
                              onChange={handleInputChange}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 font-mono"
                              placeholder="PROD-001"
                              required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Slug
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="slug"
                              id="slug"
                              value={formData.slug}
                              onChange={handleInputChange}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                              placeholder="product-name"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and Type Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Status
                          </label>
                          <div className="relative">
                            <select
                              name="status"
                              id="status"
                              value={formData.status}
                              onChange={handleInputChange}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 appearance-none"
                            >
                              <option value="draft">Draft</option>
                              <option value="live">Live</option>
                              <option value="archived">Archived</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
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
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Commodity Type
                          </label>
                          <div className="relative">
                            <select
                              name="commodity_type"
                              id="commodity_type"
                              value={formData.commodity_type}
                              onChange={handleInputChange}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 appearance-none"
                            >
                              <option value="physical">Physical</option>
                              <option value="digital">Digital</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
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
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Description
                        </label>
                        <div className="relative">
                          <textarea
                            name="description"
                            id="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                            placeholder="Enter product description..."
                          />
                          <div className="absolute top-3 right-3 pointer-events-none">
                            <svg
                              className="h-5 w-5 text-gray-400"
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === "attributes" ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="px-8 py-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Product Attributes
                    </h2>

                    {/* Template Information */}
                    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Available Templates */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-blue-900">
                            Available Templates
                          </h3>
                          <button
                            onClick={refreshTemplates}
                            disabled={
                              templatesLoading || productTemplatesLoading
                            }
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium p-1 rounded hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh templates"
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
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        </div>
                        {templatesLoading ? (
                          <div className="flex items-center text-blue-700">
                            <svg
                              className="animate-spin h-4 w-4 mr-2"
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
                            Loading templates...
                          </div>
                        ) : allTemplates.length > 0 ? (
                          <div className="space-y-2">
                            {allTemplates.slice(0, 5).map((template: any) => (
                              <div
                                key={template.id}
                                className="flex items-center justify-between text-sm p-2 bg-blue-100 rounded border border-blue-200"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-blue-800 font-medium truncate">
                                    {template?.name || template.id}
                                  </div>
                                  {template?.description && (
                                    <div className="text-blue-600 text-xs truncate">
                                      {template.description}
                                    </div>
                                  )}
                                </div>
                                <span className="text-blue-600 text-xs ml-2 flex-shrink-0">
                                  {template.type}
                                </span>
                              </div>
                            ))}
                            {allTemplates.length > 5 && (
                              <div className="text-xs text-blue-600 pt-2 border-t border-blue-200">
                                +{allTemplates.length - 5} more templates
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-blue-700 text-sm">
                            No templates available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Template Fields Forms */}
                    {Object.keys(templateFields).length > 0 && (
                      <div className="mb-6 space-y-6">
                        {Object.entries(templateFields).map(
                          ([slug, fields]) => (
                            <div
                              key={slug}
                              className="bg-purple-50 rounded-lg p-6 border border-purple-200"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-purple-900">
                                  {allTemplates.find((t) => t.slug === slug)
                                    ?.name || slug}
                                </h3>
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() =>
                                      fetchTemplateDataForSlug(slug)
                                    }
                                    disabled={templateDataLoading[slug]}
                                    className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Refresh template data"
                                  >
                                    {templateDataLoading[slug] ? (
                                      <>
                                        <svg
                                          className="animate-spin h-4 w-4"
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
                                      </>
                                    ) : (
                                      <>
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
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                          />
                                        </svg>
                                      </>
                                    )}
                                  </button>
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
                                        Saving...
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
                                        Save
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
                                        const fieldValue =
                                          templateFormData[fieldKey] || "";
                                        const fieldName =
                                          field.name || field.slug;
                                        const fieldType = field.type || "text";
                                        const fieldRequired =
                                          field.required || false;

                                        // Debug logging for field values
                                        console.log(`Field ${fieldKey}:`, {
                                          fieldName,
                                          fieldValue,
                                          templateFormData:
                                            templateFormData[fieldKey],
                                          allFormData: templateFormData,
                                        });
                                        // Extract validation rules and find enum options
                                        let enumOptions: string[] = [];
                                        let fieldValidationRules: any = {};

                                        if (
                                          field.validation_rules &&
                                          Array.isArray(field.validation_rules)
                                        ) {
                                          field.validation_rules.forEach(
                                            (rule: any) => {
                                              if (
                                                rule.type === "enum" &&
                                                rule.options &&
                                                Array.isArray(rule.options)
                                              ) {
                                                enumOptions = rule.options;
                                              } else {
                                                // Store other validation rules
                                                fieldValidationRules[
                                                  rule.type
                                                ] = rule.value || rule.options;
                                              }
                                            }
                                          );
                                        }

                                        const fieldDescription =
                                          field.description;

                                        return (
                                          <div
                                            key={field.slug}
                                            className="space-y-2"
                                          >
                                            <label className="block text-sm font-medium text-gray-700">
                                              {fieldName}
                                              {fieldRequired && (
                                                <span className="text-red-500 ml-1">
                                                  *
                                                </span>
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
                                                  (
                                                    option: string,
                                                    index: number
                                                  ) => (
                                                    <option
                                                      key={index}
                                                      value={option}
                                                    >
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

                                            {Object.keys(fieldValidationRules)
                                              .length > 0 && (
                                              <div className="text-xs text-purple-600">
                                                {fieldValidationRules.min && (
                                                  <div>
                                                    Min:{" "}
                                                    {fieldValidationRules.min}
                                                  </div>
                                                )}
                                                {fieldValidationRules.max && (
                                                  <div>
                                                    Max:{" "}
                                                    {fieldValidationRules.max}
                                                  </div>
                                                )}
                                                {fieldValidationRules.pattern && (
                                                  <div>
                                                    Pattern:{" "}
                                                    {
                                                      fieldValidationRules.pattern
                                                    }
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
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="px-8 py-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Inventory Records
                    </h2>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => setShowNewInventoryForm(true)}
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
                        Add New Inventory
                      </button>
                    </div>

                    {showNewInventoryForm && (
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          New Inventory Record
                        </h3>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> SKU will be automatically set
                            to "{product?.attributes.sku}" from the product.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Available Date
                            </label>
                            <input
                              type="date"
                              value={newInventory.ep_available_date}
                              onChange={(e) =>
                                setNewInventory({
                                  ...newInventory,
                                  ep_available_date: e.target.value,
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Available Date"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Date will be converted to ISO format (UTC) when
                              saving
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Shelf Life (Days)
                            </label>
                            <input
                              type="number"
                              value={newInventory.ep_shelf_life_days}
                              onChange={(e) =>
                                setNewInventory({
                                  ...newInventory,
                                  ep_shelf_life_days: ensureInteger(
                                    e.target.value
                                  ),
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? (
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
                                Saving...
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
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                Add Inventory
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

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
                        <p className="mt-4 text-gray-600">
                          Loading inventory...
                        </p>
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
                                            setEditingQuantity(
                                              ensureInteger(e.target.value)
                                            )
                                          }
                                          className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                          min="0"
                                          step="1"
                                          placeholder="0"
                                        />
                                      </div>
                                      <div className="flex flex-col space-y-1">
                                        <button
                                          onClick={() =>
                                            saveInventoryQuantity(inventory.id)
                                          }
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
                                    onClick={() =>
                                      startEditInventory(inventory)
                                    }
                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteInventory(inventory.id)
                                    }
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <ImageOverlay
          imageUrl={selectedImage.url}
          altText={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
