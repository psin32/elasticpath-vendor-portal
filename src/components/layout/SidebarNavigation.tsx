"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarNavigationProps } from "../../types/dashboard";

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine the current active section based on the URL pathname
  const getCurrentActiveSection = (): string => {
    if (pathname.startsWith("/products")) {
      return "products";
    } else if (pathname.startsWith("/orders")) {
      return "orders";
    }
    return activeSection; // fallback to prop if no URL match
  };

  const currentActiveSection = getCurrentActiveSection();

  const navigationItems = [
    {
      id: "products" as const,
      label: "Products",
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
    },
    {
      id: "orders" as const,
      label: "Orders",
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
    },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm h-full">
      <nav className="mt-8">
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Store Management
          </h3>
        </div>
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = currentActiveSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "products") {
                    router.push("/products");
                  } else if (item.id === "orders") {
                    router.push("/orders");
                  }
                }}
                className={`w-full text-left px-4 py-2 text-sm font-medium rounded-md mx-2 transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border-r-4 border-indigo-500 shadow-sm font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center">
                  {item.icon}
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
