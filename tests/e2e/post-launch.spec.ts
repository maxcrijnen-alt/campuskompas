import { test, expect } from '@playwright/test';

test('Study Info navigation, search ranking, sources and empty state work in Dutch and English', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page
    .locator('.bottom-nav')
    .getByRole('link', { name: 'Studie-info', exact: true })
    .click();
  await expect(page).toHaveURL(/\/study-info$/);
  const search = page.getByRole('searchbox', {
    name: 'Zoek studie-informatie',
  });
  await expect(search).toBeVisible();
  await search.fill('examencommissie');
  await expect(page.locator('.study-info-card h2').first()).toHaveText(
    'Examencommissie',
  );
  const officialSource = page
    .locator('.study-info-card')
    .first()
    .getByRole('link', { name: /Bekijk officiële bron/ });
  await expect(officialSource).toHaveAttribute(
    'href',
    'https://www.nhlstenden.com/rechten-en-plichten-tijdens-je-studie',
  );
  await expect(officialSource).toHaveAttribute('target', '_blank');

  await search.fill('bestaatniet-qa');
  await expect(
    page.getByRole('heading', { name: 'Geen informatie gevonden' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Student Info/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(
    page.getByRole('searchbox', { name: 'Search study information' }),
  ).toBeVisible();
  await page
    .getByRole('searchbox', { name: 'Search study information' })
    .fill('exam board');
  await expect(page.locator('.study-info-card h2').first()).toHaveText(
    'Examination board',
  );
});

test('Campus Tour is a bilingual external First-year tip that fits mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/tips');
  await expect(page.getByText('Scan. Zoek. Op weg.')).toHaveCount(0);
  const card = page
    .locator('article')
    .filter({ hasText: 'Ontdek de campus met een Campus Tour' });
  await expect(card).toBeVisible();
  const link = card.getByRole('link', { name: /Bekijk Campus Tour/ });
  await expect(link).toHaveAttribute(
    'href',
    'https://www.nhlstenden.com/hulp-bij-studiekeuze/campustour',
  );
  await expect(link).toHaveAttribute('target', '_blank');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Discover the campus with a Campus Tour',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /View Campus Tour/ }),
  ).toBeVisible();
});
