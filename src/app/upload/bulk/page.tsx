"use client";

import { useToast } from "@/contexts/ToastContext";
import React, { useState } from "react";

interface BulkUploadData {
  entityType: "products" | "orders" | "customers";
  file: File | null;
  template: string;
}

export default function BulkUploadPage() {
  const [uploadData, setUploadData] = useState<BulkUploadData>({
    entityType: "products",
    file: null,
    template: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showToast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".csv")) {
        showToast("Please select a CSV file", "error");
        return;
      }
      setUploadData((prev) => ({ ...prev, file }));
    }
  };

  const handleEntityTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setUploadData((prev) => ({
      ...prev,
      entityType: event.target.value as BulkUploadData["entityType"],
    }));
  };

  const handleTemplateChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setUploadData((prev) => ({ ...prev, template: event.target.value }));
  };

  const handleUpload = async () => {
    if (!uploadData.file) {
      showToast("Please select a file to upload", "error");
      return;
    }

    if (!uploadData.template) {
      showToast("Please select a template", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setUploadProgress(100);

      showToast("Bulk upload completed successfully!", "success");

      // Reset form
      setUploadData({
        entityType: "products",
        file: null,
        template: "",
      });

      // Reset file input
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      showToast("Upload failed. Please try again.", "error");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = (entityType: string) => {
    // This would typically download a CSV template
    const templateData = {
      products:
        "sku,name,description,price,currency\nPROD001,Sample Product,Description,1000,USD",
      orders:
        "order_id,customer_email,status,total\nORD001,test@example.com,pending,1000",
      customers:
        "email,first_name,last_name,phone\njohn@example.com,John,Doe,+1234567890",
    };

    const blob = new Blob(
      [templateData[entityType as keyof typeof templateData] || ""],
      { type: "text/csv" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entityType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTemplates = (entityType: string) => {
    switch (entityType) {
      case "products":
        return [
          { value: "basic", label: "Basic Product Template" },
          { value: "detailed", label: "Detailed Product Template" },
          { value: "with-images", label: "Product with Images Template" },
        ];
      case "orders":
        return [
          { value: "basic", label: "Basic Order Template" },
          { value: "detailed", label: "Detailed Order Template" },
        ];
      case "customers":
        return [
          { value: "basic", label: "Basic Customer Template" },
          { value: "detailed", label: "Detailed Customer Template" },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Bulk Upload</h1>
            <p className="mt-1 text-sm text-gray-600">
              Upload CSV files to perform bulk operations on your data
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Entity Type Selection */}
            <div>
              <label
                htmlFor="entity-type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What would you like to upload?
              </label>
              <select
                id="entity-type"
                value={uploadData.entityType}
                onChange={handleEntityTypeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="products">Products</option>
                <option value="orders">Orders</option>
                <option value="customers">Customers</option>
              </select>
            </div>

            {/* Template Selection */}
            <div>
              <label
                htmlFor="template"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Template
              </label>
              <div className="flex space-x-3">
                <select
                  id="template"
                  value={uploadData.template}
                  onChange={handleTemplateChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose a template...</option>
                  {getTemplates(uploadData.entityType).map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => downloadTemplate(uploadData.entityType)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Download Template
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="file-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-input"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-input"
                        name="file-upload"
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV up to 10MB</p>
                </div>
              </div>
              {uploadData.file && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <svg
                    className="flex-shrink-0 mr-1.5 h-4 w-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {uploadData.file.name} (
                  {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUpload}
                disabled={
                  !uploadData.file || !uploadData.template || isUploading
                }
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Uploading..." : "Start Upload"}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              How to use Bulk Upload
            </h2>
          </div>
          <div className="px-6 py-6">
            <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600">
              <li>
                Select the type of data you want to upload (Products, Orders, or
                Customers)
              </li>
              <li>Choose the appropriate template for your data structure</li>
              <li>Download the template and fill it with your data</li>
              <li>Upload your completed CSV file</li>
              <li>Review the upload summary and resolve any errors</li>
            </ol>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Important Notes:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Maximum file size: 10MB</li>
                <li>• Supported format: CSV only</li>
                <li>• First row should contain column headers</li>
                <li>• Ensure all required fields are filled</li>
                <li>
                  • Review the template for field requirements and formats
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
