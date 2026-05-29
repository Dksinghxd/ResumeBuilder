import { resolveBrowserExecutable } from '../dist/utils/browserPath.js';
import { renderHtmlToPdfBuffer } from '../dist/services/htmlToPdf.js';

const browser = resolveBrowserExecutable();
console.log('browser:', browser);
if (!browser) process.exit(1);

const html = `<!DOCTYPE html><html><body style="background:#0d9488;color:#fff;padding:40px;font-family:Segoe UI,sans-serif"><h1>Styled PDF Test</h1><p>Teal background should appear in export.</p></body></html>`;
const buf = await renderHtmlToPdfBuffer(html);
console.log('pdf bytes:', buf.length);
console.log('magic:', buf.slice(0, 5).toString());
