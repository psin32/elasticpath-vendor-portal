import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      productName,
      category,
      description,
      style = "product",
      size = "1024x1024",
    } = body;

    // Validate required fields
    if (!productName || !productName.trim()) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Build the image generation prompt
    let prompt = `A professional product photography image of ${productName}`;

    if (category) {
      prompt += ` (${category})`;
    }

    // Add style specifications
    switch (style) {
      case "product":
        prompt +=
          ", clean white background, professional product, studio lighting, high quality, commercial style";
        break;
      case "lifestyle":
        prompt +=
          ", lifestyle photography, in use, realistic setting, natural lighting, professional photography";
        break;
      case "minimalist":
        prompt +=
          ", minimalist style, clean background, simple composition, modern aesthetic";
        break;
      default:
        prompt += ", professional photography, high quality";
    }

    // Add description context if available
    if (description && description.length > 0) {
      // Extract key features from description (first 100 chars for context)
      const descriptionContext = description.substring(0, 100);
      prompt += `. Product details: ${descriptionContext}`;
    }

    // Ensure prompt doesn't exceed limits and is clear
    prompt += ". No text, logos, or branding in the image.";

    // Call OpenAI DALL-E API
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size as "1024x1024" | "1024x1792" | "1792x1024",
      quality: "standard",
      style: "natural", // Use natural style for product images
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Return the image URL
    return NextResponse.json({
      imageUrl,
      prompt: prompt,
      success: true,
    });
  } catch (error) {
    console.error("Error generating image:", error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key" },
          { status: 401 }
        );
      }

      if (error.message.includes("quota")) {
        return NextResponse.json(
          { error: "OpenAI API quota exceeded" },
          { status: 429 }
        );
      }

      if (error.message.includes("content_policy")) {
        return NextResponse.json(
          { error: "Image generation request violates content policy" },
          { status: 400 }
        );
      }

      if (error.message.includes("rate_limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
