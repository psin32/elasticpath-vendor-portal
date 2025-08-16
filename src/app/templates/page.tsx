"use client";

import React, { useState } from "react";
import { Template, TemplateDataset } from "../../types/template";
import { useTemplateManager } from "../../hooks/useTemplateManager";
import { useToast } from "../../contexts/ToastContext";
import TemplateBuilder from "../../components/template/TemplateBuilder";
import DataGrid from "../../components/template/DataGrid";
import {
  sampleTemplates,
  createSampleTemplate,
} from "../../utils/sampleTemplates";

type ViewMode = "templates" | "builder" | "data-entry";

const TemplatesPage: React.FC = () => {
  const {
    templates,
    datasets,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createDataset,
    updateDataset,
    deleteDataset,
    validateRow,
    exportDatasetToCSV,
    exportDatasetToJSON,
  } = useTemplateManager();

  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [selectedDataset, setSelectedDataset] =
    useState<TemplateDataset | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(
    undefined
  );

  const handleCreateTemplate = () => {
    setEditingTemplate(undefined);
    setViewMode("builder");
  };

  const handleLoadSampleTemplates = () => {
    if (
      confirm("This will add sample templates to your workspace. Continue?")
    ) {
      sampleTemplates.forEach((templateData) => {
        createTemplate(templateData);
      });
      showToast(`Added ${sampleTemplates.length} sample templates`, "success");
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setViewMode("builder");
  };

  const handleSaveTemplate = (
    templateData: Omit<Template, "id" | "createdAt" | "updatedAt">
  ) => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, templateData);
      showToast("Template updated successfully", "success");
    } else {
      createTemplate(templateData);
      showToast("Template created successfully", "success");
    }
    setViewMode("templates");
    setEditingTemplate(undefined);
  };

  const handleDeleteTemplate = (template: Template) => {
    if (
      confirm(
        `Are you sure you want to delete "${template.name}"? This will also delete all associated datasets.`
      )
    ) {
      deleteTemplate(template.id);
      showToast("Template deleted successfully", "success");
    }
  };

  const handleCreateDataset = (template: Template) => {
    const dataset = createDataset({
      templateId: template.id,
      name: `${template.name} Data - ${new Date().toLocaleDateString()}`,
      rows: [],
    });
    setSelectedTemplate(template);
    setSelectedDataset(dataset);
    setViewMode("data-entry");
  };

  const handleOpenDataset = (dataset: TemplateDataset) => {
    const template = templates.find((t) => t.id === dataset.templateId);
    if (template) {
      setSelectedTemplate(template);
      setSelectedDataset(dataset);
      setViewMode("data-entry");
    }
  };

  const handleDeleteDataset = (dataset: TemplateDataset) => {
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

  const renderTemplatesView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600">
            Create and manage data templates for bulk operations
          </p>
        </div>
        <div className="flex space-x-3">
          {templates.length === 0 && (
            <button
              onClick={handleLoadSampleTemplates}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Load Sample Templates
            </button>
          )}
          <button
            onClick={handleCreateTemplate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const templateDatasets = datasets.filter(
            (d) => d.templateId === template.id
          );
          return (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500">{template.entityType}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit Template"
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
                    onClick={() => handleDeleteTemplate(template)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete Template"
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

              {template.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{template.fields.length}</span>{" "}
                  fields
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.fields.slice(0, 3).map((field) => (
                    <span
                      key={field.id}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {field.label}
                    </span>
                  ))}
                  {template.fields.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{template.fields.length - 3} more
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleCreateDataset(template)}
                    className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Create Dataset
                  </button>

                  {templateDatasets.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {templateDatasets.length} existing dataset(s)
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {templates.length === 0 && (
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
              No templates yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first template to get started with structured data
              entry.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleLoadSampleTemplates}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Load Sample Templates
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Template
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
                      Template
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
                    const template = templates.find(
                      (t) => t.id === dataset.templateId
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
                            {template?.name || "Unknown"}
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
          onClick={() => setViewMode("templates")}
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
          Back to Templates
        </button>
      </div>

      <TemplateBuilder
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => setViewMode("templates")}
      />
    </div>
  );

  const renderDataEntryView = () => {
    if (!selectedTemplate || !selectedDataset) return null;

    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setViewMode("templates")}
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
            Back to Templates
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

        <DataGrid
          template={selectedTemplate}
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
        {viewMode === "templates" && renderTemplatesView()}
        {viewMode === "builder" && renderBuilderView()}
        {viewMode === "data-entry" && renderDataEntryView()}
      </div>
    </div>
  );
};

export default TemplatesPage;
