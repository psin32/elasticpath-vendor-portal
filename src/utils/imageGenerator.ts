export interface GenerateImageRequest {
  productName: string;
  category?: string;
  description?: string;
  style?: "product" | "lifestyle" | "minimalist";
  size?: "1024x1024" | "1024x1792" | "1792x1024";
}

export interface GenerateImageResponse {
  imageUrl: string;
  prompt: string;
  success: boolean;
}

export async function generateProductImage(
  data: GenerateImageRequest
): Promise<GenerateImageResponse> {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result: GenerateImageResponse = await response.json();

    if (!result.success || !result.imageUrl) {
      throw new Error("Failed to generate image");
    }

    return result;
  } catch (error) {
    console.error("Error generating product image:", error);
    throw error;
  }
}

// Utility function to download image from URL and convert to File object
export async function downloadImageAsFile(
  imageUrl: string,
  filename: string
): Promise<File> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to download image");
    }

    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}
