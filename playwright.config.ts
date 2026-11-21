import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;

/**
 * End-to-end tests against the *production* build served like GitHub Pages
 * (base href /DocLib_GUI/, simulated API). Run `npm run build:pages` first.
 * Locally the installed Chrome is used; CI installs Playwright's Chromium.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/DocLib_GUI/`,
    locale: 'de-DE',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env['CI'] ? undefined : 'chrome' },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], channel: process.env['CI'] ? undefined : 'chrome' },
    },
  ],
  webServer: {
    command: 'node scripts/serve-dist.mjs',
    url: `http://localhost:${PORT}/DocLib_GUI/`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env['CI'],
  },
});
