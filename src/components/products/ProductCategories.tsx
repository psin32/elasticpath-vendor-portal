"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useEpccApi } from "../../hooks/useEpccApi";
import { useToast } from "../../contexts/ToastContext";

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
  const {
    fetchProductNodes,
    fetchAllHierarchies,
    fetchHierarchyNodes,
    attachProductToNode,
  } = useEpccApi(selectedOrgId, selectedStoreId);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hierarchies, setHierarchies] = useState<any[]>([]);
  const [nodeIdToInfo, setNodeIdToInfo] = useState<
    Record<string, { name: string; hierarchyId: string }>
  >({});
  const [productNodeIds, setProductNodeIds] = useState<string[]>([]);
  // Store full nodes per hierarchy to compute nested paths
  const [nodesByHierarchy, setNodesByHierarchy] = useState<
    Record<string, Record<string, { name: string; parentId?: string }>>
  >({});
  // Per-row edit state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<
    Record<string, string>
  >({});
  const [addingRow, setAddingRow] = useState(false);
  const [newHierarchyId, setNewHierarchyId] = useState<string>("");
  const [newNodeId, setNewNodeId] = useState<string>("");

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
        const perHierarchy: Record<
          string,
          Record<string, { name: string; parentId?: string }>
        > = {};

        nodesResults.forEach((res, idx) => {
          const h = allHierarchies[idx];
          const nodes = Array.isArray(res?.data) ? res!.data : [];
          const local: Record<string, { name: string; parentId?: string }> = {};
          nodes.forEach((node: any) => {
            const nodeId = node.id;
            const nodeName = node.attributes?.name || node.name || nodeId;
            const parentId =
              node.relationships?.parent?.data?.id ||
              node.parent_id ||
              undefined;
            map[nodeId] = { name: nodeName, hierarchyId: h.id };
            local[nodeId] = { name: nodeName, parentId };
          });
          perHierarchy[h.id] = local;
        });
        setNodeIdToInfo(map);
        setNodesByHierarchy(perHierarchy);
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

  // Build flattened options with nested path labels per hierarchy
  const optionsByHierarchy = useMemo(() => {
    const result: Record<string, Array<{ id: string; label: string }>> = {};
    const computePath = (
      hId: string,
      nId: string,
      seen: Set<string>
    ): string => {
      if (seen.has(nId)) return nodesByHierarchy[hId]?.[nId]?.name || nId;
      seen.add(nId);
      const entry = nodesByHierarchy[hId]?.[nId];
      const name = entry?.name || nId;
      const parentId = entry?.parentId;
      if (!parentId || !nodesByHierarchy[hId]?.[parentId]) return name;
      return `${computePath(hId, parentId, seen)} / ${name}`;
    };

    Object.keys(nodesByHierarchy).forEach((hId) => {
      const list: Array<{ id: string; label: string }> = Object.keys(
        nodesByHierarchy[hId] || {}
      ).map((nId) => ({ id: nId, label: computePath(hId, nId, new Set()) }));
      list.sort((a, b) => a.label.localeCompare(b.label));
      result[hId] = list;
    });
    return result;
  }, [nodesByHierarchy]);

  const handleEdit = (nodeId: string) => {
    setEditingNodeId(nodeId);
    const info = nodeIdToInfo[nodeId];
    if (info) {
      setPendingSelection((prev) => ({ ...prev, [info.hierarchyId]: nodeId }));
    }
  };

  const handleCancel = () => {
    setEditingNodeId(null);
  };

  const handleSave = async (nodeId: string) => {
    const current = nodeIdToInfo[nodeId];
    if (!current) return;
    const chosen = pendingSelection[current.hierarchyId];
    if (!chosen || chosen === nodeId) {
      setEditingNodeId(null);
      return;
    }
    // Placeholder: update local state; integrate attach/detach API when available
    setProductNodeIds((prev) =>
      prev.map((id) => (id === nodeId ? chosen : id))
    );
    showToast("Category updated", "success");
    setEditingNodeId(null);
  };

  const startAddRow = () => {
    setAddingRow(true);
    setNewHierarchyId("");
    setNewNodeId("");
  };

  const cancelAddRow = () => {
    setAddingRow(false);
    setNewHierarchyId("");
    setNewNodeId("");
  };

  const saveAddRow = async () => {
    if (!newHierarchyId || !newNodeId) return;
    try {
      await attachProductToNode(productId, newHierarchyId, newNodeId);
      setProductNodeIds((prev) => [...prev, newNodeId]);
      const name =
        nodesByHierarchy[newHierarchyId]?.[newNodeId]?.name || newNodeId;
      setNodeIdToInfo((prev) => ({
        ...prev,
        [newNodeId]: { name, hierarchyId: newHierarchyId },
      }));
      showToast("Category added", "success");
      cancelAddRow();
    } catch (e) {
      showToast("Failed to add category", "error");
    }
  };

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
        </div>
        <div>
          {!addingRow && (
            <button
              onClick={startAddRow}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Category
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        addingRow ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Hierarchy
                </label>
                <select
                  value={newHierarchyId}
                  onChange={(e) => {
                    setNewHierarchyId(e.target.value);
                    setNewNodeId("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select hierarchy</option>
                  {hierarchies.map((h: any) => (
                    <option key={h.id} value={h.id}>
                      {h.attributes?.name || h.name || h.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Node
                </label>
                <select
                  value={newNodeId}
                  onChange={(e) => setNewNodeId(e.target.value)}
                  disabled={!newHierarchyId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select node</option>
                  {(optionsByHierarchy[newHierarchyId] || []).map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={saveAddRow}
                disabled={!newHierarchyId || !newNodeId}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={cancelAddRow}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
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
        )
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((r) => {
                  const isEditing = editingNodeId === r.nodeId;
                  const currentSelection =
                    pendingSelection[r.hierarchyId] ?? r.nodeId;
                  const options = optionsByHierarchy[r.hierarchyId] || [];
                  return (
                    <tr key={r.nodeId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {r.hierarchyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isEditing ? (
                          <select
                            value={currentSelection}
                            onChange={(e) =>
                              setPendingSelection((prev) => ({
                                ...prev,
                                [r.hierarchyId]: e.target.value,
                              }))
                            }
                            className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {options.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          r.nodeName
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSave(r.nodeId)}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(r.nodeId)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {addingRow && (
                  <tr className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select
                        value={newHierarchyId}
                        onChange={(e) => {
                          setNewHierarchyId(e.target.value);
                          setNewNodeId("");
                        }}
                        className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select hierarchy</option>
                        {hierarchies.map((h: any) => (
                          <option key={h.id} value={h.id}>
                            {h.attributes?.name || h.name || h.id}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select
                        value={newNodeId}
                        onChange={(e) => setNewNodeId(e.target.value)}
                        disabled={!newHierarchyId}
                        className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select node</option>
                        {(optionsByHierarchy[newHierarchyId] || []).map(
                          (opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={saveAddRow}
                          disabled={!newHierarchyId || !newNodeId}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          onClick={cancelAddRow}
                          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
