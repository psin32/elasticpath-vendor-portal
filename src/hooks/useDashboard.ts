"use client";

import { useState, useEffect } from "react";
import { DashboardSection, StoreFilterMode } from "../types/dashboard";
import { useEpccApi } from "./useEpccApi";

export const useDashboard = () => {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("organizations");
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeFilterMode, setStoreFilterMode] =
    useState<StoreFilterMode>("all");
  const [organizationStores, setOrganizationStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);

  // EPCC API hook
  const { fetchStores } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );

  // Fetch stores for a specific organization
  const fetchOrganizationStores = async () => {
    setStoresLoading(true);
    try {
      const result = await fetchStores();
      if (result && result.data) {
        setOrganizationStores(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch organization stores:", error);
      setOrganizationStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  // Load selected org and store from localStorage on component mount
  useEffect(() => {
    const savedOrgId = localStorage.getItem("selected_org_id");
    const savedStoreId = localStorage.getItem("selected_store_id");
    const savedFilterMode =
      (localStorage.getItem("store_filter_mode") as StoreFilterMode) || "all";

    if (savedOrgId) {
      setSelectedOrgId(savedOrgId);
      setStoreFilterMode(savedFilterMode);
      setActiveSection("stores");
      if (savedFilterMode === "organization") {
        setStoreSearchTerm(savedOrgId);
        fetchOrganizationStores();
      }
    }

    if (savedStoreId) {
      setSelectedStoreId(savedStoreId);
    }
  }, []);

  // Handle organization selection
  const handleOrgSelect = async (orgId: string) => {
    setSelectedOrgId(orgId);
    localStorage.setItem("selected_org_id", orgId);
    setSelectedStoreId(null);
    localStorage.removeItem("selected_store_id");
    setActiveSection("stores");
    setStoreFilterMode("organization");
    localStorage.setItem("store_filter_mode", "organization");
    setStoreSearchTerm(orgId);
    await fetchOrganizationStores();
  };

  // Handle store selection
  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    localStorage.setItem("selected_store_id", storeId);
  };

  // Handle filter mode toggle
  const handleFilterModeToggle = async (mode: StoreFilterMode) => {
    setStoreFilterMode(mode);
    localStorage.setItem("store_filter_mode", mode);
    setStoreSearchTerm("");

    if (mode === "organization" && selectedOrgId) {
      await fetchOrganizationStores();
    }
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedOrgId(null);
    setSelectedStoreId(null);
    setStoreFilterMode("all");
    localStorage.removeItem("selected_org_id");
    localStorage.removeItem("selected_store_id");
    localStorage.setItem("store_filter_mode", "all");
    setStoreSearchTerm("");
  };

  return {
    // State
    activeSection,
    orgSearchTerm,
    storeSearchTerm,
    selectedOrgId,
    selectedStoreId,
    storeFilterMode,
    organizationStores,
    storesLoading,

    // Setters
    setActiveSection,
    setOrgSearchTerm,
    setStoreSearchTerm,

    // Handlers
    handleOrgSelect,
    handleStoreSelect,
    handleFilterModeToggle,
    clearSelections,
  };
};
