"use client";

import React, { useState, useEffect } from "react";
import {
  Mapping,
  MappingField,
  MappingData,
  ValidationError,
} from "../../types/mapping";

interface MappingDataGridProps {
  mapping: Mapping;
  data: MappingData[];
  onDataChange: (data: MappingData[]) => void;
  onValidate: (
    mapping: Mapping,
    rowData: Record<string, any>
  ) => ValidationError[];
}

const MappingDataGrid: React.FC<MappingDataGridProps> = ({
  mapping,
  data,
  onDataChange,
  onValidate,
}) => {
  const [localData, setLocalData] = useState<MappingData[]>(data);
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    fieldName: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [errors, setErrors] = useState<Record<number, ValidationError[]>>({});

  // Sort fields by order
  const sortedFields = [...mapping.fields].sort((a, b) => a.order - b.order);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  useEffect(() => {
    // Validate all rows when data changes
    const newErrors: Record<number, ValidationError[]> = {};
    localData.forEach((row, index) => {
      const rowErrors = onValidate(mapping, row.data);
      if (rowErrors.length > 0) {
        newErrors[index] = rowErrors;
      }
    });
    setErrors(newErrors);
  }, [localData, mapping, onValidate]);

  const handleCellEdit = (
    rowIndex: number,
    fieldName: string,
    value: string
  ) => {
    setEditingCell({ rowIndex, fieldName });
    setEditingValue(value);
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    const { rowIndex, fieldName } = editingCell;
    const newData = [...localData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      data: {
        ...newData[rowIndex].data,
        [fieldName]: editingValue,
      },
    };

    setLocalData(newData);
    onDataChange(newData);
    setEditingCell(null);
    setEditingValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellSave();
    } else if (e.key === "Escape") {
      handleCellCancel();
    }
  };

  const addRow = () => {
    const newRow: MappingData = {
      id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mappingId: mapping.id,
      data: mapping.fields.reduce((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {} as Record<string, any>),
      errors: {},
      isValid: false,
    };

    const newData = [...localData, newRow];
    setLocalData(newData);
    onDataChange(newData);
  };

  const removeRow = (rowIndex: number) => {
    const newData = localData.filter((_, index) => index !== rowIndex);
    setLocalData(newData);
    onDataChange(newData);
  };

  const renderCellContent = (row: MappingData, field: MappingField) => {
    const value = row.data[field.name] || "";
    const isEditing =
      editingCell?.rowIndex === localData.indexOf(row) &&
      editingCell?.fieldName === field.name;

    if (isEditing) {
      return (
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={handleCellSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      );
    }

    const displayValue = value || "";
    return (
      <div
        className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded"
        onClick={() =>
          handleCellEdit(localData.indexOf(row), field.name, value)
        }
        title="Click to edit"
      >
        {displayValue}
      </div>
    );
  };

  const getRowStatus = (row: MappingData) => {
    const rowErrors = errors[localData.indexOf(row)] || [];
    if (rowErrors.length === 0) {
      return "valid";
    }
    return "invalid";
  };

  const getFieldErrors = (rowIndex: number, fieldName: string) => {
    const rowErrors = errors[rowIndex] || [];
    return rowErrors.filter((error) => error.fieldName === fieldName);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Data Entry: {mapping.name}
          </h3>
          <button
            onClick={addRow}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Add Row
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {sortedFields.map((field) => (
                <th
                  key={field.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center space-x-2">
                    <span>{field.label}</span>
                    {field.required && <span className="text-red-500">*</span>}
                  </div>
                  <div className="text-xs text-gray-400 font-normal">
                    {field.type}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {localData.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={`${
                  getRowStatus(row) === "invalid"
                    ? "bg-red-50 border-l-4 border-l-red-400"
                    : "hover:bg-gray-50"
                }`}
              >
                {sortedFields.map((field) => {
                  const fieldErrors = getFieldErrors(rowIndex, field.name);
                  return (
                    <td
                      key={field.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      <div className="space-y-1">
                        {renderCellContent(row, field)}
                        {fieldErrors.length > 0 && (
                          <div className="text-xs text-red-600">
                            {fieldErrors.map((error, index) => (
                              <div key={index}>{error.errors[0]}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => removeRow(rowIndex)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {localData.length === 0 && (
        <div className="text-center py-12">
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
            No data yet
          </h3>
          <p className="text-gray-600 mb-4">
            Click "Add Row" to start entering data for this mapping.
          </p>
          <button
            onClick={addRow}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Add First Row
          </button>
        </div>
      )}
    </div>
  );
};

export default MappingDataGrid;
