"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SidebarNavigationProps } from "../../types/dashboard";

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const router = useRouter();
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
    {
      id: "accounts" as const,
      label: "Accounts",
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
    },
    {
      id: "inventory" as const,
      label: "Inventory",
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
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
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
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "products") {
                  router.push("/products");
                } else if (item.id === "orders") {
                  router.push("/orders");
                } else {
                  onSectionChange(item.id);
                }
              }}
              className={`w-full text-left px-4 py-2 text-sm font-medium rounded-md mx-2 ${
                activeSection === item.id
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center">
                {item.icon}
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
};
