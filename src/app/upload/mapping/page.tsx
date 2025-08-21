"use client";

import React, { useState } from "react";
import { Mapping, MappingDataset } from "@/types/mapping";
import { useMappingManager } from "@/hooks/useMappingManager";
import { useToast } from "@/contexts/ToastContext";
import MappingBuilder from "@/components/mapping/MappingBuilder";
import MappingDataGrid from "@/components/mapping/MappingDataGrid";
import { sampleMappings } from "@/utils/sampleMappings";

type ViewMode = "mappings" | "builder" | "data-entry";

const MappingPage: React.FC = () => {
  const {
    mappings,
    datasets,
    createMapping,
    updateMapping,
    deleteMapping,
    createDataset,
    updateDataset,
    deleteDataset,
    validateRow,
    exportDatasetToCSV,
    exportDatasetToJSON,
  } = useMappingManager();

  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>("mappings");
  const [selectedMapping, setSelectedMapping] = useState<Mapping | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<MappingDataset | null>(
    null
  );
  const [editingMapping, setEditingMapping] = useState<Mapping | undefined>(
    undefined
  );

  const handleCreateMapping = () => {
    setEditingMapping(undefined);
    setViewMode("builder");
  };

  const handleLoadSampleMappings = () => {
    if (confirm("This will add sample mappings to your workspace. Continue?")) {
      sampleMappings.forEach((mappingData) => {
        createMapping(mappingData);
      });
      showToast(`Added ${sampleMappings.length} sample mappings`, "success");
    }
  };

  const handleEditMapping = (mapping: Mapping) => {
    setEditingMapping(mapping);
    setViewMode("builder");
  };

  const handleSaveMapping = (
    mappingData: Omit<Mapping, "id" | "createdAt" | "updatedAt">
  ) => {
    if (editingMapping) {
      updateMapping(editingMapping.id, mappingData);
      showToast("Mapping updated successfully", "success");
    } else {
      createMapping(mappingData);
      showToast("Mapping created successfully", "success");
    }
    setViewMode("mappings");
    setEditingMapping(undefined);
  };

  const handleDeleteMapping = (mapping: Mapping) => {
    if (
      confirm(
        `Are you sure you want to delete "${mapping.name}"? This will also delete all associated datasets.`
      )
    ) {
      deleteMapping(mapping.id);
      showToast("Mapping deleted successfully", "success");
    }
  };

  const handleCreateDataset = (mapping: Mapping) => {
    const dataset = createDataset({
      mappingId: mapping.id,
      name: `${mapping.name} Data - ${new Date().toLocaleDateString()}`,
      rows: [],
    });
    setSelectedMapping(mapping);
    setSelectedDataset(dataset);
    setViewMode("data-entry");
  };

  const handleOpenDataset = (dataset: MappingDataset) => {
    const mapping = mappings.find((m) => m.id === dataset.mappingId);
    if (mapping) {
      setSelectedMapping(mapping);
      setSelectedDataset(dataset);
      setViewMode("data-entry");
    }
  };

  const handleDeleteDataset = (dataset: MappingDataset) => {
    if (confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      deleteDataset(dataset.id);
      showToast("Dataset deleted successfully", "success");
    }
  };

  const handleDatasetDataChange = (data: any[]) => {
    if (selectedDataset) {
      updateDataset(selectedDataset.id, {
        rows: data,
      });
      // Update local state to reflect changes
      setSelectedDataset((prev) => (prev ? { ...prev, rows: data } : null));
    }
  };

  const renderMappingsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapping</h1>
          <p className="text-gray-600">
            Create and manage data templates with field mapping for bulk
            operations
          </p>
        </div>
        <div className="flex space-x-3">
          {mappings.length === 0 && (
            <button
              onClick={handleLoadSampleMappings}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Load Sample Mappings
            </button>
          )}
          <button
            onClick={handleCreateMapping}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Mapping
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mappings.map((mapping) => {
          const mappingDatasets = datasets.filter(
            (d) => d.mappingId === mapping.id
          );
          return (
            <div
              key={mapping.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {mapping.name}
                  </h3>
                  <p className="text-sm text-gray-500">{mapping.entityType}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditMapping(mapping)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit Mapping"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMapping(mapping)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete Mapping"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {mapping.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {mapping.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{mapping.fields.length}</span>{" "}
                  fields
                </div>

                <div className="flex flex-wrap gap-1">
                  {mapping.fields.slice(0, 3).map((field) => (
                    <span
                      key={field.id}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {field.label}
                    </span>
                  ))}
                  {mapping.fields.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{mapping.fields.length - 3} more
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleCreateDataset(mapping)}
                    className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Create Dataset
                  </button>

                  {mappingDatasets.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {mappingDatasets.length} existing dataset(s)
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {mappings.length === 0 && (
          <div className="col-span-full text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No mapping mappings yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first mapping mapping to get started with structured
              data entry and field mapping.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleLoadSampleMappings}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Load Sample Mappings
              </button>
              <button
                onClick={handleCreateMapping}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Mapping
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Datasets Section */}
      {datasets.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Recent Datasets
          </h2>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dataset Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mapping
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rows
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datasets.map((dataset) => {
                    const mapping = mappings.find(
                      (m) => m.id === dataset.mappingId
                    );
                    return (
                      <tr key={dataset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {dataset.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {mapping?.name || "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {dataset.rows.length}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(dataset.updatedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOpenDataset(dataset)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => exportDatasetToCSV(dataset.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              CSV
                            </button>
                            <button
                              onClick={() => exportDatasetToJSON(dataset.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => handleDeleteDataset(dataset)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBuilderView = () => (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setViewMode("mappings")}
          className="flex items-center text-indigo-600 hover:text-indigo-800"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Mapping
        </button>
      </div>

      <MappingBuilder
        mapping={editingMapping}
        onSave={handleSaveMapping}
        onCancel={() => setViewMode("mappings")}
      />
    </div>
  );

  const renderDataEntryView = () => {
    if (!selectedMapping || !selectedDataset) return null;

    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setViewMode("mappings")}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Mapping
          </button>

          <div className="flex space-x-2">
            <button
              onClick={() => exportDatasetToCSV(selectedDataset.id)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportDatasetToJSON(selectedDataset.id)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Export JSON
            </button>
          </div>
        </div>

        <MappingDataGrid
          mapping={selectedMapping}
          data={selectedDataset.rows}
          onDataChange={handleDatasetDataChange}
          onValidate={validateRow}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {viewMode === "mappings" && renderMappingsView()}
        {viewMode === "builder" && renderBuilderView()}
        {viewMode === "data-entry" && renderDataEntryView()}
      </div>
    </div>
  );
};

export default MappingPage;
