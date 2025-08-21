import { useState, useCallback, useEffect } from "react";
import {
  Mapping,
  MappingField,
  MappingData,
  MappingDataset,
  ValidationError,
} from "../types/mapping";

const STORAGE_KEY_MAPPINGS = "epcc_mappings";
const STORAGE_KEY_DATASETS = "epcc_datasets";

export const useMappingManager = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [datasets, setDatasets] = useState<MappingDataset[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedMappings = localStorage.getItem(STORAGE_KEY_MAPPINGS);
      const savedDatasets = localStorage.getItem(STORAGE_KEY_DATASETS);

      if (savedMappings) {
        setMappings(JSON.parse(savedMappings));
      }

      if (savedDatasets) {
        setDatasets(JSON.parse(savedDatasets));
      }
    } catch (error) {
      console.error("Error loading mappings from storage:", error);
    }
  }, []);

  // Save mappings to localStorage
  const saveMappings = useCallback((newMappings: Mapping[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_MAPPINGS, JSON.stringify(newMappings));
      setMappings(newMappings);
    } catch (error) {
      console.error("Error saving mappings to storage:", error);
    }
  }, []);

  // Save datasets to localStorage
  const saveDatasets = useCallback((newDatasets: MappingDataset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_DATASETS, JSON.stringify(newDatasets));
      setDatasets(newDatasets);
    } catch (error) {
      console.error("Error saving datasets to storage:", error);
    }
  }, []);

  // Mapping CRUD operations
  const createMapping = useCallback(
    (mapping: Omit<Mapping, "id" | "createdAt" | "updatedAt">) => {
      const newMapping: Mapping = {
        ...mapping,
        id: `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newMappings = [...mappings, newMapping];
      saveMappings(newMappings);
      return newMapping;
    },
    [mappings, saveMappings]
  );

  const updateMapping = useCallback(
    (id: string, updates: Partial<Mapping>) => {
      const newMappings = mappings.map((mapping) =>
        mapping.id === id
          ? { ...mapping, ...updates, updatedAt: new Date() }
          : mapping
      );
      saveMappings(newMappings);
    },
    [mappings, saveMappings]
  );

  const deleteMapping = useCallback(
    (id: string) => {
      const newMappings = mappings.filter((mapping) => mapping.id !== id);
      saveMappings(newMappings);

      // Also delete associated datasets
      const newDatasets = datasets.filter(
        (dataset) => dataset.mappingId !== id
      );
      saveDatasets(newDatasets);
    },
    [mappings, datasets, saveMappings, saveDatasets]
  );

  // Dataset CRUD operations
  const createDataset = useCallback(
    (dataset: Omit<MappingDataset, "id" | "createdAt" | "updatedAt">) => {
      const newDataset: MappingDataset = {
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
    (id: string, updates: Partial<MappingDataset>) => {
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

  // Validation functions
  const validateField = useCallback(
    (field: MappingField, value: any): string[] => {
      const errors: string[] = [];

      // Required field validation
      if (field.required && (!value || value.toString().trim() === "")) {
        errors.push(`${field.label} is required`);
      }

      if (value && value.toString().trim() !== "") {
        // Min length validation
        const minLengthRule = field.validationRules.find(
          (rule) => rule.type === "minLength"
        );
        if (minLengthRule && value.toString().length < minLengthRule.value!) {
          errors.push(
            `${field.label} must be at least ${minLengthRule.value} characters`
          );
        }

        // Max length validation
        const maxLengthRule = field.validationRules.find(
          (rule) => rule.type === "maxLength"
        );
        if (maxLengthRule && value.toString().length > maxLengthRule.value!) {
          errors.push(
            `${field.label} must be no more than ${maxLengthRule.value} characters`
          );
        }

        // Min value validation
        const minRule = field.validationRules.find(
          (rule) => rule.type === "min"
        );
        if (minRule && Number(value) < Number(minRule.value!)) {
          errors.push(`${field.label} must be at least ${minRule.value}`);
        }

        // Max value validation
        const maxRule = field.validationRules.find(
          (rule) => rule.type === "max"
        );
        if (maxRule && Number(value) > Number(maxRule.value!)) {
          errors.push(`${field.label} must be no more than ${maxRule.value}`);
        }

        // Email validation
        const emailRule = field.validationRules.find(
          (rule) => rule.type === "email"
        );
        if (emailRule && field.type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.toString())) {
            errors.push(`${field.label} must be a valid email address`);
          }
        }

        // URL validation
        const urlRule = field.validationRules.find(
          (rule) => rule.type === "url"
        );
        if (urlRule && field.type === "url") {
          try {
            new URL(value.toString());
          } catch {
            errors.push(`${field.label} must be a valid URL`);
          }
        }

        // Regex validation
        const regexRule = field.validationRules.find(
          (rule) => rule.type === "regex"
        );
        if (regexRule && regexRule.value) {
          try {
            const regex = new RegExp(regexRule.value.toString());
            if (!regex.test(value.toString())) {
              errors.push(
                regexRule.message || `${field.label} format is invalid`
              );
            }
          } catch (error) {
            console.error("Invalid regex pattern:", regexRule.value);
          }
        }
      }

      return errors;
    },
    []
  );

  const validateRow = useCallback(
    (mapping: Mapping, rowData: Record<string, any>): ValidationError[] => {
      const errors: ValidationError[] = [];

      mapping.fields.forEach((field) => {
        const value = rowData[field.name];
        const fieldErrors = validateField(field, value);

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

  // Export functions
  const exportDatasetToCSV = useCallback(
    (datasetId: string) => {
      const dataset = datasets.find((d) => d.id === datasetId);
      if (!dataset) return null;

      const mapping = mappings.find((t) => t.id === dataset.mappingId);
      if (!mapping) return null;

      const headers = mapping.fields
        .sort((a, b) => a.order - b.order)
        .map((field) => field.label);

      const csvContent = [
        headers.join(","),
        ...dataset.rows.map((row) =>
          mapping.fields
            .sort((a, b) => a.order - b.order)
            .map((field) => {
              const value = row.data[field.name] || "";
              // Escape commas and quotes in CSV
              if (
                typeof value === "string" &&
                (value.includes(",") || value.includes('"'))
              ) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataset.name}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [datasets, mappings]
  );

  const exportDatasetToJSON = useCallback(
    (datasetId: string) => {
      const dataset = datasets.find((d) => d.id === datasetId);
      if (!dataset) return null;

      const mapping = mappings.find((t) => t.id === dataset.mappingId);
      if (!mapping) return null;

      const jsonData = {
        mapping: mapping.name,
        dataset: dataset.name,
        fields: mapping.fields
          .sort((a, b) => a.order - b.order)
          .map((field) => ({
            name: field.name,
            label: field.label,
            type: field.type,
          })),
        rows: dataset.rows.map((row) => ({
          data: mapping.fields
            .sort((a, b) => a.order - b.order)
            .reduce((acc, field) => {
              acc[field.name] = row.data[field.name] || "";
              return acc;
            }, {} as Record<string, any>),
          errors: row.errors,
          isValid: row.isValid,
        })),
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataset.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [datasets, mappings]
  );

  return {
    // State
    mappings,
    datasets,
    loading,

    // Mapping operations
    createMapping,
    updateMapping,
    deleteMapping,

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
