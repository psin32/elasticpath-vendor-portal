export type FieldType =
  | "text"
  | "number"
  | "email"
  | "date"
  | "boolean"
  | "select"
  | "phone"
  | "url"
  | "currency";

export interface ValidationRule {
  type:
    | "required"
    | "minLength"
    | "maxLength"
    | "min"
    | "max"
    | "regex"
    | "email"
    | "url";
  value?: string | number;
  message?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  validationRules: ValidationRule[];
  selectOptions?: SelectOption[];
  defaultValue?: string;
  description?: string;
  order: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  entityType: "products" | "orders" | "customers" | "custom";
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateData {
  id: string;
  templateId: string;
  data: Record<string, any>;
  errors?: Record<string, string[]>;
  isValid: boolean;
}

export interface ValidationError {
  fieldId: string;
  fieldName: string;
  errors: string[];
}

export interface TemplateDataset {
  id: string;
  templateId: string;
  name: string;
  rows: TemplateData[];
  createdAt: Date;
  updatedAt: Date;
}
