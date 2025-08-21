"use client";

import React, { useState, useEffect } from "react";
import { useEpccApi } from "../../hooks/useEpccApi";
import { ImageOverlay } from "../ui/ImageOverlay";
import { PcmProduct, PcmProductResponse } from "@elasticpath/js-sdk";
import { generateProductDescription } from "../../utils/descriptionGenerator";
import { generateProductImage } from "../../utils/imageGenerator";
import { useToast } from "@/contexts/ToastContext";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: PcmProductResponse;
  productId?: string;
  selectedOrgId?: string;
  selectedStoreId?: string;
  onSuccess?: (product: PcmProduct) => void;
  onCancel?: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  mode,
  product,
  productId,
  selectedOrgId,
  selectedStoreId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    slug: "",
    status: "draft",
    commodity_type: "physical",
    description: "",
  });

  const [mainImage, setMainImage] = useState<{
    url: string;
    alt: string;
    fileId?: string;
  } | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { showToast } = useToast();

  const {
    createProduct,
    updateProduct,
    createImageFile,
    createProductImageRelationship,
    deleteProductImageRelationship,
  } = useEpccApi(selectedOrgId, selectedStoreId);

  // Initialize form data when editing
  useEffect(() => {
    if (mode === "edit" && product) {
      setFormData({
        name: product.data.attributes?.name || "",
        sku: product.data.attributes?.sku || "",
        slug: product.data.attributes?.slug || "",
        status: product.data.attributes?.status || "draft",
        commodity_type: product.data.attributes?.commodity_type || "physical",
        description: product.data.attributes?.description || "",
      });

      // Set main image if available
      if (product.included?.main_images?.[0]?.link?.href) {
        setMainImage({
          url:
            product.included?.main_images?.[0]?.link?.href ||
            `https://placehold.co/400x400?text=Product+Image`,
          alt: product.data.attributes?.name || "Product Image",
          // Note: For existing products, we don't have the fileId
          // The image relationship already exists
        });
      }
    }
  }, [mode, product]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData: any = {
        type: "product",
        attributes: {
          name: formData.name,
          sku: formData.sku,
          slug: formData.slug,
          status: formData.status,
          commodity_type: formData.commodity_type,
          description: formData.description,
        },
      };

      let result;
      if (mode === "create") {
        result = await createProduct(productData);
      } else {
        productData.id = productId;
        result = await updateProduct(productId!, productData);
      }

      if (result) {
        // If we have a main image with fileId, create the product image relationship
        if (mainImage?.fileId && mode === "create") {
          try {
            const currentProductId = result.data.id;
            await createProductImageRelationship(
              currentProductId,
              mainImage.fileId
            );
            showToast(
              "Product image relationship created successfully!",
              "success"
            );
          } catch (err) {
            console.error("Error creating product image relationship:", err);
            showToast(
              "Product saved but failed to create image relationship.",
              "error"
            );
          }
        } else {
          showToast(
            mode === "create"
              ? "Product created successfully!"
              : "Product updated successfully!",
            "success"
          );
        }

        if (onSuccess) {
          onSuccess(result.data);
        }
      }
    } catch (err) {
      console.error("Error saving product:", err);
      showToast("Failed to save product. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!imageUrl.trim()) {
      showToast("Please enter an image URL", "error");
      return;
    }

    setUploadingImage(true);

    try {
      // Create the image file
      const imageFile = await createImageFile(imageUrl);

      if (imageFile && imageFile.data) {
        const fileId = imageFile.data.id;

        if (mode === "edit") {
          const mainImageId = product?.data.relationships?.main_image?.data.id;

          if (mainImageId) {
            await deleteProductImageRelationship(productId!, mainImageId);
            await createProductImageRelationship(productId!, fileId);
          } else {
            await createProductImageRelationship(productId!, fileId);
          }
        }

        // Update the main image state
        setMainImage({
          url: imageUrl,
          alt: formData.name || "Product Image",
          fileId,
        });

        setImageUrl("");
        showToast("Image uploaded successfully!", "success");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      showToast("Failed to upload image. Please try again.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleReplaceImage = () => {
    setMainImage(null);
    setImageUrl("");
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      showToast("Product name is required to generate description", "error");
      return;
    }

    setGeneratingDescription(true);

    try {
      const description = await generateProductDescription({
        productName: formData.name,
        category: formData.commodity_type,
        existingDescription: formData.description || undefined,
      });

      setFormData((prev) => ({
        ...prev,
        description: description,
      }));

      showToast("Description generated successfully!", "success");
    } catch (err) {
      console.error("Error generating description:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate description";
      showToast(`AI Description Generation Error: ${errorMessage}`, "error");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.name.trim()) {
      showToast("Product name is required to generate image", "error");
      return;
    }

    setGeneratingImage(true);

    try {
      // Generate image using OpenAI DALL-E
      const result = await generateProductImage({
        productName: formData.name,
        category: formData.commodity_type,
        description: formData.description || undefined,
        style: "product", // Professional product photography style
        size: "1024x1024",
      });

      // Upload the generated image URL to EPCC Files
      const uploadResult = await createImageFile(result.imageUrl);

      if (uploadResult?.data) {
        const imageData = {
          url: uploadResult.data.link.href,
          alt: formData.name || "Generated product image",
          fileId: uploadResult.data.id,
        };

        setMainImage(imageData);
        showToast(
          "Product image generated and uploaded successfully!",
          "success"
        );
      } else {
        throw new Error("Failed to upload generated image");
      }
    } catch (err) {
      console.error("Error generating image:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate image";
      showToast(`AI Image Generation Error: ${errorMessage}`, "error");
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div>
      <div>
        {/* Form */}
        <form id="product-form" onSubmit={handleSubmit} className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Main Image
                </label>
                <p className="text-xs text-gray-500 mb-4">
                  {mode === "create"
                    ? "Upload an image to associate with this product. You can enter an image URL and it will be automatically uploaded and linked to the product."
                    : "Product image is displayed below. You can replace it by removing the current image and uploading a new one."}
                </p>
                <div className="relative">
                  <div className="w-full flex justify-center">
                    <img
                      src={
                        mainImage?.url ||
                        "https://placehold.co/400x400?text=Product+Image"
                      }
                      alt={mainImage?.alt || "Product Image"}
                      className="w-80 h-80 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-all duration-200 shadow-lg border border-gray-200 hover:shadow-xl"
                      onClick={() => setSelectedImage(mainImage)}
                    />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Image size: 400×400 pixels • Click to view larger
                  </p>
                </div>

                {/* Image Upload Section */}
                {!mainImage && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">
                      {mode === "create"
                        ? "Add Product Image"
                        : "Add or Replace Product Image"}
                    </h4>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                        className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={uploadingImage || !imageUrl.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {uploadingImage ? (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
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
                              ></circle>
                              <path
                                className="opacity-25"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Uploading...
                          </div>
                        ) : (
                          "Upload"
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-blue-600">
                      {mode === "create"
                        ? "Enter a valid image URL to upload and associate with this product"
                        : "Enter a valid image URL to replace the current product image"}
                    </p>

                    {/* AI Image Generation */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-blue-900">
                          AI Image Generation
                        </h5>
                        <button
                          type="button"
                          onClick={handleGenerateImage}
                          disabled={generatingImage || !formData.name.trim()}
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${
                            generatingImage || !formData.name.trim()
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          }`}
                        >
                          {generatingImage ? (
                            <>
                              <svg
                                className="animate-spin w-3 h-3 mr-1.5"
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
                              Generating...
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
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              AI Generate
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-blue-600">
                        Generate a professional product image using AI based on
                        the product name and description
                      </p>
                      {!formData.name.trim() && (
                        <p className="text-xs text-amber-600 mt-1">
                          💡 Enter a product name first to enable AI image
                          generation
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Management Section */}
                {mainImage && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900 mb-3">
                      Product Image
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={mainImage.url}
                          alt={mainImage.alt}
                          className="w-16 h-16 rounded-lg object-cover border border-green-200"
                        />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            {mainImage.alt}
                          </p>
                          <p className="text-xs text-green-600">
                            {mainImage.fileId
                              ? "Image uploaded successfully"
                              : "Image ready"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleReplaceImage}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Product Name */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Product Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                      placeholder="Enter product name"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* SKU and Slug Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      SKU *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="sku"
                        id="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 font-mono"
                        placeholder="PROD-001"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Slug
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="slug"
                        id="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                        placeholder="product-name"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        name="status"
                        id="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 appearance-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="live">Live</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Commodity Type
                    </label>
                    <div className="relative">
                      <select
                        name="commodity_type"
                        id="commodity_type"
                        value={formData.commodity_type}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 appearance-none"
                      >
                        <option value="physical">Physical</option>
                        <option value="digital">Digital</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Description
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={generatingDescription || !formData.name.trim()}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${
                        generatingDescription || !formData.name.trim()
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      }`}
                    >
                      {generatingDescription ? (
                        <>
                          <svg
                            className="animate-spin w-3 h-3 mr-1.5"
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
                          Generating...
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
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          AI Generate
                        </>
                      )}
                    </button>
                  </div>
                  {!formData.name.trim() && (
                    <p className="text-xs text-gray-500 mb-2">
                      💡 Enter a product name first to enable AI description
                      generation
                    </p>
                  )}
                  <div className="relative">
                    <textarea
                      name="description"
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                      placeholder="Enter product description..."
                    />
                    <div className="absolute top-3 right-3 pointer-events-none">
                      <svg
                        className="h-5 w-4 text-gray-400"
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        <div className="px-8 py-6 ">
          <div className="flex items-center justify-between">
            <div></div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {mode === "create" ? "Creating..." : "Saving..."}
                  </div>
                ) : (
                  <span>
                    {mode === "create" ? "Create Product" : "Save Changes"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Overlay */}
      {selectedImage && (
        <ImageOverlay
          imageUrl={selectedImage.url}
          altText={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};
