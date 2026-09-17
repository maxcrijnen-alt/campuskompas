import { test, expect } from '@playwright/test';

const navLabels = {
  nl: ['Kaart', 'Over de studie', 'Hidden Gems', 'Eerstejaars'],
  en: ['Map', 'About the study', 'Hidden Gems', 'First-year'],
};

async function expectNavigation(
  page: import('@playwright/test').Page,
  mobile: boolean,
  locale: keyof typeof navLabels,
) {
  const nav = page.locator(mobile ? '.bottom-nav' : '.desktop-nav');
  await expect(nav).toBeVisible();
  await expect(nav.locator('.nav-label')).toHaveText(navLabels[locale]);
  await expect(nav.locator('a')).toHaveCount(4);
  expect(
    await nav
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  ).toEqual(['/map', '/over-de-studie', '/gems', '/tips']);
  await expect(nav.locator('a').nth(1)).toHaveAttribute('aria-current', 'page');
}

test('Over de studie occupies the correct responsive navigation position in NL and EN', async ({
  page,
}) => {
  for (const width of [320, 375, 390, 1440]) {
    await page.setViewportSize({ width, height: width < 760 ? 780 : 900 });
    await page.goto('/over-de-studie');
    await expectNavigation(page, width < 760, 'nl');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }

  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expectNavigation(page, false, 'en');
  await page.setViewportSize({ width: 320, height: 780 });
  await expectNavigation(page, true, 'en');

  await page.goto('/study-info');
  await expect(page).toHaveURL(/\/over-de-studie$/);
});

test('Over de studie shows supplied cards, search, filters, sources and expandable content', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/over-de-studie');

  for (const title of [
    'NHL Stenden',
    'Onderwijs- en Examenregeling (OER)',
    'Examencommissie',
    'Studiefaciliteiten',
    'Wat is Leisure?',
    'Wat is de functie van Leisure?',
    'Wat zijn evenementen?',
  ]) {
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible();
  }

  const search = page.getByRole('searchbox', {
    name: 'Zoek binnen Over de studie',
  });
  await expect(search).toHaveAttribute(
    'placeholder',
    'Zoek binnen Over de studie...',
  );
  await search.fill('leisure');
  await expect(page.getByText('2 van 7 onderwerpen')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Wat is Leisure?', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Wat is de functie van Leisure?',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Wat zijn evenementen?', exact: true }),
  ).toHaveCount(0);

  await search.fill('examencommissie');
  await expect(page.getByText('1 van 7 onderwerpen')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Examencommissie', exact: true }),
  ).toBeVisible();

  await search.fill('OER');
  await expect(
    page.getByRole('heading', {
      name: 'Onderwijs- en Examenregeling (OER)',
      exact: true,
    }),
  ).toBeVisible();
  const oerSource = page.getByRole('link', {
    name: /Officiële bron — NHL Stenden/,
  });
  await expect(oerSource).toHaveAttribute(
    'href',
    'https://www.nhlstenden.com/rechten-en-plichten-tijdens-je-studie',
  );
  await expect(oerSource).toHaveAttribute('target', '_blank');

  await search.clear();
  await page.getByRole('button', { name: 'Leisure & Events' }).click();
  await expect(page.getByText('3 van 7 onderwerpen')).toBeVisible();
  const leisureCard = page.locator('[data-study-id="what-is-leisure"]');
  await expect(leisureCard).toBeVisible();
  await leisureCard.getByText('Lees meer').click();
  await expect(
    leisureCard.getByText('De historische ontwikkeling van vrije tijd.'),
  ).toBeVisible();
  await expect(
    leisureCard.getByRole('link', {
      name: /Academische bron — Universiteit Utrecht/,
    }),
  ).toHaveAttribute(
    'href',
    'https://studenttheses.uu.nl/server/api/core/bitstreams/2009b384-021b-49e0-a466-d4c21e08204d/content',
  );
  await expect(
    page
      .locator('[data-study-id="function-of-leisure"]')
      .getByRole('link', { name: /World Leisure Organization/ }),
  ).toHaveAttribute('href', 'https://www.worldleisure.org/about-us/');
  await expect(
    page
      .locator('[data-study-id="events"]')
      .getByRole('link', { name: /Vakliteratuur — Projectmanagement \/ Boom/ }),
  ).toHaveAttribute(
    'href',
    'https://www.projectmanagement10edruk.nl/documenten/wat_is_een_evenement.pdf',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('Campus Tour remains a bilingual external First-year tip that fits mobile', async ({
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
