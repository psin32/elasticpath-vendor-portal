import { NextRequest, NextResponse } from "next/server";
import { generateShippingLabelPDF } from "../../../utils/shippingLabelGenerator";
import { ShippingLabelData } from "../../../templates/shippingLabelTemplate";

export async function POST(request: NextRequest) {
  try {
    const data: ShippingLabelData = await request.json();

    // Validate required data
    if (!data.fulfillment?.tracking_reference) {
      return NextResponse.json(
        { error: "Tracking reference is required" },
        { status: 400 }
      );
    }

    // Generate the shipping label PDF
    const pdfBuffer = await generateShippingLabelPDF(data);

    // Return the PDF
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="shipping-label-${data.fulfillment.tracking_reference}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating shipping label:", error);
    return NextResponse.json(
      {
        error: "Failed to generate shipping label",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
