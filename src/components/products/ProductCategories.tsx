"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useEpccApi } from "../../hooks/useEpccApi";

interface ProductCategoriesProps {
  productId: string;
  selectedOrgId?: string;
  selectedStoreId?: string;
}

type NodeSummary = {
  nodeId: string;
  nodeName: string;
  hierarchyId: string;
  hierarchyName: string;
};

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  productId,
  selectedOrgId,
  selectedStoreId,
}) => {
  const { fetchProductNodes, fetchAllHierarchies, fetchHierarchyNodes } =
    useEpccApi(selectedOrgId, selectedStoreId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hierarchies, setHierarchies] = useState<any[]>([]);
  const [nodeIdToInfo, setNodeIdToInfo] = useState<
    Record<string, { name: string; hierarchyId: string }>
  >({});
  const [productNodeIds, setProductNodeIds] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch product nodes (assigned nodes)
        const productNodesRes = await fetchProductNodes(productId);
        const assignedNodeIds: string[] = Array.isArray(productNodesRes?.data)
          ? productNodesRes!.data.map((n: any) => n.id)
          : [];
        setProductNodeIds(assignedNodeIds);

        // Fetch all hierarchies
        const hierarchiesRes = await fetchAllHierarchies();
        const allHierarchies = Array.isArray(hierarchiesRes?.data)
          ? hierarchiesRes!.data
          : [];
        setHierarchies(allHierarchies);

        // Build node maps by fetching nodes per hierarchy in parallel
        const nodeFetches = allHierarchies.map((h: any) =>
          fetchHierarchyNodes(h.id)
        );
        const nodesResults = await Promise.all(nodeFetches);

        const map: Record<string, { name: string; hierarchyId: string }> = {};
        nodesResults.forEach((res, idx) => {
          const h = allHierarchies[idx];
          const nodes = Array.isArray(res?.data) ? res!.data : [];
          nodes.forEach((node: any) => {
            const nodeId = node.id;
            const nodeName = node.attributes?.name || node.name || nodeId;
            map[nodeId] = { name: nodeName, hierarchyId: h.id };
          });
        });
        setNodeIdToInfo(map);
      } catch (e) {
        setError("Failed to load categories");
        // eslint-disable-next-line no-console
        console.error("Error loading product categories:", e);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId, fetchProductNodes, fetchAllHierarchies, fetchHierarchyNodes]);

  const rows: NodeSummary[] = useMemo(() => {
    if (!productNodeIds.length) return [];
    const hierarchyIdToName: Record<string, string> = {};
    hierarchies.forEach((h: any) => {
      const name = h.attributes?.name || h.name || h.id;
      hierarchyIdToName[h.id] = name;
    });
    return productNodeIds.map((nodeId) => {
      const info = nodeIdToInfo[nodeId];
      const hierarchyName = info
        ? hierarchyIdToName[info.hierarchyId] || info.hierarchyId
        : "-";
      const nodeName = info ? info.name : nodeId;
      return {
        nodeId,
        nodeName,
        hierarchyId: info?.hierarchyId || "",
        hierarchyName,
      };
    });
  }, [productNodeIds, nodeIdToInfo, hierarchies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading categories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-md">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Product Categories
          </h3>
          <p className="text-sm text-gray-500">
            Hierarchies and nodes linked to this product
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-yellow-800">
              No Categories Found
            </h3>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hierarchy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Node
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.nodeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {r.hierarchyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {r.nodeName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
