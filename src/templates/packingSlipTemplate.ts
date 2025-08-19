import { PackingSlipData } from "../utils/clientPackingSlipGenerator";

export function generatePackingSlipHTML(data: PackingSlipData): string {
  const totalItems = data.fulfillment.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Packing Slip - ${data.order.id}</title>
    <style>
        @page {
            margin: 0;
            size: A4;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            color: #1a1a1a;
            font-size: 10px;
            line-height: 1.6;
            background: #ffffff;
        }
        
        /* Content wrapper with proper margins */
        .page-content {
            margin: 0;
            padding: 0;
        }
        
        .main-content {
            padding: 5mm;
        }
        
        /* Header Section - Simplified */
        .header {
            background: #2563eb;
            color: white;
            padding: 10px;
            margin: 0 0 30px 0;
            border-bottom: 4px solid #1d4ed8;
            box-sizing: border-box;
            width: 100%;
        }
        
        .header-content {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .company-logo {
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.4);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -1px;
            flex-shrink: 0;
        }
        
        .company-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .company-info h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: white;
        }
        
        .company-address {
            font-size: 12px;
            opacity: 0.9;
            margin: 0;
            font-weight: 400;
            color: rgba(255,255,255,0.9);
            line-height: 1.4;
        }
        
        /* Alert Banner */
        .alert-banner {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .alert-icon {
            color: #d97706;
            font-size: 16px;
        }
        
        .alert-text {
            color: #92400e;
            font-weight: 600;
            font-size: 11px;
        }
        
        /* Main Content Grid */
        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
        }
        
        .info-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 18px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f3f4f6;
        }
        
        .card-icon {
            width: 20px;
            height: 20px;
            background: #3b82f6;
            color: white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
        }
        
        .card-title {
            font-size: 14px;
            font-weight: 700;
            color: #1f2937;
            margin: 0;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            min-height: 18px;
        }
        
        .info-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            min-width: 80px;
        }
        
        .info-value {
            color: #1f2937;
            font-weight: 500;
            text-align: right;
            flex: 1;
            font-size: 10px;
        }
        
        .tracking-highlight {
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-weight: 600;
        }
        
        /* Shipping Address */
        .address-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 18px;
        }
        
        .address-lines {
            line-height: 1.7;
        }
        
        .address-line {
            color: #374151;
            margin-bottom: 3px;
        }
        
        .address-name {
            font-weight: 700;
            color: #1f2937;
            font-size: 11px;
        }
        
        .address-company {
            font-weight: 600;
            color: #4b5563;
            font-style: italic;
        }
        
        /* Items Section */
        .items-section {
            margin-top: 30px;
            padding: 5mm;
        }
        
        .items-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 15px 0;
            border-bottom: 3px solid #e5e7eb;
        }
        
        .items-title {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin: 0;
        }
        
        .items-summary {
            display: flex;
            gap: 20px;
            font-size: 10px;
        }
        
        .summary-item {
            display: flex;
            align-items: center;
            gap: 5px;
            color: #6b7280;
            font-weight: 600;
        }
        
        .summary-value {
            color: #1f2937;
            background: #f3f4f6;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 700;
        }
        
        /* Enhanced Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            background: white;
        }
        
        .items-table thead {
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        }
        
        .items-table th {
            padding: 12px 15px;
            text-align: left;
            font-weight: 700;
            font-size: 9px;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
        }
        
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 10px;
            vertical-align: top;
        }
        
        .items-table tbody tr {
            transition: background-color 0.2s ease;
        }
        
        .items-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        .items-table tbody tr:hover {
            background-color: #f3f4f6;
        }
        
        .sku-col {
            width: 120px;
            font-family: 'Courier New', monospace;
            font-weight: 600;
        }
        
        .product-col {
            min-width: 250px;
        }
        
        .qty-col {
            width: 80px;
            text-align: center;
            font-weight: 700;
        }
        
        .status-col {
            width: 100px;
            text-align: center;
        }
        
        .product-name {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
            line-height: 1.4;
        }
        
        .product-description {
            color: #6b7280;
            font-size: 9px;
            line-height: 1.3;
        }
        
        .quantity-badge {
            background: #3b82f6;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
        }
        
        .status-badge {
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 8px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        /* Notes Section */
        .notes-section {
            margin-top: 25px;
            background: #fef7cd;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 18px;
            position: relative;
        }
        
        .notes-section::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: #f59e0b;
            border-radius: 8px 0 0 8px;
        }
        
        .notes-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        
        .notes-icon {
            color: #d97706;
            font-size: 14px;
        }
        
        .notes-title {
            font-size: 12px;
            font-weight: 700;
            color: #92400e;
            margin: 0;
        }
        
        .notes-content {
            color: #78350f;
            line-height: 1.6;
            font-size: 10px;
        }
        
        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            padding-left: 5mm;
            padding-right: 5mm;
            border-top: 2px solid #e5e7eb;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 9px;
            color: #6b7280;
        }
        
        .footer-section h4 {
            font-size: 10px;
            font-weight: 700;
            color: #374151;
            margin: 0 0 8px 0;
        }
        
        .footer-contact {
            text-align: right;
        }
        
        .qr-placeholder {
            width: 60px;
            height: 60px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 8px;
            text-align: center;
            line-height: 1.2;
        }
        
        /* Print Optimizations */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .items-table tbody tr:hover {
                background-color: transparent !important;
            }
            
            .info-card,
            .items-table {
                break-inside: avoid;
            }
        }
        
        /* Responsive Design */
        @media (max-width: 600px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .header-content {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <!-- Simplified Header -->
    <div class="header">
        <div class="header-content">
            <div class="company-logo">
                ${(data.companyInfo?.name || "YC")
                  .substring(0, 2)
                  .toUpperCase()}
            </div>
            <div class="company-info">
                <h1>${data.companyInfo?.name || "Your Company"}</h1>
                <p class="company-address">
                  ${data.companyInfo?.address || "Business Address"}
                </p>
            </div>
        </div>
    </div>

    <!-- Page Content with Proper Margins -->
    <div class="main-content">
        

        <!-- Content Grid -->
        <!-- Order Information Card -->
        <div class="info-card">
            <div class="card-header">
                <h3 class="card-title">Order Details</h3>
            </div>
            <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">${data.order.id}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Order Date</span>
                <span class="info-value">${new Date(
                  data.order.meta.timestamps.created_at
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}</span>
            </div>
            ${
              data.fulfillment.tracking_reference
                ? `
            <div class="info-row">
                <span class="info-label">Tracking</span>
                <span class="info-value">${data.fulfillment.tracking_reference}</span>
            </div>
            `
                : ""
            }
            ${
              data.fulfillment.shipping_method
                ? `
            <div class="info-row">
                <span class="info-label">Shipping</span>
                <span class="info-value">${data.fulfillment.shipping_method}</span>
            </div>
            `
                : ""
            }
        </div>

        <!-- Shipping Address Card -->
        ${
          data.shippingAddress
            ? `
        <div class="address-card">
            <div class="card-header">
                <h3 class="card-title">Ship To</h3>
            </div>
            <div class="address-lines">
                ${
                  data.shippingAddress.first_name ||
                  data.shippingAddress.last_name
                    ? `
                <div class="address-line address-name">
                    ${data.shippingAddress.first_name || ""} ${
                        data.shippingAddress.last_name || ""
                      }
                </div>
                `
                    : ""
                }
                ${
                  data.shippingAddress.company_name
                    ? `
                <div class="address-line address-company">${data.shippingAddress.company_name}</div>
                `
                    : ""
                }
                ${
                  data.shippingAddress.line_1
                    ? `
                <div class="address-line">${data.shippingAddress.line_1}</div>
                `
                    : ""
                }
                ${
                  data.shippingAddress.line_2
                    ? `
                <div class="address-line">${data.shippingAddress.line_2}</div>
                `
                    : ""
                }
                ${
                  data.shippingAddress.city ||
                  data.shippingAddress.region ||
                  data.shippingAddress.postcode
                    ? `
                <div class="address-line">
                    ${data.shippingAddress.city || ""} ${
                        data.shippingAddress.region || ""
                      } ${data.shippingAddress.postcode || ""}
                </div>
                `
                    : ""
                }
                ${
                  data.shippingAddress.country
                    ? `
                <div class="address-line"><strong>${data.shippingAddress.country}</strong></div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }
    </div>

    <!-- Items Section -->
    <div class="items-section">
        <div class="items-header">
            <h3 class="items-title">Items to Ship</h3>
            <div class="items-summary">
                <div class="summary-item">
                    <span>Items:</span>
                    <span class="summary-value">${
                      data.fulfillment.items.length
                    }</span>
                </div>
                <div class="summary-item">
                    <span>Total Qty:</span>
                    <span class="summary-value">${totalItems}</span>
                </div>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th class="sku-col">SKU / Code</th>
                    <th class="product-col">Product Details</th>
                    <th class="qty-col">Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${data.fulfillment.items
                  .map((fulfillmentItem, index) => {
                    const orderItem = data.orderItems.find(
                      (item) => item.id === fulfillmentItem.id
                    );
                    if (!orderItem) return "";

                    return `
                    <tr>
                        <td class="sku-col">${orderItem.sku || "N/A"}</td>
                        <td class="product-col">
                            <div class="product-name">${
                              orderItem.name || `Item ${orderItem.id}`
                            }</div>
                        </td>
                        <td class="qty-col">
                            <span class="quantity-badge">${
                              fulfillmentItem.quantity
                            }</span>
                        </td>
                    </tr>
                    `;
                  })
                  .join("")}
            </tbody>
        </table>
    </div>

    <!-- Notes Section -->
    ${
      data.fulfillment.notes
        ? `
    <div class="notes-section">
        <div class="notes-header">
            <span class="notes-icon">📝</span>
            <h4 class="notes-title">Special Instructions</h4>
        </div>
        <div class="notes-content">${data.fulfillment.notes}</div>
    </div>
    `
        : ""
    }

    <!-- Footer -->
    <div class="footer">
        <div class="footer-section">
            <h4>Generated Information</h4>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>System: ElasticPath Admin Portal</p>
            <p>Version: 1.0</p>
        </div>
        <div class="footer-section footer-contact">
            <h4>Contact Information</h4>
            ${
              data.companyInfo?.email
                ? `<p>Email: ${data.companyInfo.email}</p>`
                : ""
            }
            ${
              data.companyInfo?.phone
                ? `<p>Phone: ${data.companyInfo.phone}</p>`
                : ""
            }
        </div>
    </div>
    <!-- End of main-content wrapper -->
    </div>
</body>
</html>
  `;
}
