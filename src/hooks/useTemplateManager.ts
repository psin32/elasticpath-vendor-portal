import { useState, useCallback, useEffect } from "react";
import {
  Template,
  TemplateField,
  TemplateData,
  TemplateDataset,
  ValidationError,
} from "../types/template";

const STORAGE_KEY_TEMPLATES = "epcc_templates";
const STORAGE_KEY_DATASETS = "epcc_datasets";

export const useTemplateManager = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [datasets, setDatasets] = useState<TemplateDataset[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      const savedDatasets = localStorage.getItem(STORAGE_KEY_DATASETS);

      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }

      if (savedDatasets) {
        setDatasets(JSON.parse(savedDatasets));
      }
    } catch (error) {
      console.error("Error loading templates from storage:", error);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: Template[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error("Error saving templates to storage:", error);
    }
  }, []);

  // Save datasets to localStorage
  const saveDatasets = useCallback((newDatasets: TemplateDataset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_DATASETS, JSON.stringify(newDatasets));
      setDatasets(newDatasets);
    } catch (error) {
      console.error("Error saving datasets to storage:", error);
    }
  }, []);

  // Template CRUD operations
  const createTemplate = useCallback(
    (template: Omit<Template, "id" | "createdAt" | "updatedAt">) => {
      const newTemplate: Template = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newTemplates = [...templates, newTemplate];
      saveTemplates(newTemplates);
      return newTemplate;
    },
    [templates, saveTemplates]
  );

  const updateTemplate = useCallback(
    (id: string, updates: Partial<Template>) => {
      const newTemplates = templates.map((template) =>
        template.id === id
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      );
      saveTemplates(newTemplates);
    },
    [templates, saveTemplates]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      const newTemplates = templates.filter((template) => template.id !== id);
      saveTemplates(newTemplates);

      // Also delete associated datasets
      const newDatasets = datasets.filter(
        (dataset) => dataset.templateId !== id
      );
      saveDatasets(newDatasets);
    },
    [templates, datasets, saveTemplates, saveDatasets]
  );

  // Dataset CRUD operations
  const createDataset = useCallback(
    (dataset: Omit<TemplateDataset, "id" | "createdAt" | "updatedAt">) => {
      const newDataset: TemplateDataset = {
        ...dataset,
        id: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newDatasets = [...datasets, newDataset];
      saveDatasets(newDatasets);
      return newDataset;
    },
    [datasets, saveDatasets]
  );

  const updateDataset = useCallback(
    (id: string, updates: Partial<TemplateDataset>) => {
      const newDatasets = datasets.map((dataset) =>
        dataset.id === id
          ? { ...dataset, ...updates, updatedAt: new Date() }
          : dataset
      );
      saveDatasets(newDatasets);
    },
    [datasets, saveDatasets]
  );

  const deleteDataset = useCallback(
    (id: string) => {
      const newDatasets = datasets.filter((dataset) => dataset.id !== id);
      saveDatasets(newDatasets);
    },
    [datasets, saveDatasets]
  );

  // Data validation
  const validateField = useCallback(
    (field: TemplateField, value: any): string[] => {
      const errors: string[] = [];

      // Required validation
      if (field.required && (!value || value.toString().trim() === "")) {
        errors.push(`${field.label} is required`);
        return errors; // Don't continue validation if field is required but empty
      }

      // Skip other validations if field is empty and not required
      if (!value || value.toString().trim() === "") {
        return errors;
      }

      // Type-specific validation
      switch (field.type) {
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field.label} must be a valid email address`);
          }
          break;

        case "url":
          try {
            new URL(value);
          } catch {
            errors.push(`${field.label} must be a valid URL`);
          }
          break;

        case "number":
          if (isNaN(Number(value))) {
            errors.push(`${field.label} must be a valid number`);
          }
          break;

        case "phone":
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/\s|-|\(|\)/g, ""))) {
            errors.push(`${field.label} must be a valid phone number`);
          }
          break;

        case "date":
          if (isNaN(Date.parse(value))) {
            errors.push(`${field.label} must be a valid date`);
          }
          break;
      }
      console.log("field.validationRules", field.validationRules);

      // Custom validation rules
      field.validationRules?.forEach((rule) => {
        switch (rule.type) {
          case "minLength":
            if (value.toString().length < (rule.value as number)) {
              errors.push(
                rule.message ||
                  `${field.label} must be at least ${rule.value} characters`
              );
            }
            break;

          case "maxLength":
            if (value.toString().length > (rule.value as number)) {
              errors.push(
                rule.message ||
                  `${field.label} must be no more than ${rule.value} characters`
              );
            }
            break;

          case "min":
            if (Number(value) < (rule.value as number)) {
              errors.push(
                rule.message || `${field.label} must be at least ${rule.value}`
              );
            }
            break;

          case "max":
            if (Number(value) > (rule.value as number)) {
              errors.push(
                rule.message ||
                  `${field.label} must be no more than ${rule.value}`
              );
            }
            break;

          case "regex":
            const regex = new RegExp(rule.value as string);
            if (!regex.test(value.toString())) {
              errors.push(rule.message || `${field.label} format is invalid`);
            }
            break;
        }
      });

      return errors;
    },
    []
  );

  const validateRow = useCallback(
    (template: Template, rowData: Record<string, any>): ValidationError[] => {
      const errors: ValidationError[] = [];

      template.fields.forEach((field) => {
        const fieldErrors = validateField(field, rowData[field.name]);
        if (fieldErrors.length > 0) {
          errors.push({
            fieldId: field.id,
            fieldName: field.name,
            errors: fieldErrors,
          });
        }
      });

      return errors;
    },
    [validateField]
  );

  // Export data
  const exportDatasetToCSV = useCallback(
    (datasetId: string) => {
      const dataset = datasets.find((d) => d.id === datasetId);
      const template = templates.find((t) => t.id === dataset?.templateId);

      if (!dataset || !template) return null;

      const headers = template.fields
        .sort((a, b) => a.order - b.order)
        .map((field) => field.label);

      const rows = dataset.rows.map((row) =>
        template.fields
          .sort((a, b) => a.order - b.order)
          .map((field) => row.data[field.name] || "")
      );

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataset.name}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    [datasets, templates]
  );

  const exportDatasetToJSON = useCallback(
    (datasetId: string) => {
      const dataset = datasets.find((d) => d.id === datasetId);

      if (!dataset) return null;

      const jsonContent = JSON.stringify(
        dataset.rows.map((row) => row.data),
        null,
        2
      );
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataset.name}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    [datasets]
  );

  return {
    templates,
    datasets,
    loading,

    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,

    // Dataset operations
    createDataset,
    updateDataset,
    deleteDataset,

    // Validation
    validateField,
    validateRow,

    // Export
    exportDatasetToCSV,
    exportDatasetToJSON,
  };
};
