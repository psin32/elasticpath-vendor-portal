import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { generatePackingSlipHTML } from "../templates/packingSlipTemplate";

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

export async function generatePackingSlipPDF(
  data: PackingSlipData
): Promise<Buffer> {
  let browser;

  try {
    // Determine if running in serverless environment (Vercel)
    const isServerless =
      process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

    // Launch browser with environment-appropriate configuration
    if (isServerless) {
      // Serverless configuration (Vercel/AWS)
      browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
        defaultViewport: { width: 1280, height: 720 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      // Local development configuration
      try {
        // Try to use local Chrome installation
        const puppeteerFull = await import("puppeteer");
        browser = await puppeteerFull.default.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
          ],
        });
      } catch (localError) {
        // Fallback to puppeteer-core with system Chrome
        console.warn("Full puppeteer not available, using puppeteer-core");
        browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
          ],
        });
      }
    }

    const page = await browser.newPage();

    // Generate HTML content
    const htmlContent = generatePackingSlipHTML(data);

    // Set content and wait for it to load
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF with Puppeteer:", error);
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Utility function to format currency (keeping for compatibility)
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount / 100); // Assuming amounts are in cents
}
