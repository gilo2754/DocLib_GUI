import { Page, expect, test } from '@playwright/test';

async function login(page: Page, returnTo = '') {
  await page.goto(`login${returnTo ? `?returnUrl=${encodeURIComponent(returnTo)}` : ''}`);
  await page.getByTestId('username').fill('demo');
  await page.getByTestId('password').fill('demo');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  // wait until the (simulated, delayed) login round-trip has completed
  await expect(page.getByTestId('current-user')).toHaveText('demo');
}

/** Answers the app's confirm dialog (not a native browser dialog). */
async function answerConfirm(page: Page, button: string) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: button }).click();
  await expect(dialog).toBeHidden();
}

test.describe('DocLib demo', () => {
  test('search from the landing page filters clinics', async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Arzttermine');
    await expect(page.getByText('Demo-Modus')).toBeVisible();

    await page.getByTestId('search-speciality').selectOption({ label: 'Kinderheilkunde' });
    await page.getByRole('button', { name: 'Suchen' }).click();

    await expect(page).toHaveURL(/clinics\?speciality=PEDIATRIA/);
    const cards = page.getByTestId('clinic-list').locator('.clinic-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText('Kinderheilkunde');
  });

  test('deep links work (GitHub Pages SPA fallback)', async ({ page }) => {
    await page.goto('clinics/3');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('DermaCare Santa Tecla');
  });

  test('protected pages redirect to login and back', async ({ page }) => {
    await page.goto('appointments');
    await expect(page).toHaveURL(/login\?returnUrl=%2Fappointments/);
    await page.getByRole('button', { name: 'übernehmen' }).click();
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Meine Termine' })).toBeVisible();
    await expect(page.getByTestId('current-user')).toHaveText('demo');
  });

  test('wrong credentials show an error', async ({ page }) => {
    await page.goto('login');
    await page.getByTestId('username').fill('demo');
    await page.getByTestId('password').fill('falsch');
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Passwort ist falsch');
  });

  test('book an appointment, see it in "Meine Termine" and cancel it', async ({ page }) => {
    await login(page, '/clinics/4');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gastro Centro San Miguel');

    const slot = page.locator('.slot').first();
    const time = (await slot.innerText()).trim();
    await slot.click();
    await page.getByTestId('book').click();
    await expect(page.getByTestId('booking-success')).toContainText(time);

    await page.getByRole('link', { name: 'Zu meinen Terminen' }).click();
    const row = page.getByTestId('upcoming').locator('li', { hasText: 'Gastro Centro San Miguel' });
    await expect(row).toContainText('Angefragt');

    // fail loudly if a native window.confirm() ever comes back
    page.on('dialog', () => {
      throw new Error('unexpected native browser dialog');
    });

    // "keep" leaves the appointment untouched
    await row.getByRole('button', { name: 'Stornieren' }).click();
    await expect(page.getByRole('dialog')).toContainText('Gastro Centro San Miguel');
    await answerConfirm(page, 'Termin behalten');
    await expect(row).toContainText('Angefragt');

    await row.getByRole('button', { name: 'Stornieren' }).click();
    await answerConfirm(page, 'Stornieren');
    await expect(row).toContainText('Storniert');
  });

  test('create, edit and delete a clinic', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Neue Praxis' }).click();

    await page.getByTestId('clinic-name').fill('E2E Praxis Bonn');
    await page.getByLabel('Beschreibung').fill('Angelegt durch Playwright');
    await page.getByLabel('Adresse').fill('Calle E2E 1, Santa Ana');
    await page.getByLabel('Telefon').fill('+503 2000-0000');
    await page.getByTestId('save').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('E2E Praxis Bonn');

    await page.goto('clinics?q=E2E');
    const card = page.locator('.clinic-card', { hasText: 'E2E Praxis Bonn' });
    await card.getByRole('link', { name: 'Bearbeiten' }).click();
    await expect(page.getByTestId('clinic-name')).toHaveValue('E2E Praxis Bonn');
    await page.getByTestId('clinic-name').fill('E2E Praxis Köln');
    await page.getByTestId('save').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('E2E Praxis Köln');

    await page.goto('clinics?q=E2E');
    await page
      .locator('.clinic-card', { hasText: 'E2E Praxis Köln' })
      .getByRole('button', { name: 'Löschen' })
      .click();
    await answerConfirm(page, 'Löschen');
    await expect(page.getByRole('status')).toContainText('gelöscht');
    await expect(page.locator('.clinic-card')).toHaveCount(0);
  });

  test('clinics with appointments cannot be deleted (backend rule)', async ({ page }) => {
    await login(page);
    await page.goto('clinics?q=Escal');
    await page.locator('.clinic-card').first().getByRole('button', { name: 'Löschen' }).click();
    await answerConfirm(page, 'Löschen');
    await expect(page.getByRole('status')).toContainText('offenen Terminen');
  });
});
