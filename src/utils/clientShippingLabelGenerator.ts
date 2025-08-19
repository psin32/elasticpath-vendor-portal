import { ShippingLabelData } from "../templates/shippingLabelTemplate";

export async function generateAndDownloadShippingLabel(
  data: ShippingLabelData
): Promise<void> {
  try {
    const response = await fetch("/api/generate-shipping-label", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to generate shipping label: ${response.statusText}`
      );
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shipping-label-${data.fulfillment.tracking_reference}.pdf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading shipping label:", error);
    throw error;
  }
}
