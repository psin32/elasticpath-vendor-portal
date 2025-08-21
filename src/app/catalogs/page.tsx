"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useEpccApi } from "../../hooks/useEpccApi";
import { Catalog } from "@elasticpath/js-sdk";
import { useDashboard } from "@/hooks";

export default function CatalogsPage() {
  const { selectedOrgId, selectedStoreId } = useDashboard();

  const { getAllCatalogs, publishCatalog, getCatalogReleases } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );

  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [catalogReleases, setCatalogReleases] = useState<Record<string, any[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [loadingReleases, setLoadingReleases] = useState<
    Record<string, boolean>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [publishingCatalogId, setPublishingCatalogId] = useState<string | null>(
    null
  );
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStoreId) {
      loadCatalogs();
    }
  }, [selectedOrgId, selectedStoreId]);

  const loadCatalogReleases = async (catalogId: string) => {
    try {
      setLoadingReleases((prev) => ({ ...prev, [catalogId]: true }));
      const response = await getCatalogReleases(catalogId);
      console.log("releases", response);

      if (response?.data) {
        setCatalogReleases((prev) => ({ ...prev, [catalogId]: response.data }));
      }
    } catch (err) {
      console.error(`Failed to load releases for catalog ${catalogId}:`, err);
      // Don't show error for individual catalog release failures
    } finally {
      setLoadingReleases((prev) => ({ ...prev, [catalogId]: false }));
    }
  };

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllCatalogs();
      console.log("response", response);

      if (response?.data) {
        setCatalogs(response.data);

        // Load releases for each catalog
        response.data.forEach((catalog: any) => {
          loadCatalogReleases(catalog.id);
        });
      } else {
        setCatalogs([]);
      }
    } catch (err) {
      console.error("Failed to load catalogs:", err);
      setError("Failed to load catalogs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishCatalog = async (
    catalogId: string,
    catalogName: string
  ) => {
    try {
      setPublishingCatalogId(catalogId);
      setError(null);
      setPublishSuccess(null);

      const response = await publishCatalog(catalogId);

      if (response?.data) {
        setPublishSuccess(`Catalog "${catalogName}" published successfully!`);
        setTimeout(() => setPublishSuccess(null), 5000);

        // Reload releases for this catalog to show the new release
        loadCatalogReleases(catalogId);
      } else {
        throw new Error("Failed to publish catalog");
      }
    } catch (err) {
      console.error("Failed to publish catalog:", err);
      setError(`Failed to publish catalog "${catalogName}". Please try again.`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setPublishingCatalogId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLastPublishedDate = (catalogId: string) => {
    const releases = catalogReleases[catalogId];
    if (!releases || releases.length === 0) {
      return null;
    }

    // Sort releases by created_at date (most recent first)
    const sortedReleases = releases.sort(
      (a, b) =>
        new Date(
          b.meta?.created_at || b.attributes?.created_at || 0
        ).getTime() -
        new Date(a.meta?.created_at || a.attributes?.created_at || 0).getTime()
    );

    const lastRelease = sortedReleases[0];
    return lastRelease?.meta?.created_at || lastRelease?.attributes?.created_at;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Catalogs</h1>
                  <p className="mt-2 text-gray-600">
                    Manage and publish your product catalogs
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={loadCatalogs}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className={`w-4 h-4 mr-2 ${
                        loading ? "animate-spin" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {publishSuccess && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
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
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {publishSuccess}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
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
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="animate-pulse">
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="animate-spin h-8 w-8 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="text-lg font-medium text-gray-900">
                        Loading catalogs...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : catalogs.length === 0 ? (
              /* Empty State */
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No catalogs found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first catalog.
                  </p>
                </div>
              </div>
            ) : (
              /* Catalog Grid */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {catalogs.map((catalog: any) => (
                  <div
                    key={catalog.id}
                    className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="p-6">
                      {/* Catalog Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-indigo-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {catalog.attributes.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Catalog Description */}
                      {catalog.attributes.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {catalog.attributes.description}
                        </p>
                      )}

                      {/* Catalog Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
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
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          ID: {catalog.id}
                        </div>

                        {catalog.attributes.hierarchy_ids &&
                          catalog.attributes.hierarchy_ids.length > 0 && (
                            <div className="flex items-center text-sm text-gray-500">
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
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"
                                />
                              </svg>
                              Hierarchies:{" "}
                              {catalog.attributes.hierarchy_ids.length}
                            </div>
                          )}

                        {catalog.attributes.pricebook_id && (
                          <div className="flex items-center text-sm text-gray-500">
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
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                              />
                            </svg>
                            Pricebook: {catalog.attributes.pricebook_id}
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-500">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Releases:{" "}
                          {loadingReleases[catalog.id] ? (
                            <svg
                              className="animate-spin w-3 h-3 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            catalogReleases[catalog.id]?.length || 0
                          )}
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="text-xs text-gray-400 mb-4">
                        <div>
                          Created: {formatDate(catalog?.attributes?.created_at)}
                        </div>
                        <div>
                          Updated: {formatDate(catalog?.attributes?.updated_at)}
                        </div>
                        <div className="flex items-center">
                          <span>Last Published: </span>
                          {loadingReleases[catalog.id] ? (
                            <svg
                              className="animate-spin w-3 h-3 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <span
                              className={
                                getLastPublishedDate(catalog.id)
                                  ? "text-green-600 font-medium"
                                  : "text-amber-600"
                              }
                            >
                              {getLastPublishedDate(catalog.id)
                                ? formatDate(getLastPublishedDate(catalog.id)!)
                                : "Never published"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Publish Button */}
                      <button
                        onClick={() =>
                          handlePublishCatalog(
                            catalog.id,
                            catalog.attributes.name
                          )
                        }
                        disabled={publishingCatalogId === catalog.id}
                        className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                          publishingCatalogId === catalog.id
                            ? "bg-indigo-400 text-white cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
                        }`}
                      >
                        {publishingCatalogId === catalog.id ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Publishing...
                          </>
                        ) : (
                          <>
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
                                d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2M7 4h6M7 4l-2 14h10l-2-14M9 9v6M15 9v6"
                              />
                            </svg>
                            Publish Catalog
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
