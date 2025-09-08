"use client";

import { useState, useEffect } from "react";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useToast } from "@/contexts/ToastContext";
import { ShoppingCartIcon as ShoppingCartIconSolid } from "@heroicons/react/24/solid";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface Product {
  id: string;
  type: string;
  name?: string;
  slug?: string;
  description?: string;
  meta?: {
    display_price?: {
      with_tax?: {
        formatted?: string;
        amount?: number;
      };
    };
    timestamps?: {
      created_at: string;
      updated_at: string;
    };
  };
  relationships?: {
    main_image?: {
      data?: {
        id: string;
        type: string;
      };
    };
  };
}

interface ProductsComponentProps {
  selectedAccountToken: string;
  selectedOrgId: string;
  selectedStoreId: string;
}

export default function ProductsComponent({
  selectedAccountToken,
  selectedOrgId,
  selectedStoreId,
}: ProductsComponentProps) {
  const { fetchAllProducts } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [mainImages, setMainImages] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "created">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (selectedAccountToken && selectedOrgId && selectedStoreId) {
      loadProducts();
    } else {
      setProducts([]);
      setError(null);
    }
  }, [selectedAccountToken, selectedOrgId, selectedStoreId]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAllProducts(
        selectedAccountToken,
        selectedOrgId || "",
        selectedStoreId || ""
      );

      if (response?.data) {
        const productsArray = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setProducts(productsArray);

        // Handle main images from included section
        if (response.included?.main_images) {
          const imageMap: Record<string, any> = {};
          response.included.main_images.forEach((image: any) => {
            if (image.id) {
              imageMap[image.id] = image;
            }
          });
          setMainImages(imageMap);
        } else {
          setMainImages({});
        }
      } else {
        setProducts([]);
        setMainImages({});
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load products";
      setError(errorMessage);
      showToast(errorMessage, "error");
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  const getProductPrice = (product: Product) => {
    return (product as any)?.meta?.display_price?.with_tax?.formatted || "N/A";
  };

  const getProductImage = (product: Product) => {
    const imageId = (product as any)?.relationships?.main_image?.data?.id;
    if (imageId && mainImages[imageId]?.link?.href) {
      return mainImages[imageId].link.href;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const filteredAndSortedProducts = products
    .filter((product) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        (product as any)?.attributes?.name
          ?.toLowerCase()
          .includes(searchLower) ||
        (product as any)?.attributes?.description
          ?.toLowerCase()
          .includes(searchLower) ||
        (product as any)?.attributes?.slug?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = (a as any)?.attributes?.name || "";
          bValue = (b as any)?.attributes?.name || "";
          break;
        case "price":
          aValue = (a as any)?.meta?.display_price?.with_tax?.amount || 0;
          bValue = (b as any)?.meta?.display_price?.with_tax?.amount || 0;
          break;
        case "created":
          aValue = new Date((a as any)?.meta?.timestamps?.created_at || 0);
          bValue = new Date((b as any)?.meta?.timestamps?.created_at || 0);
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Browse Products</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading products...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Browse Products</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Error Loading Products
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={loadProducts}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Browse Products</h3>
        </div>
        <div className="p-6">
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
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No Products Found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No products are available for this account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Browse Products
            </h3>
            <p className="mt-1 text-sm text-gray-500">No products available</p>
          </div>
          <button
            onClick={loadProducts}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="created">Sort by Created Date</option>
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => (
            <div
              key={product.id}
              className="group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Product Image */}
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                <img
                  src={getProductImage(product)}
                  alt={(product as any)?.attributes?.name || "Product"}
                  className="h-48 w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://via.placeholder.com/150x150?text=Product";
                  }}
                />
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {(product as any)?.attributes?.name || "Unnamed Product"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {(product as any)?.attributes?.description ||
                    "No description available"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-900">
                    {getProductPrice(product)}
                  </p>
                  <button
                    onClick={() => {
                      showToast(
                        "Add to cart functionality coming soon",
                        "info"
                      );
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ShoppingCartIconSolid className="h-4 w-4 mr-1" />
                    Add
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Created:{" "}
                  {formatDate((product as any)?.meta?.timestamps?.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Results Summary */}
        {filteredAndSortedProducts.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
            <div>
              Showing {filteredAndSortedProducts.length} of {products.length}{" "}
              products
            </div>
            {searchTerm && <div>Filtered by: "{searchTerm}"</div>}
          </div>
        )}
      </div>
    </div>
  );
}
