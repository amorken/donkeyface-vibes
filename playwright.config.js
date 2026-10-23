import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.browser.spec.js', workers: 1,
  timeout: 30000,
  webServer: {
    command: 'node scripts/serve.mjs --port 4173',
    url: 'http://127.0.0.1:4173/Donkey-Face.html',
    reuseExistingServer: false,
  },
  use: {
    headless: true, viewport: { width: 1440, height: 1000 },
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] },
  },
});
