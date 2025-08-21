"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarNavigationProps } from "../../types/dashboard";

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Auto-expand parent sections when child routes are active
  React.useEffect(() => {
    if (
      pathname.startsWith("/upload/bulk") ||
      pathname.startsWith("/upload/mapping")
    ) {
      setExpandedSections((prev) => new Set(Array.from(prev).concat("upload")));
    }
  }, [pathname]);

  // Determine the current active section based on the URL pathname
  const getCurrentActiveSection = (): string => {
    if (pathname.startsWith("/products")) {
      return "products";
    } else if (pathname.startsWith("/orders")) {
      return "orders";
    } else if (pathname.startsWith("/catalogs")) {
      return "catalogs";
    } else if (pathname.startsWith("/upload/bulk")) {
      return "bulk-upload";
    } else if (pathname.startsWith("/upload/mapping")) {
      return "templates";
    }
    return activeSection; // fallback to prop if no URL match
  };

  const currentActiveSection = getCurrentActiveSection();

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const navigationItems = [
    {
      id: "products" as const,
      label: "Products",
      enabled: true,
      icon: (
        <svg
          className="mr-3 h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      route: "/products",
      hasChildren: false,
    },
    {
      id: "orders" as const,
      label: "Orders",
      enabled: true,
      icon: (
        <svg
          className="mr-3 h-5 w-5"
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
      ),
      route: "/orders",
      hasChildren: false,
    },
    {
      id: "catalogs" as const,
      label: "Catalogs",
      enabled: true,
      icon: (
        <svg
          className="mr-3 h-5 w-5"
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
      ),
      route: "/catalogs",
      hasChildren: false,
    },
    {
      id: "upload" as const,
      label: "Upload",
      enabled: true,
      icon: (
        <svg
          className="mr-3 h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
      hasChildren: true,
      children: [
        {
          id: "bulk-upload" as const,
          label: "Bulk Upload",
          enabled: true,
          route: "/upload/bulk",
        },
        {
          id: "templates" as const,
          label: "Templates",
          enabled: true,
          route: "/upload/mapping",
        },
      ],
    },
  ];

  const renderNavigationItem = (item: any, level: number = 0) => {
    const isActive = currentActiveSection === item.id;
    const isExpanded = expandedSections.has(item.id);
    const hasChildren = item.hasChildren && item.children;

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleSection(item.id)}
            className={`w-full text-left px-4 py-2 text-sm font-medium rounded-md mx-2 transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border-r-4 border-indigo-500 shadow-sm font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {item.icon}
                {item.label}
              </div>
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {isExpanded && (
            <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
              {item.children.map((child: any) =>
                renderNavigationItem(child, level + 1)
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => {
          if (item.route) {
            router.push(item.route);
          }
        }}
        className={`w-full text-left px-4 py-2 text-sm font-medium rounded-md mx-2 transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border-r-4 border-indigo-500 shadow-sm font-semibold"
            : level > 0
            ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700 bg-gray-50/50"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
        }`}
      >
        <div className="flex items-center">
          {item.icon && item.icon}
          {level > 0 && !item.icon && <span className="mr-3 w-4 h-4"></span>}
          {item.label}
        </div>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-white shadow-sm h-full">
      <nav className="mt-8">
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Store Management
          </h3>
        </div>
        <div className="space-y-1">
          {navigationItems
            .filter((item) => item.enabled)
            .map((item) => renderNavigationItem(item))}
        </div>
      </nav>
    </aside>
  );
};
