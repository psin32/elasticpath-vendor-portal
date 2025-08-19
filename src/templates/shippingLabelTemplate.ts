export interface ShippingLabelData {
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
    tracking_reference: string;
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

export function generateShippingLabelHTML(data: ShippingLabelData): string {
  // Generate barcode SVG using inline JavaScript (will be executed in browser context)
  const barcodeScript = `
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        if (typeof JsBarcode !== 'undefined') {
          JsBarcode("#barcode", "${data.fulfillment.tracking_reference}", {
            format: "CODE128",
            width: 2,
            height: 80,
            displayValue: true,
            fontSize: 14,
            margin: 10
          });
        }
      });
    </script>
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shipping Label - ${data.fulfillment.tracking_reference}</title>
    <style>
        @page {
            margin: 0;
            size: 4in 6in;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
            font-size: 10px;
            line-height: 1.2;
            background: #ffffff;
            width: 4in;
            height: 6in;
            overflow: hidden;
        }
        
        .label-container {
            width: 100%;
            height: 100%;
            padding: 0.2in;
            display: flex;
            flex-direction: column;
        }
        
        /* Header Section */
        .header {
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
        }
        
        .company-info {
            text-align: center;
        }
        
        .company-name {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 2px 0;
        }
        
        .company-address {
            font-size: 9px;
            margin: 0;
            line-height: 1.3;
        }
        
        /* Ship To Section */
        .ship-to {
            margin-bottom: 12px;
        }
        
        .ship-to-header {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
        }
        
        .ship-to-address {
            font-size: 12px;
            line-height: 1.4;
            font-weight: bold;
        }
        
        .ship-to-name {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        /* Barcode Section */
        .barcode-section {
            margin: 12px 0;
            text-align: center;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .barcode-container {
            margin: 8px 0;
        }
        
        .tracking-number {
            font-size: 16px;
            font-weight: bold;
            margin-top: 4px;
            letter-spacing: 1px;
        }
        
        /* Service Info */
        .service-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 9px;
        }
        
        .service-type {
            font-weight: bold;
        }
        
        .order-info {
            font-size: 8px;
            color: #666;
        }
        
        /* Footer */
        .footer {
            border-top: 1px solid #000;
            padding-top: 4px;
            margin-top: auto;
            font-size: 8px;
            text-align: center;
            color: #666;
        }
        
        /* Utility classes */
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        
        /* Print optimizations */
        @media print {
            body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .label-container {
                page-break-inside: avoid;
            }
        }
    </style>
    ${barcodeScript}
</head>
<body>
    <div class="label-container">
        <!-- Header with Company Info -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">${
                  data.companyInfo?.name || "Your Company"
                }</div>
                <div class="company-address">${
                  data.companyInfo?.address || "Business Address"
                }</div>
            </div>
        </div>
        
        <!-- Service Information -->
        <div class="service-info">
            <div class="service-type">${
              data.fulfillment.shipping_method || "Standard Shipping"
            }</div>
            <div class="order-info">Order: ${data.order.id}</div>
        </div>
        
        <!-- Ship To Address -->
        <div class="ship-to">
            <div class="ship-to-header">Ship To:</div>
            <div class="ship-to-address">
                <div class="ship-to-name">
                    ${data.shippingAddress?.first_name || ""} ${
    data.shippingAddress?.last_name || ""
  }
                </div>
                ${
                  data.shippingAddress?.company_name
                    ? `<div>${data.shippingAddress.company_name}</div>`
                    : ""
                }
                <div>${data.shippingAddress?.line_1 || ""}</div>
                ${
                  data.shippingAddress?.line_2
                    ? `<div>${data.shippingAddress.line_2}</div>`
                    : ""
                }
                <div>
                    ${data.shippingAddress?.city || ""}, ${
    data.shippingAddress?.region || ""
  } ${data.shippingAddress?.postcode || ""}
                </div>
                <div>${data.shippingAddress?.country || ""}</div>
            </div>
        </div>
        
        <!-- Barcode Section -->
        <div class="barcode-section">
            <div class="barcode-container">
                <svg id="barcode"></svg>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div>Generated: ${new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</div>
        </div>
    </div>
</body>
</html>
  `;
}
