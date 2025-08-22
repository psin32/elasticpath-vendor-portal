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

export interface MappingField {
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

export interface Mapping {
  id: string;
  name: string;
  description?: string;
  fields: MappingField[];
  entityType: "products" | "orders" | "customers" | "custom";
  customApiName?: string;
  externalReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MappingData {
  id: string;
  mappingId: string;
  data: Record<string, any>;
  errors?: Record<string, string[]>;
  isValid: boolean;
}

export interface ValidationError {
  fieldId: string;
  fieldName: string;
  errors: string[];
}

export interface MappingDataset {
  id: string;
  mappingId: string;
  name: string;
  rows: MappingData[];
  createdAt: Date;
  updatedAt: Date;
}
