import { NextRequest, NextResponse } from "next/server";
import { generatePackingSlipPDF } from "../../../utils/puppeteerPackingSlipGenerator";
import { type PackingSlipData } from "../../../utils/clientPackingSlipGenerator";

export async function POST(request: NextRequest) {
  try {
    const data: PackingSlipData = await request.json();

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePackingSlipPDF(data);

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="packing-slip-${data.order.id}-${data.fulfillment.id}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating packing slip:", error);
    return NextResponse.json(
      { error: "Failed to generate packing slip" },
      { status: 500 }
    );
  }
}
