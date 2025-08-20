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
    const { productName, category, attributes, existingDescription } = body;

    // Validate required fields
    if (!productName || !productName.trim()) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Build context for the AI prompt
    let context = `Product Name: ${productName}`;

    if (category) {
      context += `\nCategory: ${category}`;
    }

    if (attributes && Object.keys(attributes).length > 0) {
      context += `\nAttributes: ${JSON.stringify(attributes, null, 2)}`;
    }

    // Create the prompt
    const prompt = existingDescription
      ? `Please improve and enhance the following product description based on the product details provided. Make it more engaging, informative, and sales-focused while maintaining accuracy:

${context}

Current Description:
${existingDescription}

Please provide an improved product description:`
      : `Please create a compelling and informative product description based on the following product details. The description should be engaging, highlight key features and benefits, and be suitable for e-commerce:

${context}

Please provide a professional product description:`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional copywriter specializing in e-commerce product descriptions. Create compelling, accurate, and sales-focused descriptions that highlight product features and benefits. Keep descriptions concise but informative, typically 2-4 paragraphs.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const description = completion.choices[0]?.message?.content?.trim();

    if (!description) {
      return NextResponse.json(
        { error: "Failed to generate description" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      description,
      success: true,
    });
  } catch (error) {
    console.error("Error generating description:", error);

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
    }

    return NextResponse.json(
      {
        error: "Failed to generate description",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
