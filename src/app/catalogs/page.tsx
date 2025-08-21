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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (selectedStoreId) {
      loadCatalogs();
    }
  }, [selectedOrgId, selectedStoreId]);

  // Update relative times every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update relative times
      setCatalogReleases((prev) => ({ ...prev }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();

    // Convert to different time units
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? "s" : ""} ago`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
    } else {
      return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
    }
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
                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                        viewMode === "grid"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
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
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                        viewMode === "list"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
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
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                      List
                    </button>
                  </div>

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
            ) : viewMode === "grid" ? (
              /* Catalog Grid */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {catalogs.map((catalog: any) => (
                  <div
                    key={catalog.id}
                    className="group bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Header with Gradient Background */}
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30">
                              <svg
                                className="w-6 h-6 text-white"
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
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xl font-bold text-white truncate">
                              {catalog.attributes.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 pt-4">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-blue-600"
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
                            </div>
                            <div>
                              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                Hierarchies
                              </div>
                              <div className="text-lg font-bold text-blue-900">
                                {catalog.attributes.hierarchy_ids?.length || 0}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-purple-600"
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
                            </div>
                            <div>
                              <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                Releases
                              </div>
                              <div className="text-lg font-bold text-purple-900">
                                {loadingReleases[catalog.id] ? (
                                  <svg
                                    className="animate-spin w-4 h-4"
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
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {catalog.attributes.pricebook_id && (
                        <div className="mb-5">
                          <div className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                              <svg
                                className="w-4 h-4 text-amber-600"
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
                            </div>
                            <div>
                              <div className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                                Pricebook
                              </div>
                              <div className="text-sm font-semibold text-amber-900 truncate">
                                {catalog.attributes.pricebook_id}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-5">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-xs font-medium text-gray-600">
                                Created
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(catalog?.attributes?.created_at)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                              <span className="text-xs font-medium text-gray-600">
                                Updated
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(catalog?.attributes?.updated_at)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  getLastPublishedDate(catalog.id)
                                    ? "bg-green-400"
                                    : "bg-gray-300"
                                }`}
                              ></div>
                              <span className="text-xs font-medium text-gray-600">
                                Last Published
                              </span>
                            </div>
                            {loadingReleases[catalog.id] ? (
                              <svg
                                className="animate-spin w-3 h-3"
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
                                className={`text-xs font-medium cursor-help ${
                                  getLastPublishedDate(catalog.id)
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                                title={
                                  getLastPublishedDate(catalog.id)
                                    ? `Exact time: ${formatDate(
                                        getLastPublishedDate(catalog.id)!
                                      )}`
                                    : "This catalog has never been published"
                                }
                              >
                                {getLastPublishedDate(catalog.id)
                                  ? getRelativeTime(
                                      getLastPublishedDate(catalog.id)!
                                    )
                                  : "Never"}
                              </span>
                            )}
                          </div>
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
                        className={`group w-full relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed ${
                          publishingCatalogId === catalog.id
                            ? "opacity-75 cursor-not-allowed"
                            : "hover:from-indigo-600 hover:to-purple-700"
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <div className="relative flex items-center justify-center">
                          {publishingCatalogId === catalog.id ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                              <span className="text-sm">Publishing...</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span className="text-sm font-semibold">
                                Publish Catalog
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Catalog List */
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4">Catalog</div>
                    <div className="col-span-2">Hierarchies</div>
                    <div className="col-span-2">Releases</div>
                    <div className="col-span-2">Last Published</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {catalogs.map((catalog: any) => (
                    <div
                      key={catalog.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Catalog Info */}
                        <div className="col-span-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-white"
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
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                  {catalog.attributes.name}
                                </h3>
                                {getLastPublishedDate(catalog.id) && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                                    Published
                                  </span>
                                )}
                              </div>

                              {catalog.attributes.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {catalog.attributes.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Hierarchies */}
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                              <svg
                                className="w-4 h-4 text-blue-600"
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
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {catalog.attributes.hierarchy_ids?.length || 0}
                            </span>
                          </div>
                        </div>

                        {/* Releases */}
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                              <svg
                                className="w-4 h-4 text-purple-600"
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
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {loadingReleases[catalog.id] ? (
                                <svg
                                  className="animate-spin w-4 h-4"
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
                            </span>
                          </div>
                        </div>

                        {/* Last Published */}
                        <div className="col-span-2">
                          {loadingReleases[catalog.id] ? (
                            <div className="flex items-center">
                              <svg
                                className="animate-spin w-4 h-4 text-gray-400"
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
                              <span className="ml-2 text-sm text-gray-500">
                                Loading...
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`text-sm font-medium cursor-help ${
                                getLastPublishedDate(catalog.id)
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }`}
                              title={
                                getLastPublishedDate(catalog.id)
                                  ? `Exact time: ${formatDate(
                                      getLastPublishedDate(catalog.id)!
                                    )}`
                                  : "This catalog has never been published"
                              }
                            >
                              {getLastPublishedDate(catalog.id)
                                ? getRelativeTime(
                                    getLastPublishedDate(catalog.id)!
                                  )
                                : "Never"}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2">
                          <button
                            onClick={() =>
                              handlePublishCatalog(
                                catalog.id,
                                catalog.attributes.name
                              )
                            }
                            disabled={publishingCatalogId === catalog.id}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                              publishingCatalogId === catalog.id
                                ? "bg-indigo-400 text-white cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
                            }`}
                          >
                            {publishingCatalogId === catalog.id ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white"
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
                                  className="w-3 h-3 mr-1.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                  />
                                </svg>
                                Publish
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
