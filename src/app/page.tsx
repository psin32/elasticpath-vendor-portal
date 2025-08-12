"use client";

import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();

  // If authenticated, show dashboard content
  if (isAuthenticated) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Kennicott Vendor Portal
        </h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600 mb-4">
            Select an organization and store from the header to get started.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Products</h3>
              <p className="text-blue-700 text-sm">
                Manage your product catalog, inventory, and pricing.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Orders</h3>
              <p className="text-green-700 text-sm">
                View and manage customer orders and fulfillment.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Analytics</h3>
              <p className="text-purple-700 text-sm">
                Monitor performance and business metrics.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (LoginForm is handled by DashboardLayout)
  return null;
}
