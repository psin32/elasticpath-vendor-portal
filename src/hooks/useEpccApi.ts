"use client";

import { useCallback, useEffect, useState } from "react";
import { useEpccClientWithState } from "./useEpccClient";
import { useAuth } from "../contexts/AuthContext";
import type {
  ElasticPath,
  FileBase,
  PcmProductAttachmentBody,
  PriceBookFilter,
} from "@elasticpath/js-sdk";

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
      } catch (error: any) {
        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((err: any) => {
            if (err?.title?.detail) {
              return err.title.detail;
            }
            return "Unknown error";
          });

          setApiError(errorMessages);
          return null;
        } else {
          const message = error instanceof Error ? error.message : errorMessage;
          setApiError(message);
          console.error("EPCC API Error:", error);
          return null;
        }
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
   * Fetch product template by product ID
   */
  const fetchProductTemplates = useCallback(
    async (productId: string) => {
      return apiCall(async (client) => {
        return await client.PCM.TemplateRelationships.All(productId);
      }, "Failed to fetch product template");
    },
    [apiCall]
  );

  /**
   * Fetch all templates
   */
  const fetchAllTemplates = useCallback(async () => {
    return apiCall(async (client) => {
      return await client.Flows.AllTemplates("products");
    }, "Failed to fetch all templates");
  }, [apiCall]);

  /**
   * Fetch template data
   */
  const fetchTemplateData = useCallback(
    async (slug: string, productId: string) => {
      return apiCall(async (client) => {
        return await client.Flows.GetEntry(slug, productId);
      }, "Failed to fetch template data");
    },
    [apiCall]
  );

  /**
   * Update template data
   */
  const updateTemplateData = useCallback(
    async (slug: string, productId: string, request: any) => {
      return apiCall(async (client) => {
        return await client.Flows.UpdateEntry(slug, productId, request);
      }, "Failed to update template data");
    },
    [apiCall]
  );

  /**
   * create template data
   */
  const createTemplateData = useCallback(
    async (slug: string, request: any) => {
      return apiCall(async (client) => {
        return await client.Flows.CreateEntry(slug, request);
      }, "Failed to create template data");
    },
    [apiCall]
  );

  /**
   * create product template relationship
   */
  const createProductTemplateRelationship = useCallback(
    async (productId: string, resources: any) => {
      return apiCall(async (client) => {
        return await client.PCM.TemplateRelationships.Create(
          productId,
          resources
        );
      }, "Failed to create product template relationship");
    },
    [apiCall]
  );

  /**
   * Fetch template fields
   */
  const fetchTemplateFields = useCallback(
    async (slug: string) => {
      return apiCall(async (client) => {
        return await client.Flows.GetFields(slug);
      }, "Failed to fetch template fields");
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
   * Create fulfillment for specific items
   */
  const createFulfillment = useCallback(
    async (
      orderId: string,
      fulfillmentData: {
        items: Array<{
          id: string;
          quantity: number;
        }>;
        tracking_reference?: string;
        shipping_method?: string;
        notes?: string;
      }
    ) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `orders/${orderId}/fulfillments`,
          "POST",
          {
            data: {
              type: "fulfillment",
              ...fulfillmentData,
            },
          },
          undefined,
          client,
          undefined,
          "v2"
        );
      }, "Failed to create fulfillment");
    },
    [apiCall]
  );

  /**
   * Fetch fulfillments for an order
   */
  const fetchFulfillments = useCallback(
    async (orderId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `orders/${orderId}/fulfillments`,
          "GET",
          undefined,
          undefined,
          client,
          undefined,
          "v2"
        );
      }, "Failed to fetch fulfillments");
    },
    [apiCall]
  );

  /**
   * Update fulfillment
   */
  const updateFulfillment = useCallback(
    async (
      orderId: string,
      fulfillmentId: string,
      fulfillmentData: {
        tracking_reference?: string;
        shipping_method?: string;
        notes?: string;
      }
    ) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `orders/${orderId}/fulfillments/${fulfillmentId}`,
          "PUT",
          {
            data: {
              type: "fulfillment",
              id: fulfillmentId,
              ...fulfillmentData,
            },
          },
          undefined,
          client,
          undefined,
          "v2"
        );
      }, "Failed to update fulfillment");
    },
    [apiCall]
  );

  /**
   * Generate packing slip for fulfillment
   */
  const generatePackingSlip = useCallback(
    async (orderId: string, fulfillmentId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `orders/${orderId}/fulfillments/${fulfillmentId}/packing-slip`,
          "GET",
          undefined,
          undefined,
          client,
          undefined,
          "v2"
        );
      }, "Failed to generate packing slip");
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

  /**
   * Update product
   */
  const updateProduct = useCallback(
    async (productId: string, updateData: any) => {
      return apiCall(async (client) => {
        return await client.PCM.Update(productId, updateData);
      }, "Failed to update product");
    },
    [apiCall]
  );

  /**
   * Create product
   */
  const createProduct = useCallback(
    async (createData: any) => {
      return apiCall(async (client) => {
        return await client.PCM.Create(createData);
      }, "Failed to create product");
    },
    [apiCall]
  );

  /**
   * Create files
   */
  const createImageFile = useCallback(
    async (url: string) => {
      return apiCall(async (client) => {
        return await client.Files.Link(url);
      }, "Failed to create files");
    },
    [apiCall]
  );

  /**
   * Create product image relationship
   */
  const createProductImageRelationship = useCallback(
    async (productId: string, fileId: string) => {
      return apiCall(async (client) => {
        return await client.PCM.MainImageRelationships.Create(
          productId,
          fileId
        );
      }, "Failed to create product image relationship");
    },
    [apiCall]
  );

  /**
   * Delete product image relationship
   */
  const deleteProductImageRelationship = useCallback(
    async (productId: string, fileId: string) => {
      return apiCall(async (client) => {
        return await client.PCM.MainImageRelationships.Delete(
          productId,
          fileId
        );
      }, "Failed to delete product image relationship");
    },
    [apiCall]
  );

  /**
   * Fetch inventory by SKU
   */
  const fetchInventoryBySku = useCallback(
    async (sku: string) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `extensions/inventories?filter=eq(ep_sku,${sku})`,
          "GET",
          undefined,
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to fetch inventory");
    },
    [apiCall]
  );

  /**
   * Create inventory record
   */
  const createInventory = useCallback(
    async (inventoryData: any) => {
      return apiCall(async (client) => {
        return await client.request.send(
          "extensions/inventories",
          "POST",
          inventoryData,
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to create inventory");
    },
    [apiCall]
  );

  /**
   * Update inventory record
   */
  const updateInventory = useCallback(
    async (inventoryId: string, updateData: any) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `extensions/inventories/${inventoryId}`,
          "PUT",
          updateData,
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to update inventory");
    },
    [apiCall]
  );

  /**
   * Delete inventory record
   */
  const deleteInventory = useCallback(
    async (inventoryId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `extensions/inventories/${inventoryId}`,
          "DELETE",
          undefined,
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to delete inventory");
    },
    [apiCall]
  );

  /**
   * Fetch prices by SKU
   */
  const fetchPricesBySKU = useCallback(
    async (sku: string) => {
      return apiCall(async (client) => {
        const pricebookId = "";
        const response = await client.PriceBooks.Prices.Filter({
          eq: {
            sku: sku,
          },
        }).All({ pricebookId });
        return response;
      }, "Failed to fetch prices");
    },
    [apiCall]
  );

  /**
   * Update price
   */
  const updatePrice = useCallback(
    async (priceId: string, pricebookId: string, body: any) => {
      return apiCall(async (client) => {
        return await client.PriceBooks.Prices.Update({
          pricebookId,
          priceId,
          body,
        });
      }, "Failed to update price");
    },
    [apiCall]
  );

  /**
   * Create price
   */
  const createPrice = useCallback(
    async (pricebookId: string, body: any) => {
      return apiCall(async (client) => {
        return await client.PriceBooks.Prices.Create({
          pricebookId,
          body,
        });
      }, "Failed to create price");
    },
    [apiCall]
  );

  /**
   * Fetch all pricebooks
   */
  const fetchAllPricebooks = useCallback(async () => {
    return apiCall(async (client) => {
      return await client.PriceBooks.Limit(100).Offset(0).All();
    }, "Failed to fetch pricebooks");
  }, [apiCall]);

  /**
   * Fetch all hierarchies
   */
  const fetchAllHierarchies = useCallback(async () => {
    return apiCall(async (client) => {
      return await client.Hierarchies.Limit(100).Offset(0).All();
    }, "Failed to fetch hierarchies");
  }, [apiCall]);

  /**
   * Fetch all nodes for a hierarchy
   */
  const fetchHierarchyNodes = useCallback(
    async (hierarchyId: string) => {
      return apiCall(async (client) => {
        return await client.Hierarchies.Nodes.Limit(100).Offset(0).All({
          hierarchyId,
        });
      }, "Failed to fetch hierarchies nodes");
    },
    [apiCall]
  );

  /**
   * Fetch product nodes
   */
  const fetchProductNodes = useCallback(
    async (productId: string) => {
      return apiCall(async (client) => {
        return await client.PCM.Limit(100).Offset(0).GetProductNodes(productId);
      }, "Failed to fetch product nodes");
    },
    [apiCall]
  );

  /**
   * Attach a product to a hierarchy node
   */
  const attachProductToNode = useCallback(
    async (productId: string, hierarchyId: string, nodeId: string) => {
      return apiCall(async (client) => {
        return await client.PCM.AttachNodes({
          filter: `eq(id,${productId})`,
          node_ids: [nodeId],
        });
      }, "Failed to attach product to node");
    },
    [apiCall]
  );

  /**
   * Detach a product from a hierarchy node
   */
  const detachProductFromNode = useCallback(
    async (productId: string, hierarchyId: string, nodeId: string) => {
      return apiCall(async (client) => {
        return await client.PCM.DetachNodes({
          filter: `eq(id,${productId})`,
          node_ids: [nodeId],
        });
      }, "Failed to detach product from node");
    },
    [apiCall]
  );

  /**
   * Fetch all currencies
   */
  const fetchCurrencies = useCallback(async () => {
    return apiCall(async (client) => {
      return await client.Currencies.All();
    }, "Failed to fetch currencies");
  }, [apiCall]);

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
    updateProduct,
    fetchInventoryBySku,
    createInventory,
    updateInventory,
    deleteInventory,
    fetchProductTemplates,
    fetchAllTemplates,
    fetchTemplateData,
    fetchTemplateFields,
    updateTemplateData,
    createProductTemplateRelationship,
    createTemplateData,
    createProduct,
    createImageFile,
    createProductImageRelationship,
    deleteProductImageRelationship,
    fetchPricesBySKU,
    fetchAllPricebooks,
    fetchCurrencies,
    updatePrice,
    createPrice,
    fetchAllHierarchies,
    fetchHierarchyNodes,
    fetchProductNodes,
    attachProductToNode,
    detachProductFromNode,

    // Fulfillment methods
    createFulfillment,
    fetchFulfillments,
    updateFulfillment,
    generatePackingSlip,

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
