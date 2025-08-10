"use client";

import React, { useMemo } from "react";
import { Organization } from "../../types/auth";

interface OrganizationsListProps {
  organizations: Organization[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedOrgId: string | null;
  onOrgSelect: (orgId: string) => void;
}

export const OrganizationsList: React.FC<OrganizationsListProps> = ({
  organizations,
  searchTerm,
  onSearchChange,
  selectedOrgId,
  onOrgSelect,
}) => {
  // Filter organizations based on search term
  const filteredOrganizations = useMemo(() => {
    if (!searchTerm.trim()) return organizations;

    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.description &&
          org.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [organizations, searchTerm]);

  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No organizations
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new organization.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search organizations by name, ID, or description..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <ul className="divide-y divide-gray-200">
        {filteredOrganizations.length === 0 ? (
          <li>
            <div className="px-4 py-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No organizations found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? `No organizations match "${searchTerm}"`
                  : "No organizations available"}
              </p>
            </div>
          </li>
        ) : (
          filteredOrganizations.map((org) => (
            <li
              key={org.id}
              className={`cursor-pointer transition-colors duration-200 ${
                selectedOrgId === org.id
                  ? "bg-indigo-50 border-l-4 border-indigo-400"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onOrgSelect(org.id)}
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          selectedOrgId === org.id
                            ? "bg-indigo-100"
                            : "bg-primary-100"
                        }`}
                      >
                        <svg
                          className={`h-6 w-6 ${
                            selectedOrgId === org.id
                              ? "text-indigo-600"
                              : "text-primary-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {org.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Organization ID: {org.id}
                      </div>
                      {org.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {org.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {org.slug}
                    </span>
                    {selectedOrgId === org.id && (
                      <svg
                        className="h-5 w-5 text-indigo-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};
