"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useToast } from "@/contexts/ToastContext";
import { useCartContext } from "@/contexts/CartContext";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

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
  const { fetchAllProducts, fetchProductByIds } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );
  const { showToast } = useToast();
  const { addItemToCart } = useCartContext();

  const [products, setProducts] = useState<any[]>([]);
  const [mainImages, setMainImages] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [childItems, setChildItems] = useState<any>([]);

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

  const getProductImage = (product: any) => {
    const imageId = (product as any)?.relationships?.main_image?.data?.id;
    if (imageId && mainImages[imageId]?.link?.href) {
      return mainImages[imageId].link.href;
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: Math.max(0, quantity),
    }));
  };

  const handleAddToCart = async (productId: string) => {
    const currentQuantity = cartItems[productId] || 0;

    if (currentQuantity === 0) {
      showToast("Please select a quantity first", "error");
      return;
    }

    await addItemToCart(productId, currentQuantity);
  };

  const handleInputChange = (productId: string, quantity: number) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: Math.max(0, quantity),
    }));
  };

  // Simple Price component
  const Price = ({
    price,
    currency,
    size = "text-lg",
  }: {
    price: string;
    currency: string;
    size?: string;
  }) => <span className={`${size} font-semibold text-gray-900`}>{price}</span>;

  // Simple StrikePrice component
  const StrikePrice = ({
    price,
    currency,
    size = "text-sm",
  }: {
    price: string;
    currency: string;
    size?: string;
  }) => <span className={`${size} text-gray-500 line-through`}>{price}</span>;

  const extractValues = (obj: any) => {
    let values: any = [];

    const recurse = (currentObj: any) => {
      if (typeof currentObj === "object" && currentObj !== null) {
        if (Array.isArray(currentObj)) {
          currentObj.forEach((item) => recurse(item));
        } else {
          Object.values(currentObj).forEach((value) => recurse(value));
        }
      } else {
        values.push(currentObj);
      }
    };

    recurse(obj);
    return values;
  };

  const getVariants = async (productId: string, variationMatrix: any) => {
    const productIds = extractValues(variationMatrix);
    const newItems: any = childItems.slice();
    const items = await fetchProductByIds(
      selectedAccountToken,
      selectedOrgId || "",
      selectedStoreId || "",
      productIds
    );
    newItems.push({
      productId,
      items,
    });
    setChildItems(newItems);
  };

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
      <div className="px-6 py-4 border-b border-gray-200 ">
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
        </div>
      </div>

      {/* Products Display */}
      <div className="p-6">
        <div className="space-y-4">
          {products.map((product: any) => {
            const {
              meta: {
                display_price,
                original_display_price,
                sale_id,
                variation_matrix,
              },
              attributes: { name, slug, sku, description, components },
              id,
            } = product;

            const currencyPrice =
              display_price?.without_tax?.formatted ||
              display_price?.with_tax?.formatted;

            const quantity = cartItems[product.id] || 0;
            const productImage = getProductImage(product);

            const child = childItems.find((item: any) => item.productId === id)
              ?.items?.data;

            const main_images = childItems.find(
              (item: any) => item.productId === id
            )?.items?.included?.main_images;

            return (
              <>
                <div
                  key={product.id}
                  className="grid grid-cols-12 gap-4 items-center p-4 border rounded shadow-sm relative"
                >
                  {quantity > 0 && (
                    <CheckCircleIcon className="w-6 h-6 text-green-500 absolute top-0 left-0 z-10" />
                  )}

                  {/* Product Image */}
                  <div className="col-span-1">
                    {productImage && (
                      <img
                        src={productImage}
                        alt={name}
                        className="w-20 h-24 object-cover transition duration-300 ease-in-out group-hover:scale-105 hover:scale-105"
                      />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="col-span-5">
                    <h2 className="text-lg text-gray-800 font-semibold hover:text-indigo-600">
                      {name}
                    </h2>
                    <div className="text-gray-600 text-sm">{sku}</div>
                    <span
                      className="mt-2 line-clamp-6 text-xs font-medium leading-5 text-gray-500"
                      dangerouslySetInnerHTML={{
                        __html:
                          description?.length > 200
                            ? `${description?.substring(0, 200)}...`
                            : description,
                      }}
                    />
                  </div>

                  {/* Price */}
                  <div className="col-span-2 font-normal flex flex-col">
                    <div className="flex items-center">
                      {currencyPrice && (
                        <div
                          className={`mt-1 flex items-center mr-2 ${
                            original_display_price
                              ? "text-red-500"
                              : "text-gray-600"
                          }`}
                        >
                          <span className="text-lg">{currencyPrice}</span>
                        </div>
                      )}
                      {original_display_price && (
                        <div className="mt-1 flex items-center">
                          <span className="text-xs text-gray-600 line-through">
                            {original_display_price?.without_tax?.formatted
                              ? original_display_price?.without_tax?.formatted
                              : original_display_price.with_tax.formatted}
                          </span>
                        </div>
                      )}
                    </div>
                    {original_display_price && (
                      <span className="mt-2 inline-flex items-center rounded-sm bg-white px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700 mb-6 mr-2">
                        {sale_id}
                      </span>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="col-span-2">
                    <div className="flex w-32 items-start rounded-lg border border-black/10">
                      <button
                        type="submit"
                        onClick={() =>
                          handleQuantityChange(product.id, quantity - 1)
                        }
                        className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
                      >
                        <MinusIcon className="h-4 w-4 text-gray-500" />
                      </button>
                      <svg
                        width="2"
                        height="42"
                        viewBox="0 0 2 36"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 0V36"
                          stroke="black"
                          strokeOpacity="0.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <input
                        type="number"
                        placeholder="Quantity"
                        className="border-none focus-visible:ring-0 focus-visible:border-black w-12 h-10 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            product.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                      <svg
                        width="2"
                        height="42"
                        viewBox="0 0 2 36"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 0V36"
                          stroke="black"
                          strokeOpacity="0.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <button
                        type="submit"
                        onClick={() =>
                          handleQuantityChange(product.id, quantity + 1)
                        }
                        className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
                      >
                        <PlusIcon className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="col-span-2">
                    {!variation_matrix && !components && (
                      <button
                        className={`py-2 w-32 text-sm px-2 rounded-md font-medium ${
                          quantity > 0
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        onClick={() => handleAddToCart(product.id)}
                        disabled={quantity === 0}
                      >
                        Add to Cart
                      </button>
                    )}

                    {variation_matrix && (
                      <button
                        className={`py-2 w-32 text-sm px-2 rounded-md font-medium ${
                          quantity > 0
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        onClick={() =>
                          getVariants(product.id, variation_matrix)
                        }
                      >
                        Choose Variants
                      </button>
                    )}
                  </div>
                </div>
                {/* Child Products Display */}
                {variation_matrix &&
                  child?.map((item: any) => {
                    const {
                      meta: {
                        display_price,
                        original_display_price,
                        child_variations,
                        sale_id,
                      },
                      attributes: { name, slug, sku },
                      id,
                    } = item;

                    const currencyPrice =
                      display_price?.without_tax?.formatted ||
                      display_price?.with_tax?.formatted;

                    const quantity = cartItems[id] || 0;
                    const main_image = main_images.find(
                      (image: any) =>
                        image.id === item.relationships.main_image.data.id
                    );
                    const ep_main_image_url = main_image?.link.href;

                    return (
                      <div
                        key={id}
                        className="grid grid-cols-12 gap-4 items-center p-4 border rounded shadow-sm relative bg-green-50"
                      >
                        {quantity > 0 && (
                          <CheckCircleIcon className="w-6 h-6 text-green-500 absolute top-0 left-0 z-10" />
                        )}
                        <div className="col-span-1">
                          {ep_main_image_url && (
                            <img
                              src={ep_main_image_url}
                              alt={name}
                              className="w-20 h-24 object-cover transition duration-300 ease-in-out group-hover:scale-105 hover:scale-105"
                            />
                          )}
                        </div>
                        <div className="col-span-5">
                          <h2 className="text-lg text-gray-800 font-semibold hover:text-brand-primary">
                            <Link href={`/products/${slug}`} legacyBehavior>
                              {name}
                            </Link>
                          </h2>
                          <div className="text-gray-600 text-sm">{sku}</div>
                          {child_variations?.map((variation: any) => {
                            return (
                              <span
                                className="line-clamp-6 text-xs font-medium leading-5 text-gray-500"
                                key={variation.id}
                              >
                                {variation.name}: {variation.option.name}
                              </span>
                            );
                          })}
                        </div>
                        <div className="col-span-2 text-green-500 font-bold">
                          {currencyPrice && (
                            <div className="mt-1 flex items-center">
                              {original_display_price && (
                                <StrikePrice
                                  price={
                                    original_display_price?.without_tax
                                      ?.formatted
                                      ? original_display_price?.without_tax
                                          ?.formatted
                                      : original_display_price.with_tax
                                          .formatted
                                  }
                                  currency={
                                    original_display_price.without_tax?.currency
                                      ? original_display_price?.without_tax
                                          ?.currency
                                      : original_display_price.with_tax.currency
                                  }
                                  size="text-md"
                                />
                              )}
                              <Price
                                price={
                                  display_price?.without_tax?.formatted
                                    ? display_price?.without_tax?.formatted
                                    : display_price.with_tax.formatted
                                }
                                currency={
                                  display_price?.without_tax?.currency
                                    ? display_price?.without_tax?.currency
                                    : display_price.with_tax.currency
                                }
                                size="text-xl"
                              />
                            </div>
                          )}
                          {original_display_price && (
                            <span className="mt-2 uppercase inline-flex items-center rounded-sm bg-white px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700 mb-6 mr-2">
                              {sale_id}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <div className="flex w-32 items-start rounded-lg border border-black/10">
                            <button
                              type="submit"
                              onClick={() =>
                                handleInputChange(id, quantity - 1)
                              }
                              className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
                            >
                              <MinusIcon className="h-4 w-4 dark:text-neutral-500" />
                            </button>
                            <svg
                              width="2"
                              height="42"
                              viewBox="0 0 2 36"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 0V36"
                                stroke="black"
                                strokeOpacity="0.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>

                            <input
                              type="number"
                              placeholder="Quantity"
                              className="bg-green-50 border-none focus-visible:ring-0 focus-visible:border-black w-12 h-10 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={quantity}
                              onChange={(e) =>
                                handleInputChange(id, parseInt(e.target.value))
                              }
                            />
                            <svg
                              width="2"
                              height="42"
                              viewBox="0 0 2 36"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 0V36"
                                stroke="black"
                                strokeOpacity="0.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <button
                              type="submit"
                              onClick={() =>
                                handleInputChange(id, quantity + 1)
                              }
                              className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
                            >
                              <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
                            </button>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <button
                            className={`py-2 w-32 text-sm px-2 rounded-md font-medium ${
                              quantity > 0
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                            onClick={() => handleAddToCart(id)}
                            disabled={quantity === 0}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </>
            );
          })}
        </div>

        {/* Results Summary */}
        {products.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
            <div>
              Showing {products.length} of {products.length} products
            </div>
            {searchTerm && <div>Filtered by: "{searchTerm}"</div>}
          </div>
        )}
      </div>
    </div>
  );
}
