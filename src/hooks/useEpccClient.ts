"use client";

import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { ElasticPath } from "@elasticpath/js-sdk";
import { createClient } from "../lib/epcc-client";

/**
 * Custom hook that provides an authenticated EPCC client
 * @returns ElasticPath client instance or null if not authenticated
 */
export const useEpccClient = (
  orgId?: string,
  storeId?: string
): ElasticPath | null => {
  const { isAuthenticated, accessToken } = useAuth();

  const client = useMemo(() => {
    if (!isAuthenticated || !accessToken) {
      return null;
    }
    const client = createClient(accessToken, orgId, storeId);
    return client;
  }, [isAuthenticated, accessToken, orgId, storeId]);

  return client;
};

/**
 * Custom hook that provides an authenticated EPCC client with loading state
 * @returns Object containing client, loading state, and error state
 */
export const useEpccClientWithState = (orgId?: string, storeId?: string) => {
  const { isAuthenticated, loading: authLoading, accessToken } = useAuth();

  const result = useMemo(() => {
    if (authLoading) {
      return {
        client: null,
        loading: true,
        error: null,
        isReady: false,
      };
    }

    if (!isAuthenticated) {
      return {
        client: null,
        loading: false,
        error: "User not authenticated",
        isReady: false,
      };
    }

    if (!accessToken) {
      return {
        client: null,
        loading: false,
        error: "Access token not found",
        isReady: false,
      };
    }

    try {
      const client = createClient(accessToken, orgId, storeId);
      return {
        client,
        loading: false,
        error: null,
        isReady: true,
      };
    } catch (error) {
      return {
        client: null,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to create client",
        isReady: false,
      };
    }
  }, [isAuthenticated, authLoading, accessToken, orgId, storeId]);

  return result;
};

/**
 * Type definitions for the hook return values
 */
export type EpccClientState = {
  client: ElasticPath | null;
  loading: boolean;
  error: string | null;
  isReady: boolean;
};
