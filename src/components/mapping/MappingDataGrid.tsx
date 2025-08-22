"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mapping,
  MappingField,
  MappingData,
  ValidationError,
} from "@/types/mapping";
import { useToast } from "../../contexts/ToastContext";

interface DataGridProps {
  mapping: Mapping;
  data: MappingData[];
  onDataChange: (data: MappingData[]) => void;
  onValidate: (
    template: Mapping,
    rowData: Record<string, any>
  ) => ValidationError[];
}

const DataGrid: React.FC<DataGridProps> = ({
  mapping,
  data,
  onDataChange,
  onValidate,
}) => {
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    fieldName: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const inputRef = useRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(null);
  const { showToast } = useToast();

  // Sort fields by order
  const sortedFields = [...mapping.fields].sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (
        inputRef.current instanceof HTMLInputElement ||
        inputRef.current instanceof HTMLTextAreaElement
      ) {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  const handleCellClick = (
    rowId: string,
    fieldName: string,
    currentValue: any
  ) => {
    setEditingCell({ rowId, fieldName });
    setEditValue(currentValue?.toString() || "");
  };

  const handleCellChange = (value: string) => {
    setEditValue(value);
  };

  const handleCellSubmit = () => {
    if (!editingCell) return;

    const { rowId, fieldName } = editingCell;
    const field = mapping.fields.find((f) => f.name === fieldName);
    if (!field) return;

    // Convert value based on field type
    let convertedValue: any = editValue;

    switch (field.type) {
      case "number":
      case "currency":
        convertedValue = editValue === "" ? null : Number(editValue);
        break;
      case "boolean":
        convertedValue =
          editValue === "true" ||
          editValue === "1" ||
          editValue.toLowerCase() === "yes";
        break;
      case "date":
        convertedValue = editValue === "" ? null : editValue;
        break;
      default:
        convertedValue = editValue;
    }

    // Update the data
    const updatedData = data.map((row) => {
      if (row.id === rowId) {
        const newRowData = { ...row.data, [fieldName]: convertedValue };
        const errors = onValidate(mapping, newRowData);

        return {
          ...row,
          data: newRowData,
          errors: errors.reduce((acc, error) => {
            acc[error.fieldName] = error.errors;
            return acc;
          }, {} as Record<string, string[]>),
          isValid: errors.length === 0,
        };
      }
      return row;
    });

    onDataChange(updatedData);
    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCellSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCellCancel();
    }
  };

  const handleAddRow = () => {
    const newRow: MappingData = {
      id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mappingId: mapping.id,
      data: mapping.fields.reduce((acc, field) => {
        acc[field.name] = field.defaultValue || "";
        return acc;
      }, {} as Record<string, any>),
      errors: {},
      isValid: false,
    };

    onDataChange([...data, newRow]);
  };

  const handleDeleteRows = () => {
    if (selectedRows.size === 0) {
      showToast("No rows selected", "warning");
      return;
    }

    const updatedData = data.filter((row) => !selectedRows.has(row.id));
    onDataChange(updatedData);
    setSelectedRows(new Set());
    setSelectAll(false);
    showToast(`Deleted ${selectedRows.size} row(s)`, "success");
  };

  const handleRowSelect = (rowId: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    setSelectedRows(newSelectedRows);
    setSelectAll(newSelectedRows.size === data.length && data.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(data.map((row) => row.id)));
      setSelectAll(true);
    }
  };

  const renderCellContent = (row: MappingData, field: MappingField) => {
    const value = row.data[field.name];
    const isEditing =
      editingCell?.rowId === row.id && editingCell?.fieldName === field.name;
    const hasError = (row.errors?.[field.name]?.length || 0) > 0;

    if (isEditing) {
      return (
        <div className="w-full">
          {field.type === "select" ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editValue}
              onChange={(e) => handleCellChange(e.target.value)}
              onBlur={handleCellSubmit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 border-0 bg-transparent focus:outline-none"
            >
              <option value="">Select...</option>
              {field.selectOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "boolean" ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editValue}
              onChange={(e) => handleCellChange(e.target.value)}
              onBlur={handleCellSubmit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 border-0 bg-transparent focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={
                field.type === "number" || field.type === "currency"
                  ? "number"
                  : field.type === "date"
                  ? "date"
                  : field.type === "email"
                  ? "email"
                  : field.type === "url"
                  ? "url"
                  : "text"
              }
              value={editValue}
              onChange={(e) => handleCellChange(e.target.value)}
              onBlur={handleCellSubmit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 border-0 bg-transparent focus:outline-none"
            />
          )}
        </div>
      );
    }

    // Display value
    let displayValue = value;
    if (field.type === "boolean") {
      displayValue = value === true ? "Yes" : value === false ? "No" : "";
    } else if (field.type === "select" && field.selectOptions) {
      const option = field.selectOptions.find((opt) => opt.value === value);
      displayValue = option ? option.label : value;
    } else if (field.type === "currency" && value != null) {
      displayValue = `$${Number(value).toFixed(2)}`;
    }

    return (
      <div
        className={`w-full px-2 py-1 cursor-pointer hover:bg-gray-50 ${
          hasError ? "bg-red-50 text-red-900" : ""
        }`}
        onClick={() => handleCellClick(row.id, field.name, value)}
        title={
          hasError ? row.errors?.[field.name]?.join(", ") : field.description
        }
      >
        {displayValue || (
          <span className="text-gray-400 italic">Click to edit</span>
        )}
        {hasError && (
          <svg
            className="inline w-4 h-4 ml-1 text-red-500"
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
        )}
      </div>
    );
  };

  const getRowStatus = (row: MappingData) => {
    const errorCount = Object.values(row.errors || {}).flat().length;
    if (errorCount === 0) return "valid";
    return "invalid";
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">
            Data Entry: {mapping.name}
          </h3>
          <span className="text-sm text-gray-500">{data.length} row(s)</span>
        </div>

        <div className="flex items-center space-x-2">
          {selectedRows.size > 0 && (
            <button
              onClick={handleDeleteRows}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete Selected ({selectedRows.size})
            </button>
          )}
          <button
            onClick={handleAddRow}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Row
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {/* Select All Checkbox */}
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>

                {/* Status Column */}
                <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>

                {/* Field Columns */}
                {sortedFields.map((field) => (
                  <th
                    key={field.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{field.label}</span>
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 normal-case font-normal">
                      {field.type}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={sortedFields.length + 2}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-4"
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
                      <p>No data rows yet. Click "Add Row" to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => {
                  const status = getRowStatus(row);
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 ${
                        selectedRows.has(row.id) ? "bg-indigo-50" : ""
                      }`}
                    >
                      {/* Row Select Checkbox */}
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => handleRowSelect(row.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>

                      {/* Status Indicator */}
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          {status === "valid" ? (
                            <div className="flex items-center text-green-600">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Data Cells */}
                      {sortedFields.map((field) => (
                        <td
                          key={field.id}
                          className="border-r border-gray-200 last:border-r-0"
                        >
                          {renderCellContent(row, field)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {data.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded">
          <div>Total: {data.length} rows</div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Valid: {data.filter((row) => row.isValid).length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Invalid: {data.filter((row) => !row.isValid).length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
