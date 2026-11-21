// Captures README screenshots from the production build (run `npm run build:pages` first).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const server = spawn(process.execPath, ['scripts/serve-dist.mjs'], {
  env: { ...process.env, PORT: '4310' },
});
await new Promise((r) => setTimeout(r, 800));
const base = 'http://localhost:4310/DocLib_GUI/';
const browser = await chromium.launch({ channel: process.env.CI ? undefined : 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'de-DE' });
const shot = (name) => page.screenshot({ path: `docs/screenshots/${name}.png` });
try {
  await page.goto(base);
  await shot('01-home');
  await page.goto(base + 'clinics?speciality=DERMATOLOGIA');
  await page.locator('.clinic-card').first().waitFor();
  await page.goto(base + 'login?returnUrl=%2Fclinics%2F1');
  await page.getByRole('button', { name: 'übernehmen' }).click();
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await page.locator('.slot').first().waitFor();
  await page.locator('.slot').nth(3).click();
  await shot('03-booking');
  await page.goto(base + 'clinics');
  await page.locator('.clinic-card').first().waitFor();
  await shot('02-clinics');
  await page.goto(base + 'appointments');
  await page.getByTestId('upcoming').waitFor();
  await shot('04-appointments');
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  await mobile.goto(base + 'clinics');
  await mobile.locator('.clinic-card').first().waitFor();
  await mobile.screenshot({ path: 'docs/screenshots/05-mobile.png' });
} finally {
  await browser.close();
  server.kill();
}
