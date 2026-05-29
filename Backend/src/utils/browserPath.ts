import fs from 'fs';
import path from 'path';

const CANDIDATE_BROWSERS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean) as string[];

export function resolveBrowserExecutable(): string | null {
  for (const candidate of CANDIDATE_BROWSERS) {
    try {
      if (fs.existsSync(candidate)) {
        return path.normalize(candidate);
      }
    } catch {
      // ignore invalid paths
    }
  }
  return null;
}
