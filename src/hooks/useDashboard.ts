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
  const [standaloneStores, setStandaloneStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [standaloneStoresLoading, setStandaloneStoresLoading] = useState(false);

  // EPCC API hook - don't pass dependencies to avoid circular issues
  const { fetchOrgStores, fetchStores } = useEpccApi();

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

  // Fetch standalone stores (not part of any organization)
  const fetchStandaloneStores = async () => {
    setStandaloneStoresLoading(true);
    try {
      const result = await fetchStores();
      if (result && result.data) {
        setStandaloneStores(result.data);
        // Persist standalone stores to localStorage with timestamp
        const storeData = {
          stores: result.data,
          timestamp: Date.now(),
          type: "standalone",
        };
        localStorage.setItem("standalone_stores", JSON.stringify(storeData));
      } else {
        setStandaloneStores([]);
        const storeData = {
          stores: [],
          timestamp: Date.now(),
          type: "standalone",
        };
        localStorage.setItem("standalone_stores", JSON.stringify(storeData));
      }
    } catch (error) {
      console.error("Failed to fetch standalone stores:", error);
      setStandaloneStores([]);
      const storeData = {
        stores: [],
        timestamp: Date.now(),
        type: "standalone",
      };
      localStorage.setItem("standalone_stores", JSON.stringify(storeData));
    } finally {
      setStandaloneStoresLoading(false);
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

  // Load standalone stores from localStorage if available and not expired
  const loadStandaloneStoresFromStorage = () => {
    try {
      const storedData = localStorage.getItem("standalone_stores");
      if (storedData) {
        const parsedData = JSON.parse(storedData);

        // Check if the stored data is for standalone stores
        if (parsedData.type !== "standalone") {
          localStorage.removeItem("standalone_stores");
          return false;
        }

        // Check if the stored data is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const isExpired = Date.now() - parsedData.timestamp > maxAge;

        if (isExpired) {
          localStorage.removeItem("standalone_stores");
          return false;
        }

        setStandaloneStores(parsedData.stores);
        return true; // Indicates stores were loaded from storage
      }
    } catch (error) {
      console.error(
        "Failed to load standalone stores from localStorage:",
        error
      );
      // Clear corrupted data
      localStorage.removeItem("standalone_stores");
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
    } else if (savedStoreId) {
      // No organization selected but store is selected - this is standalone store mode
      setSelectedOrgId(null);
      setActiveSection("stores");

      // Try to load standalone stores from localStorage first
      const storesLoadedFromStorage = loadStandaloneStoresFromStorage();

      // If no stores in localStorage, fetch them from API
      if (!storesLoadedFromStorage) {
        fetchStandaloneStores();
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
    }
  };

  // Handle standalone store selection (clear organization)
  const handleStandaloneStoreSelect = async () => {
    setSelectedOrgId(null);
    localStorage.removeItem("selected_org_id");
    // Don't clear store ID - preserve standalone store selection
    setActiveSection("stores");
    setStoreSearchTerm("");
    setOrganizationStores([]);

    // Try to load standalone stores from localStorage first
    const storesLoadedFromStorage = loadStandaloneStoresFromStorage();

    // If no stores in localStorage, fetch them from API
    if (!storesLoadedFromStorage) {
      await fetchStandaloneStores();
    }
  };

  // Handle store selection
  const handleStoreSelect = (storeId: string) => {
    // Check if this is a different store
    if (selectedStoreId !== storeId) {
      setSelectedStoreId(storeId);
      localStorage.setItem("selected_store_id", storeId);

      // If no organization is selected, this is a standalone store
      if (!selectedOrgId) {
        // Ensure standalone stores are loaded
        if (standaloneStores.length === 0) {
          loadStandaloneStoresFromStorage();
        }
      }
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

  // Clear standalone stores
  const clearStandaloneStores = () => {
    localStorage.removeItem("standalone_stores");
    setStandaloneStores([]);
  };

  // Refresh organization stores (force fetch from API)
  const refreshOrganizationStores = async (orgId: string) => {
    // Clear stored data first
    localStorage.removeItem(`org_stores_${orgId}`);
    // Fetch fresh data
    await fetchOrganizationStores(orgId);
  };

  // Refresh standalone stores (force fetch from API)
  const refreshStandaloneStores = async () => {
    // Clear stored data first
    localStorage.removeItem("standalone_stores");
    // Fetch fresh data
    await fetchStandaloneStores();
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
    standaloneStores,
    storesLoading,
    standaloneStoresLoading,

    // Setters
    setActiveSection,
    setOrgSearchTerm,
    setStoreSearchTerm,

    // Handlers
    handleOrgSelect,
    handleStoreSelect,
    handleStandaloneStoreSelect,
    handleFilterModeToggle,
    clearSelections,
    clearOrganizationStores,
    clearStandaloneStores,
    refreshOrganizationStores,
    refreshStandaloneStores,
    fetchOrganizationStores: (orgId: string) => fetchOrganizationStores(orgId),
    fetchStandaloneStores,
    loadStandaloneStoresFromStorage,
  };
};
