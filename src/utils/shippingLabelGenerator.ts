import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {
  generateShippingLabelHTML,
  type ShippingLabelData,
} from "../templates/shippingLabelTemplate";

export async function generateShippingLabelPDF(
  data: ShippingLabelData
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
    const htmlContent = generateShippingLabelHTML(data);

    // Set content and wait for it to load
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    // Wait for barcode to be generated (simple delay approach)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate PDF with shipping label dimensions
    const pdfBuffer = await page.pdf({
      width: "4in",
      height: "6in",
      printBackground: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating shipping label with Puppeteer:", error);
    throw new Error(
      `Failed to generate shipping label: ${
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
