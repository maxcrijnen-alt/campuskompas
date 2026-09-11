import { test, expect } from '@playwright/test';
for (const width of [1280, 320])
  test(`clickable opening hours work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const search = page.getByRole('textbox', {
      name: 'Zoek lokaal of voorziening',
    });
    await search.fill('bibliotheek');
    await page.getByRole('button', { name: /Bibliotheek.*R8.*0\.25/i }).click();
    const hours = page.getByRole('region', {
      name: 'Locatiedetails',
      exact: true,
    });
    await expect(
      hours.getByRole('heading', { name: 'Bibliotheek' }),
    ).toBeFocused();
    await hours.getByText('Openingstijden bekijken').click();
    await expect(hours.getByText('08:30–17:00', { exact: true })).toHaveCount(
      5,
    );
    await expect(hours.getByText('Gesloten', { exact: true })).toHaveCount(2);
    await expect(hours.locator('.opening-week .today')).toContainText(
      'Vandaag',
    );
    await expect(
      hours.getByRole('link', { name: /Bron bekijken/ }),
    ).toHaveAttribute('href', /nhlstenden.com\/bibliotheek/);
    await page.getByRole('button', { name: 'Details sluiten' }).click();
    await search.fill('cafe if');
    await page.getByRole('button', { name: /Café IF.*R8/i }).click();
    await expect(hours).toContainText('nog niet bevestigd');
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(
      page.getByRole('region', { name: 'Location details', exact: true }),
    ).toContainText('not confirmed');
  });
