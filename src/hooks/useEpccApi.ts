"use client";

import { useCallback, useEffect, useState } from "react";
import { useEpccClientWithState } from "./useEpccClient";
import { useAuth } from "../contexts/AuthContext";
import type { ElasticPath } from "@elasticpath/js-sdk";

/**
 * Enhanced hook for EPCC API interactions with error handling and loading states
 */
export const useEpccApi = (orgId?: string, storeId?: string) => {
  const {
    client,
    loading: clientLoading,
    error: clientError,
    isReady,
  } = useEpccClientWithState(orgId, storeId);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Generic API call wrapper with error handling
   */
  const apiCall = useCallback(
    async <T>(
      apiFunction: (client: ElasticPath) => Promise<T>,
      errorMessage = "API call failed"
    ): Promise<T | null> => {
      if (!client || !isReady) {
        setApiError("Client not ready");
        return null;
      }

      setApiLoading(true);
      setApiError(null);

      try {
        const result = await apiFunction(client);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : errorMessage;
        setApiError(message);
        console.error("EPCC API Error:", error);
        return null;
      } finally {
        setApiLoading(false);
      }
    },
    [client, isReady]
  );

  /**
   * Fetch organizations
   */
  const fetchOrganizations = useCallback(async () => {
    return apiCall(async (client) => {
      // Use the SDK's request method for user organizations
      return await client.request.send("user/organizations", "GET");
    }, "Failed to fetch organizations");
  }, [apiCall]);

  /**
   * Fetch stores
   */
  const fetchStores = useCallback(async () => {
    return apiCall(async (client) => {
      // Use the SDK's request method for user stores
      return await client.request.send("user/stores", "GET");
    }, "Failed to fetch stores");
  }, [apiCall]);

  /**
   * Fetch stores
   */
  const fetchOrgStores = useCallback(
    async (orgId: string) => {
      return apiCall(async (client) => {
        // Use the SDK's request method for user stores

        return await client.request.send(
          "stores",
          "GET",
          undefined,
          undefined,
          client,
          false,
          "v2",
          {
            "EP-ORG-ID": orgId,
          }
        );
      }, "Failed to fetch stores");
    },
    [apiCall]
  );

  /**
   * Fetch organization by ID
   */
  const fetchOrganization = useCallback(
    async (orgId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(`user/organizations/${orgId}`, "GET");
      }, `Failed to fetch organization ${orgId}`);
    },
    [apiCall]
  );

  /**
   * Fetch store by ID
   */
  const fetchStore = useCallback(
    async (storeId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(`user/stores/${storeId}`, "GET");
      }, `Failed to fetch store ${storeId}`);
    },
    [apiCall]
  );

  /**
   * Fetch products (if needed for admin portal)
   */
  const fetchProducts = useCallback(
    async (options?: { limit?: number; offset?: number }) => {
      return apiCall(async (client) => {
        const limit = options?.limit || 100;
        const offset = options?.offset || 0;

        return await client.PCM.Limit(limit)
          .Offset(offset)
          .With("main_image")
          .All();
      }, "Failed to fetch products");
    },
    [apiCall]
  );

  /**
   * Fetch product by ID
   */
  const fetchProduct = useCallback(
    async (productId: string) => {
      return apiCall(async (client) => {
        return await client.PCM.With("main_image").Get(productId);
      }, "Failed to fetch product");
    },
    [apiCall]
  );

  /**
   * Fetch orders with pagination
   */
  const fetchOrders = useCallback(
    async (options?: { page?: number; limit?: number }) => {
      return apiCall(async (client) => {
        const limit = options?.limit || 100;
        const offset = options?.page || 0;

        return await client.Orders.Limit(limit).Offset(offset).All();
      }, "Failed to fetch orders");
    },
    [apiCall]
  );

  /**
   * Fetch a single order by ID
   */
  const fetchOrder = useCallback(
    async (orderId: string) => {
      return apiCall(async (client) => {
        const filters: any = ["items", "shipping-groups", "promotions"];
        return await client.Orders.With(filters).Get(orderId);
      }, "Failed to fetch order");
    },
    [apiCall]
  );

  /**
   * Fetch shipping groups for an order
   */
  const fetchShippingGroups = useCallback(
    async (orderId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `orders/${orderId}/shipping-groups`,
          "GET",
          undefined,
          undefined,
          client,
          undefined,
          "v2"
        );
      }, "Failed to fetch shipping groups");
    },
    [apiCall]
  );

  /**
   * Fetch catalogs
   */
  const fetchCatalogs = useCallback(async () => {
    return apiCall(async (client) => {
      // Use the SDK's Catalogs method
      return await client.Catalogs.All();
    }, "Failed to fetch catalogs");
  }, [apiCall]);

  /**
   * Get current user profile
   */
  const fetchUserProfile = useCallback(async () => {
    return apiCall(async (client) => {
      // Use the SDK's request method for user profile
      return await client.request.send("user", "GET");
    }, "Failed to fetch user profile");
  }, [apiCall]);

  /**
   * Fetch user role with organization and store context
   */
  const fetchUserRole = useCallback(
    async (userId: string, orgId?: string, storeId?: string) => {
      return apiCall(async (client) => {
        // Build headers based on provided parameters

        // Use the SDK's request method for user role with custom headers
        return await client.request.send(
          `user-roles/${userId}`,
          "GET",
          undefined,
          undefined,
          client,
          undefined,
          "v2"
        );
      }, "Failed to fetch user role");
    },
    [apiCall]
  );

  // Reset API error when client changes
  useEffect(() => {
    if (isReady) {
      setApiError(null);
    }
  }, [isReady]);

  return {
    // Client state
    client,
    isReady,
    clientLoading,
    clientError,

    // API state
    apiLoading,
    apiError,

    // Generic API caller
    apiCall,

    // Specific API methods
    fetchOrganizations,
    fetchStores,
    fetchOrganization,
    fetchStore,
    fetchProducts,
    fetchProduct,
    fetchOrders,
    fetchOrder,
    fetchShippingGroups,
    fetchCatalogs,
    fetchUserProfile,
    fetchUserRole,
    fetchOrgStores,

    // Utility methods
    clearApiError: () => setApiError(null),
    isLoading: clientLoading || apiLoading,
    hasError: !!(clientError || apiError),
    error: clientError || apiError,
  };
};

/**
 * Type definitions
 */
export type EpccApiHook = ReturnType<typeof useEpccApi>;
