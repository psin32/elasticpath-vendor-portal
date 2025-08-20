export interface GenerateDescriptionRequest {
  productName: string;
  category?: string;
  attributes?: Record<string, any>;
  existingDescription?: string;
}

export interface GenerateDescriptionResponse {
  description: string;
  success: boolean;
}

export async function generateProductDescription(
  data: GenerateDescriptionRequest
): Promise<string> {
  try {
    const response = await fetch("/api/generate-description", {
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

    const result: GenerateDescriptionResponse = await response.json();

    if (!result.success || !result.description) {
      throw new Error("Failed to generate description");
    }

    return result.description;
  } catch (error) {
    console.error("Error generating product description:", error);
    throw error;
  }
}
