export type DashboardSection =
  | "organizations"
  | "stores"
  | "products"
  | "orders"
  | "catalogs"
  | "accounts"
  | "order-on-behalf"
  | "inventory"
  | "upload"
  | "bulk-upload"
  | "templates"
  | "api-demo";

export type StoreFilterMode = "all" | "organization";

export interface OrganizationSelectorProps {
  organizations: any[];
  selectedOrgId: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOrgSelect: (orgId: string) => Promise<void>;
  onStandaloneStoreSelect?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export interface StoreSelectorProps {
  stores: any[];
  selectedStoreId: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onStoreSelect: (storeId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  storeFilterMode: StoreFilterMode;
}

export interface SidebarNavigationProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export interface DashboardHeaderProps {
  user: any;
  selectedOrgId: string | null;
  selectedStoreId: string | null;
  storeFilterMode: StoreFilterMode;
  organizationStores: any[];
  standaloneStores: any[];
  storesLoading: boolean;
  standaloneStoresLoading: boolean;
  orgSearchTerm: string;
  onOrgSearchChange: (value: string) => void;
  onOrgSelect: (orgId: string) => Promise<void>;
  onStoreSelect: (storeId: string) => void;
  onFetchOrganizationStores?: (orgId: string) => void;
  onStandaloneStoreSelect: () => Promise<void>;
  onLogout: () => void;
}

export interface DashboardContentProps {
  activeSection: DashboardSection;
  selectedOrgId: string | null;
  selectedStoreId: string | null;
  user: any;
  organizationStores: any[];
  storesLoading: boolean;
  storeFilterMode: StoreFilterMode;
  orgSearchTerm: string;
  onOrgSearchChange: (value: string) => void;
  onOrgSelect: (orgId: string) => Promise<void>;
  onStoreSelect: (storeId: string) => void;
  onFilterModeToggle: (mode: StoreFilterMode) => Promise<void>;
}
