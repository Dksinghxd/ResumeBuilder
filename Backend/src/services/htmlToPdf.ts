import puppeteer from 'puppeteer-core';
import logger from '../utils/logger.js';
import { resolveBrowserExecutable } from '../utils/browserPath.js';

let browserInstance: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

async function getBrowser() {
  const executablePath = resolveBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      'No Chrome or Edge found for PDF rendering. Install Google Chrome or set PUPPETEER_EXECUTABLE_PATH in Backend/.env'
    );
  }

  if (browserInstance?.connected) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  });

  browserInstance.on('disconnected', () => {
    browserInstance = null;
  });

  return browserInstance;
}

export async function renderHtmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await new Promise((r) => setTimeout(r, 300));

    const pdfUint8 = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(pdfUint8);
  } finally {
    await page.close().catch(() => undefined);
  }
}

export async function closePdfBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => undefined);
    browserInstance = null;
    logger.info('PDF browser closed');
  }
}
