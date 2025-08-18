import jsPDF from "jspdf";

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

export function generatePackingSlip(data: PackingSlipData): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Colors
  const primaryColor = "#4F46E5"; // Indigo
  const grayColor = "#6B7280";
  const lightGrayColor = "#F3F4F6";

  let yPosition = 20;

  // Header
  pdf.setFillColor(79, 70, 229); // Indigo background
  pdf.rect(0, 0, pageWidth, 40, "F");

  // Company logo/name area
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.companyInfo?.name || "Your Company", 20, 25);

  // Packing Slip title
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "normal");
  pdf.text("PACKING SLIP", pageWidth - 20, 25, { align: "right" });

  yPosition = 60;

  // Order Information Section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Order Information", 20, yPosition);

  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(107, 114, 128);

  // Order details in two columns
  const leftColumn = 20;
  const rightColumn = pageWidth / 2 + 10;

  pdf.text(`Order ID: ${data.order.id}`, leftColumn, yPosition);
  pdf.text(`Fulfillment ID: ${data.fulfillment.id}`, rightColumn, yPosition);

  yPosition += 12;
  pdf.text(
    `Order Date: ${new Date(
      data.order.meta.timestamps.created_at
    ).toLocaleDateString()}`,
    leftColumn,
    yPosition
  );
  pdf.text(
    `Fulfillment Date: ${new Date(
      data.fulfillment.created_at
    ).toLocaleDateString()}`,
    rightColumn,
    yPosition
  );

  yPosition += 12;
  pdf.text(`Order Status: ${data.order.status}`, leftColumn, yPosition);
  pdf.text(`Payment Status: ${data.order.payment}`, rightColumn, yPosition);

  if (data.fulfillment.tracking_reference) {
    yPosition += 12;
    pdf.text(
      `Tracking Number: ${data.fulfillment.tracking_reference}`,
      leftColumn,
      yPosition
    );
  }

  if (data.fulfillment.shipping_method) {
    pdf.text(
      `Shipping Method: ${data.fulfillment.shipping_method}`,
      rightColumn,
      yPosition
    );
  }

  yPosition += 25;

  // Shipping Address Section
  if (data.shippingAddress) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Ship To:", 20, yPosition);

    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);

    const address = data.shippingAddress;
    if (address.first_name || address.last_name) {
      pdf.text(
        `${address.first_name || ""} ${address.last_name || ""}`.trim(),
        20,
        yPosition
      );
      yPosition += 12;
    }

    if (address.company_name) {
      pdf.text(address.company_name, 20, yPosition);
      yPosition += 12;
    }

    if (address.line_1) {
      pdf.text(address.line_1, 20, yPosition);
      yPosition += 12;
    }

    if (address.line_2) {
      pdf.text(address.line_2, 20, yPosition);
      yPosition += 12;
    }

    const cityStateZip = `${address.city || ""} ${address.region || ""} ${
      address.postcode || ""
    }`.trim();
    if (cityStateZip) {
      pdf.text(cityStateZip, 20, yPosition);
      yPosition += 12;
    }

    if (address.country) {
      pdf.text(address.country, 20, yPosition);
      yPosition += 12;
    }

    yPosition += 15;
  }

  // Items Table
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Items to Ship", 20, yPosition);

  yPosition += 15;

  // Table header
  pdf.setFillColor(243, 244, 246); // Light gray background
  pdf.rect(20, yPosition - 8, pageWidth - 40, 20, "F");

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 0, 0);

  const col1 = 25; // SKU
  const col2 = 80; // Product Name
  const col3 = pageWidth - 80; // Quantity

  pdf.text("SKU", col1, yPosition);
  pdf.text("Product Name", col2, yPosition);
  pdf.text("Qty", col3, yPosition, { align: "center" });

  yPosition += 15;

  // Table rows
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(107, 114, 128);

  data.fulfillment.items.forEach((fulfillmentItem, index) => {
    const orderItem = data.orderItems.find(
      (item) => item.id === fulfillmentItem.id
    );

    if (orderItem) {
      // Add background for alternating rows
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(20, yPosition - 8, pageWidth - 40, 15, "F");
      }

      pdf.text(orderItem.sku || "N/A", col1, yPosition);

      // Handle long product names
      const productName = orderItem.name || `Item ${orderItem.id}`;
      const maxWidth = col3 - col2 - 20;
      const splitName = pdf.splitTextToSize(productName, maxWidth);
      pdf.text(splitName[0], col2, yPosition);

      pdf.text(fulfillmentItem.quantity.toString(), col3, yPosition, {
        align: "center",
      });

      yPosition += 15;

      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 30;
      }
    }
  });

  yPosition += 20;

  // Notes section
  if (data.fulfillment.notes) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Notes:", 20, yPosition);

    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);

    const notesLines = pdf.splitTextToSize(
      data.fulfillment.notes,
      pageWidth - 40
    );
    pdf.text(notesLines, 20, yPosition);

    yPosition += notesLines.length * 6 + 15;
  }

  // Footer
  const footerY = pageHeight - 30;
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text(`Generated on ${new Date().toLocaleString()}`, 20, footerY);

  if (data.companyInfo?.email || data.companyInfo?.phone) {
    const contactInfo = [];
    if (data.companyInfo.email)
      contactInfo.push(`Email: ${data.companyInfo.email}`);
    if (data.companyInfo.phone)
      contactInfo.push(`Phone: ${data.companyInfo.phone}`);
    pdf.text(contactInfo.join(" | "), pageWidth - 20, footerY, {
      align: "right",
    });
  }

  // Save the PDF
  const fileName = `packing-slip-${data.order.id}-${data.fulfillment.id}.pdf`;
  pdf.save(fileName);
}

// Utility function to format currency
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount / 100); // Assuming amounts are in cents
}
