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

  // EPCC API hook - don't pass dependencies to avoid circular issues
  const { fetchOrgStores } = useEpccApi();

  // Fetch stores for a specific organization
  const fetchOrganizationStores = async (orgId: string) => {
    setStoresLoading(true);
    try {
      const result = await fetchOrgStores(orgId);
      if (result && result.data) {
        setOrganizationStores(result.data);
        // Persist organization stores to localStorage with timestamp
        const storeData = {
          stores: result.data,
          timestamp: Date.now(),
          orgId: orgId,
        };
        localStorage.setItem(`org_stores_${orgId}`, JSON.stringify(storeData));
      } else {
        setOrganizationStores([]);
        const storeData = {
          stores: [],
          timestamp: Date.now(),
          orgId: orgId,
        };
        localStorage.setItem(`org_stores_${orgId}`, JSON.stringify(storeData));
      }
    } catch (error) {
      console.error("Failed to fetch organization stores:", error);
      setOrganizationStores([]);
      const storeData = {
        stores: [],
        timestamp: Date.now(),
        orgId: orgId,
      };
      localStorage.setItem(`org_stores_${orgId}`, JSON.stringify(storeData));
    } finally {
      setStoresLoading(false);
    }
  };

  // Load organization stores from localStorage if available and not expired
  const loadOrganizationStoresFromStorage = (orgId: string) => {
    try {
      const storedData = localStorage.getItem(`org_stores_${orgId}`);
      if (storedData) {
        const parsedData = JSON.parse(storedData);

        // Check if the stored data is for the correct organization
        if (parsedData.orgId !== orgId) {
          localStorage.removeItem(`org_stores_${orgId}`);
          return false;
        }

        // Check if the stored data is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const isExpired = Date.now() - parsedData.timestamp > maxAge;

        if (isExpired) {
          localStorage.removeItem(`org_stores_${orgId}`);
          return false;
        }

        setOrganizationStores(parsedData.stores);
        return true; // Indicates stores were loaded from storage
      }
    } catch (error) {
      console.error(
        "Failed to load organization stores from localStorage:",
        error
      );
      // Clear corrupted data
      localStorage.removeItem(`org_stores_${orgId}`);
    }
    return false; // Indicates no stores were found in storage
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

      // Try to load organization stores from localStorage first
      const storesLoadedFromStorage =
        loadOrganizationStoresFromStorage(savedOrgId);

      // If no stores in localStorage, fetch them from API
      if (!storesLoadedFromStorage) {
        fetchOrganizationStores(savedOrgId);
      }

      if (savedFilterMode === "organization") {
        setStoreSearchTerm(savedOrgId);
      }
    }

    if (savedStoreId) {
      setSelectedStoreId(savedStoreId);
    }
  }, []);

  // Handle organization selection
  const handleOrgSelect = async (orgId: string) => {
    // Check if this is a different organization
    if (selectedOrgId !== orgId) {
      setSelectedOrgId(orgId);
      localStorage.setItem("selected_org_id", orgId);
      setSelectedStoreId(null);
      localStorage.removeItem("selected_store_id");
      setActiveSection("stores");
      setStoreSearchTerm("");

      // Try to load organization stores from localStorage first
      const storesLoadedFromStorage = loadOrganizationStoresFromStorage(orgId);

      // If no stores in localStorage, fetch them from API
      if (!storesLoadedFromStorage) {
        await fetchOrganizationStores(orgId);
      }

      // Small delay to ensure localStorage is updated and user sees the selection
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // Handle store selection
  const handleStoreSelect = (storeId: string) => {
    // Check if this is a different store
    if (selectedStoreId !== storeId) {
      setSelectedStoreId(storeId);
      localStorage.setItem("selected_store_id", storeId);

      // Small delay to ensure localStorage is updated and user sees the selection
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // Handle filter mode toggle
  const handleFilterModeToggle = async (mode: StoreFilterMode) => {
    setStoreFilterMode(mode);
    localStorage.setItem("store_filter_mode", mode);
    setStoreSearchTerm("");
    // Don't automatically fetch organization stores - this is handled separately
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
    setOrganizationStores([]);
  };

  // Clear organization stores for a specific organization
  const clearOrganizationStores = (orgId: string) => {
    localStorage.removeItem(`org_stores_${orgId}`);
    setOrganizationStores([]);
  };

  // Refresh organization stores (force fetch from API)
  const refreshOrganizationStores = async (orgId: string) => {
    // Clear stored data first
    localStorage.removeItem(`org_stores_${orgId}`);
    // Fetch fresh data
    await fetchOrganizationStores(orgId);
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
    clearOrganizationStores,
    refreshOrganizationStores,
    fetchOrganizationStores: (orgId: string) => fetchOrganizationStores(orgId),
  };
};
