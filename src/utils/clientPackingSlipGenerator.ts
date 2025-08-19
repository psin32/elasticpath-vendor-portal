export interface PackingSlipData {
  order: {
    id: string;
    status: string;
    payment: string;
    meta: {
      timestamps: {
        created_at: string;
      };
    };
  };
  fulfillment: {
    id: string;
    tracking_reference?: string;
    shipping_method?: string;
    notes?: string;
    created_at: string;
    items: Array<{
      id: string;
      quantity: number;
    }>;
  };
  orderItems: Array<{
    id: string;
    name?: string;
    sku?: string;
    quantity: number;
    unit_price?: {
      amount: number;
      currency: string;
    };
  }>;
  companyInfo?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  shippingAddress?: {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    county?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
}

export async function generateAndDownloadPackingSlip(
  data: PackingSlipData
): Promise<void> {
  try {
    // Call the API route to generate PDF
    const response = await fetch("/api/generate-packing-slip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`);
    }

    // Get PDF blob from response
    const pdfBlob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `packing-slip-${data.order.id}-${data.fulfillment.id}.pdf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading packing slip:", error);
    throw error;
  }
}

// Utility function to format currency (keeping for compatibility)
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount / 100); // Assuming amounts are in cents
}
