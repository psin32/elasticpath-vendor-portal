"use client";

import { useCallback, useEffect, useState } from "react";
import { useEpccClientWithState } from "./useEpccClient";
import { useAuth } from "../contexts/AuthContext";
import type {
  CustomApiBase,
  ElasticPath,
  FileBase,
  PcmProductAttachmentBody,
  PriceBookFilter,
} from "@elasticpath/js-sdk";
import { v4 as uuidv4 } from "uuid";

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
   * Create fulfillment for specific items using custom API
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
        // First fetch the order to get the actual item quantities
        const orderResponse = await client.Orders.With(["items"]).Get(orderId);
        const orderItems = orderResponse.included?.items || [];
        const fulfillmentGroupId = uuidv4();

        // Create fulfillment records for each item in the custom API
        const fulfillmentPromises = fulfillmentData.items.map(async (item) => {
          // Find the original order item to get the total quantity
          const originalItem = orderItems.find(
            (orderItem: any) => orderItem.id === item.id
          );
          const totalQuantity = originalItem?.quantity || item.quantity;

          // Calculate remaining quantity (this is a simplified calculation)
          const remainingQuantity = Math.max(0, totalQuantity - item.quantity);

          const customApiData = {
            type: "order_fulfillment_ext",
            order_id: orderId,
            order_item_id: item.id,
            total_quantity: totalQuantity,
            fulfilled_quantity: item.quantity,
            remaining_quantity: remainingQuantity,
            tracking_reference: fulfillmentData.tracking_reference || null,
            shipping_carrier: fulfillmentData.shipping_method || null,
            notes: fulfillmentData.notes || null,
            fulfillment_group_id: fulfillmentGroupId,
          };

          return await client.request.send(
            `extensions/order_fulfillments`,
            "POST",
            {
              data: customApiData,
            },
            undefined,
            client,
            false,
            "v2"
          );
        });

        const results = await Promise.all(fulfillmentPromises);
        return { data: results };
      }, "Failed to create fulfillment");
    },
    [apiCall]
  );

  /**
   * Fetch fulfillments for an order from custom API
   */
  const fetchFulfillments = useCallback(
    async (orderId: string) => {
      return apiCall(async (client) => {
        // Fetch fulfillment records from custom API filtered by order_id
        const response = await client.request.send(
          `extensions/order_fulfillments?filter=eq(order_id,${orderId})`,
          "GET",
          undefined,
          undefined,
          client,
          false,
          "v2"
        );

        // Transform the data to group by tracking reference and aggregate items
        const fulfillmentMap = new Map();

        response.data.forEach((entry: any) => {
          const fulfillmentGroupId = entry.fulfillment_group_id;

          if (!fulfillmentMap.has(fulfillmentGroupId)) {
            fulfillmentMap.set(fulfillmentGroupId, {
              id: fulfillmentGroupId,
              items: [],
              tracking_reference: entry.tracking_reference,
              shipping_method: entry.shipping_carrier,
              notes: entry.notes,
              status: entry.fulfilled_quantity > 0 ? "fulfilled" : "pending",
              created_at:
                entry.meta?.timestamps?.created_at || new Date().toISOString(),
            });
          }

          const fulfillment = fulfillmentMap.get(fulfillmentGroupId);
          fulfillment.items.push({
            id: entry.order_item_id,
            quantity: entry.fulfilled_quantity,
          });
        });

        return {
          data: Array.from(fulfillmentMap.values()),
        };
      }, "Failed to fetch fulfillments");
    },
    [apiCall]
  );

  /**
   * Update fulfillment in custom API
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
        // First, get all fulfillment entries for this order with the same tracking reference
        const response = await client.request.send(
          `custom-apis/order_fulfillments/entries?filter[eq][order_id]=${orderId}`,
          "GET",
          undefined,
          undefined,
          client,
          undefined,
          "v2"
        );

        // Find entries that match the fulfillment group ID
        const entriesToUpdate = response.data.filter((entry: any) => {
          return entry.fulfillment_group_id === fulfillmentId;
        });

        // Update each entry
        const updatePromises = entriesToUpdate.map((entry: any) => {
          const updateData = {
            type: "custom_api_entry",
            id: entry.id,
            ...entry, // Keep existing data
            tracking_reference:
              fulfillmentData.tracking_reference !== undefined
                ? fulfillmentData.tracking_reference
                : entry.tracking_reference,
            shipping_carrier:
              fulfillmentData.shipping_method !== undefined
                ? fulfillmentData.shipping_method
                : entry.shipping_carrier,
            notes:
              fulfillmentData.notes !== undefined
                ? fulfillmentData.notes
                : entry.notes,
          };

          return client.request.send(
            `custom-apis/order_fulfillments/entries/${entry.id}`,
            "PUT",
            {
              data: updateData,
            },
            undefined,
            client,
            undefined,
            "v2"
          );
        });

        const results = await Promise.all(updatePromises);
        return { data: results };
      }, "Failed to update fulfillment");
    },
    [apiCall]
  );

  /**
   * Check if custom API exists
   */
  const checkCustomAPIBySlug = useCallback(
    async (
      slug: string
    ): Promise<{
      exists: boolean;
      data?: any;
      error?: any;
    }> => {
      try {
        const result = await apiCall(async (client) => {
          try {
            const response = await client.CustomApis.Filter({
              eq: {
                slug: slug,
              },
            }).All();
            if (response.data.length > 0) {
              return { exists: true, data: response.data[0] };
            }
            return { exists: false, error: null };
          } catch (error: any) {
            // If we get a 404, the flow doesn't exist
            if (error.status === 404 || error.response?.status === 404) {
              return { exists: false, error: null };
            }
            // For other errors, rethrow
            throw error;
          }
        }, "Failed to check order fulfillment API");

        return result || { exists: false, error: "Unknown error" };
      } catch (error) {
        return { exists: false, error };
      }
    },
    [apiCall]
  );

  /**
   * Create order_fulfillment custom API with fields
   */
  const createOrderFulfillmentAPI = useCallback(async () => {
    return apiCall(async (client) => {
      const request: CustomApiBase = {
        name: "Order Fulfillments",
        description: "Custom API for order fulfillment management",
        slug: "order_fulfillments",
        api_type: "order_fulfillment_ext",
        type: "custom_api",
        allow_upserts: false,
      };
      const flowResponse = await client.CustomApis.Create(request);
      const flowId = flowResponse.data.id;

      // Create custom fields for the flow
      const fields = [
        {
          type: "custom_field",
          name: "Order ID",
          slug: "order_id",
          field_type: "string",
          description: "Order ID",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: false,
              immutable: true,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 1000,
          },
        },
        {
          type: "custom_field",
          name: "Order Item ID",
          slug: "order_item_id",
          field_type: "string",
          description: "Order Item ID",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: false,
              immutable: true,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 950,
          },
        },
        {
          type: "custom_field",
          name: "Total Quantity",
          slug: "total_quantity",
          field_type: "integer",
          description: "Total Quantity",
          use_as_url_slug: false,
          validation: {
            integer: {
              allow_null_values: true,
              immutable: false,
              min_value: null,
              max_value: null,
            },
          },
          presentation: {
            sort_order: 900,
          },
        },
        {
          type: "custom_field",
          name: "Fulfilled Quantity",
          slug: "fulfilled_quantity",
          field_type: "integer",
          description: "Fulfilled Quantity",
          use_as_url_slug: false,
          validation: {
            integer: {
              allow_null_values: true,
              immutable: false,
              min_value: null,
              max_value: null,
            },
          },
          presentation: {
            sort_order: 850,
          },
        },
        {
          type: "custom_field",
          name: "Remaining Quantity",
          slug: "remaining_quantity",
          field_type: "integer",
          description: "Remaining Quantity",
          use_as_url_slug: false,
          validation: {
            integer: {
              allow_null_values: true,
              immutable: false,
              min_value: null,
              max_value: null,
            },
          },
          presentation: {
            sort_order: 800,
          },
        },
        {
          type: "custom_field",
          name: "Tracking Reference",
          slug: "tracking_reference",
          field_type: "string",
          description: "Tracking Reference",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: true,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 750,
          },
        },
        {
          type: "custom_field",
          name: "Shipping Carrier",
          slug: "shipping_carrier",
          field_type: "string",
          description: "Shipping Carrier",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: true,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 700,
          },
        },
        {
          type: "custom_field",
          name: "Notes",
          slug: "notes",
          field_type: "string",
          description: "Notes",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: true,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 650,
          },
        },
        {
          type: "custom_field",
          name: "Fulfillment Group ID",
          slug: "fulfillment_group_id",
          field_type: "string",
          description: "Fulfillment Group ID",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: false,
              immutable: true,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 600,
          },
        },
      ];

      // Create each field
      const fieldPromises = fields.map((field) =>
        client.CustomApis.CreateField(flowId, field)
      );

      const fieldResponses = await Promise.all(fieldPromises);

      return {
        flow: flowResponse,
        fields: fieldResponses,
      };
    }, "Failed to create order fulfillment API");
  }, [apiCall]);

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
   * Fulfil order
   */
  const fulfilOrder = useCallback(
    async (orderId: string) => {
      return apiCall(async (client) => {
        return await client.Orders.Update(orderId, {
          shipping: "fulfilled",
        });
      }, "Failed to fulfil order");
    },
    [apiCall]
  );

  /**
   * Cancel order
   */
  const cancelOrder = useCallback(
    async (orderId: string) => {
      return apiCall(async (client) => {
        return await client.Orders.Update(orderId, {
          status: "cancelled",
        });
      }, "Failed to cancel order");
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

  /**
   * Fetch all catalogs
   */
  const getAllCatalogs = useCallback(async () => {
    return apiCall(async (client) => {
      return await client.Catalogs.All();
    }, "Failed to fetch catalogs");
  }, [apiCall]);

  /**
   * Publish catalog
   */
  const publishCatalog = useCallback(
    async (catalogId: string) => {
      return apiCall(async (client) => {
        return await client.Catalogs.Releases.Create({ catalogId });
      }, "Failed to publish catalog");
    },
    [apiCall]
  );

  /**
   * Get catalog releases
   */
  const getCatalogReleases = useCallback(
    async (catalogId: string) => {
      return apiCall(async (client) => {
        return await client.Catalogs.GetCatalogReleases(catalogId);
      }, "Failed to get catalog releases");
    },
    [apiCall]
  );

  /**
   * Fetch all custom APIs
   */
  const fetchAllCustomApis = useCallback(async () => {
    return apiCall(async (client) => {
      return await client.CustomApis.All();
    }, "Failed to fetch all custom APIs");
  }, [apiCall]);

  /**
   * Fetch all custom fields
   */
  const fetchAllCustomFields = useCallback(
    async (customApiId: string) => {
      return apiCall(async (client) => {
        return await client.CustomApis.GetFields(customApiId);
      }, "Failed to fetch all custom fields");
    },
    [apiCall]
  );

  /**
   * Create mapping fields
   */
  const createMappingFieldsAPI = useCallback(async () => {
    return apiCall(async (client) => {
      const request: CustomApiBase = {
        name: "Mappings Fields",
        description: "Custom API for mapping fields management",
        slug: "mappings_fields",
        api_type: "mapping_fields_ext",
        type: "custom_api",
        allow_upserts: false,
      };
      const flowResponse = await client.CustomApis.Create(request);
      const flowId = flowResponse.data.id;

      // Create custom fields for the flow
      const fields = [
        {
          type: "custom_field",
          name: "Mapping ID",
          slug: "mapping_id",
          field_type: "string",
          description: "Mapping ID",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: false,
              immutable: true,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 1000,
          },
        },
        {
          type: "custom_field",
          name: "Name",
          slug: "name",
          field_type: "string",
          description: "Name",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: false,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 950,
          },
        },
        {
          type: "custom_field",
          name: "Label",
          slug: "label",
          field_type: "string",
          description: "Label",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: false,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 900,
          },
        },
        {
          type: "custom_field",
          name: "Description",
          slug: "description",
          field_type: "string",
          description: "Description",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: true,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 850,
          },
        },
        {
          type: "custom_field",
          name: "Field Type",
          slug: "field_type",
          field_type: "string",
          description: "Field Type",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: false,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 800,
          },
        },
        {
          type: "custom_field",
          name: "Required",
          slug: "required",
          field_type: "boolean",
          description: "Required",
          use_as_url_slug: false,
          validation: {
            boolean: {
              allow_null_values: true,
              immutable: false,
            },
          },
          presentation: {
            sort_order: 750,
          },
        },
        {
          type: "custom_field",
          name: "Validation Rule",
          slug: "validation_rule",
          field_type: "string",
          description: "Validation Rule",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: true,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 700,
          },
        },
        {
          type: "custom_field",
          name: "Sequence",
          slug: "sequence",
          field_type: "integer",
          description: "Sequence",
          use_as_url_slug: false,
          validation: {
            integer: {
              allow_null_values: true,
              immutable: false,
              min_value: 0,
              max_value: 1000,
            },
          },
          presentation: {
            sort_order: 650,
          },
        },
      ];

      // Create each field
      const fieldPromises = fields.map((field) =>
        client.CustomApis.CreateField(flowId, field)
      );

      const fieldResponses = await Promise.all(fieldPromises);

      return {
        flow: flowResponse,
        fields: fieldResponses,
      };
    }, "Failed to create mapping fields API");
  }, [apiCall]);

  /**
   * Create mapping custom API with fields
   */
  const createMappingAPI = useCallback(async () => {
    return apiCall(async (client) => {
      const request: CustomApiBase = {
        name: "Mappings",
        description: "Custom API for mapping management",
        slug: "mappings",
        api_type: "mapping_ext",
        type: "custom_api",
        allow_upserts: false,
      };
      const flowResponse = await client.CustomApis.Create(request);
      const flowId = flowResponse.data.id;

      // Create custom fields for the flow
      const fields = [
        {
          type: "custom_field",
          name: "Name",
          slug: "name",
          field_type: "string",
          description: "Name",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: false,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 1000,
          },
        },
        {
          type: "custom_field",
          name: "Description",
          slug: "description",
          field_type: "string",
          description: "Description",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: false,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 950,
          },
        },
        {
          type: "custom_field",
          name: "Entity Type",
          slug: "entity_type",
          field_type: "string",
          description: "Entity Type",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: true,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 900,
          },
        },
        {
          type: "custom_field",
          name: "External Reference",
          slug: "external_reference",
          field_type: "string",
          description: "External Reference",
          use_as_url_slug: false,
          validation: {
            string: {
              allow_null_values: true,
              immutable: false,
              min_length: null,
              max_length: null,
              regex: null,
              unique: "no",
              unique_case_insensitivity: false,
            },
          },
          presentation: {
            sort_order: 850,
          },
        },
      ];

      // Create each field
      const fieldPromises = fields.map((field) =>
        client.CustomApis.CreateField(flowId, field)
      );

      const fieldResponses = await Promise.all(fieldPromises);

      return {
        flow: flowResponse,
        fields: fieldResponses,
      };
    }, "Failed to create mapping API");
  }, [apiCall]);

  /**
   * Create a mapping in the mappings custom API
   */
  const createMapping = useCallback(
    async (mappingData: {
      name: string;
      description?: string;
      entityType: string;
      externalReference?: string;
    }) => {
      return apiCall(async (client) => {
        // Create the mapping record
        const mappingRecord = {
          type: "mapping_ext",
          name: mappingData.name,
          description: mappingData.description || "",
          entity_type: mappingData.entityType,
          external_reference: mappingData.externalReference || "",
        };

        return await client.request.send(
          `extensions/mappings`,
          "POST",
          {
            data: mappingRecord,
          },
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to create mapping");
    },
    [apiCall]
  );

  /**
   * Create a mapping in the mappings custom API
   */
  const updateMapping = useCallback(
    async (
      mappingId: string,
      mappingData: {
        name: string;
        description?: string;
        entityType: string;
        externalReference?: string;
      }
    ) => {
      return apiCall(async (client) => {
        // Create the mapping record
        const mappingRecord = {
          type: "mapping_ext",
          id: mappingId,
          name: mappingData.name,
          description: mappingData.description || "",
          entity_type: mappingData.entityType,
          external_reference: mappingData.externalReference || "",
        };

        return await client.request.send(
          `extensions/mappings/${mappingId}`,
          "PUT",
          {
            data: mappingRecord,
          },
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to update mapping");
    },
    [apiCall]
  );

  /**
   * Create mapping fields in the mappings_fields custom API
   */
  const createMappingFields = useCallback(
    async (
      mappingId: string,
      fields: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
        description?: string;
        validationRules?: any;
        selectOptions?: Array<{ value: string; label: string }>;
      }>
    ) => {
      return apiCall(async (client) => {
        // Create field records
        const fieldPromises = fields.map(async (field, index) => {
          const fieldRecord = {
            type: "mapping_fields_ext",
            name: field.name,
            label: field.label,
            field_type: field.type,
            description: field.description || "",
            required: field.required,
            validation_rules: field.validationRules || [],
            select_options: field.selectOptions || [],
            sequence: index,
            mapping_id: mappingId,
          };

          return await client.request.send(
            `extensions/mappings_fields`,
            "POST",
            {
              data: fieldRecord,
            },
            undefined,
            client,
            false,
            "v2"
          );
        });

        const results = await Promise.all(fieldPromises);
        return results;
      }, "Failed to create mapping fields");
    },
    [apiCall]
  );

  /**
   * Update a single mapping field in the mappings_fields custom API
   */
  const updateMappingFields = useCallback(
    async (
      fieldId: string,
      mappingId: string,
      fieldData: {
        name: string;
        label: string;
        type: string;
        required: boolean;
        description?: string;
        validationRules?: any;
        selectOptions?: Array<{ value: string; label: string }>;
        order?: number;
      }
    ) => {
      return apiCall(async (client) => {
        const fieldRecord = {
          type: "mapping_fields_ext",
          id: fieldId,
          name: fieldData.name,
          label: fieldData.label,
          field_type: fieldData.type,
          description: fieldData.description || "",
          required: fieldData.required,
          validation_rules: fieldData.validationRules || [],
          select_options: fieldData.selectOptions || [],
          sequence: fieldData.order || 0,
          mapping_id: mappingId,
        };

        return await client.request.send(
          `extensions/mappings_fields/${fieldId}`,
          "PUT",
          {
            data: fieldRecord,
          },
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to update mapping field");
    },
    [apiCall]
  );

  /**
   * Fetch all mappings
   */
  const fetchAllMappings = useCallback(async () => {
    return apiCall(async (client) => {
      return await client.request.send(
        `extensions/mappings`,
        "GET",
        undefined,
        undefined,
        client,
        false,
        "v2"
      );
    }, "Failed to fetch all mappings");
  }, [apiCall]);

  /**
   * Fetch mapping
   */
  const fetchMapping = useCallback(
    async (mappingId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `extensions/mappings/${mappingId}`,
          "GET",
          undefined,
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to fetch mapping");
    },
    [apiCall]
  );

  /**
   * Fetch mappings fields
   */
  const fetchMappingsFields = useCallback(
    async (mappingId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `extensions/mappings_fields?filter=eq(mapping_id,${mappingId})`,
          "GET",
          undefined,
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to fetch mappings fields");
    },
    [apiCall]
  );

  /**
   * Delete mapping
   */
  const deleteMapping = useCallback(
    async (mappingId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `extensions/mappings/${mappingId}`,
          "DELETE",
          undefined,
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to delete mapping");
    },
    [apiCall]
  );

  /**
   * Delete mapping field
   */
  const deleteMappingField = useCallback(
    async (fieldId: string) => {
      return apiCall(async (client) => {
        return await client.request.send(
          `extensions/mappings_fields/${fieldId}`,
          "DELETE",
          undefined,
          undefined,
          client,
          false,
          "v2"
        );
      }, "Failed to delete mapping field");
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
    getAllCatalogs,
    publishCatalog,
    getCatalogReleases,

    // Fulfillment methods
    createFulfillment,
    fetchFulfillments,
    updateFulfillment,
    checkCustomAPIBySlug,
    createOrderFulfillmentAPI,
    fulfilOrder,
    cancelOrder,
    fetchAllCustomApis,
    fetchAllCustomFields,
    createMappingFieldsAPI,
    createMappingAPI,
    createMapping,
    updateMapping,
    createMappingFields,
    updateMappingFields,
    fetchAllMappings,
    fetchMappingsFields,
    fetchMapping,
    deleteMapping,
    deleteMappingField,
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
