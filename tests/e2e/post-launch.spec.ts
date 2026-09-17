import { test, expect } from '@playwright/test';

const navLabels = {
  nl: ['Kaart', 'Hidden Gems', 'Eerstejaars'],
  en: ['Map', 'Hidden Gems', 'First-year'],
};

const activeEventIds = [
  'museumnacht-frl-2026',
  'let-op-hier-volgt-een-mening-2026',
  'weekend-van-de-wetenschap-leeuwarden-2026',
  'heropening-de-harmonie-2026',
  'popronde-leeuwarden-2026',
  'acqua-forte-parade-2026',
  'minormarkt-leeuwarden-2026',
  'noordelijk-film-festival-2026',
  'explore-the-north-2026',
];

async function expectFirstYearNavigation(
  page: import('@playwright/test').Page,
  mobile: boolean,
  locale: keyof typeof navLabels,
) {
  const nav = page.locator(mobile ? '.bottom-nav' : '.desktop-nav');
  await expect(nav).toBeVisible();
  await expect(nav.locator('.nav-label')).toHaveText(navLabels[locale]);
  await expect(nav.locator('a')).toHaveCount(3);
  expect(
    await nav
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  ).toEqual(['/map', '/gems', '/tips']);
  await expect(nav.locator('a').nth(2)).toHaveAttribute('aria-current', 'page');
}

test('all study information lives under responsive First-year navigation', async ({
  page,
}) => {
  for (const width of [320, 375, 390, 1440]) {
    await page.setViewportSize({ width, height: width < 760 ? 800 : 900 });
    await page.goto('/tips');
    await expectFirstYearNavigation(page, width < 760, 'nl');
    await expect(
      page.getByRole('heading', { name: 'Eerstejaars', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }

  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expectFirstYearNavigation(page, false, 'en');
  await expect(
    page.getByRole('heading', { name: 'First-year', exact: true }),
  ).toBeVisible();

  await page.goto('/over-de-studie');
  await expect(page).toHaveURL(/\/tips$/);
  await page.goto('/study-info');
  await expect(page).toHaveURL(/\/tips$/);
});

test('First-year shows all sections, cards, sources, search and existing tips', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tips');

  for (const section of [
    'Starten bij NHL Stenden',
    'Leisure & Events',
    'Jouw toekomst',
    'Evenementen in de buurt',
    'Handige eerstejaars-tips',
  ]) {
    await expect(
      page.getByRole('heading', { name: section, exact: true }),
    ).toBeVisible();
  }

  for (const title of [
    'NHL Stenden',
    'Design Based Education (DBE)',
    'Onderwijs- en Examenregeling (OER)',
    'Examencommissie',
    'Studiefaciliteiten',
    'PPO & Portfolio',
    'Wat is Leisure?',
    'Wat is de functie van Leisure?',
    'Wat zijn evenementen?',
    'Jouw toekomst na de Associate degree',
    'Na deze studie — Studiekeuze123',
    'Ontdek de campus met een Campus Tour',
  ]) {
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible();
  }

  await expect(
    page.locator('[data-first-year-id="dbe"]').getByRole('link', {
      name: /Officiële NHL Stenden-bron/,
    }),
  ).toHaveAttribute(
    'href',
    'https://www.nhlstenden.com/studeren-bij-nhl-stenden/over-ons-onderwijssysteem',
  );
  await expect(
    page.locator('[data-first-year-id="study-choice-123"] a'),
  ).toHaveAttribute(
    'href',
    'https://www.studiekeuze123.nl/studies/80040-leisure-management-hbo-associate-degree',
  );
  await expect(
    page.locator('[data-first-year-id="study-facilities"] a'),
  ).toHaveAttribute('href', '/map?to=library');

  const dbeCard = page.locator('[data-first-year-id="dbe"]');
  await dbeCard.getByText('Lees meer').click();
  await expect(
    dbeCard.getByText(/Studenten werken aan praktijkgerichte projecten/),
  ).toBeVisible();

  const search = page.getByRole('searchbox', { name: 'Zoek in Eerstejaars' });
  await expect(search).toHaveAttribute('placeholder', 'Zoek in Eerstejaars...');
  await search.fill('portfolio');
  await expect(
    page.getByRole('heading', { name: 'PPO & Portfolio', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Design Based Education (DBE)' }),
  ).toHaveCount(0);

  await search.fill('DBE');
  await expect(
    page.getByRole('heading', { name: 'Design Based Education (DBE)' }),
  ).toBeVisible();

  await search.fill('evenement');
  await expect(
    page.getByRole('heading', { name: 'Wat zijn evenementen?' }),
  ).toBeVisible();
  await expect(page.locator('[data-event-id]')).toHaveCount(9);

  await search.clear();
  await page.getByRole('button', { name: 'Handige eerstejaars-tips' }).click();
  await expect(page.locator('[data-tip-id]')).toHaveCount(9);
  await expect(
    page.getByRole('heading', {
      name: 'Ontdek de campus met een Campus Tour',
    }),
  ).toBeVisible();
});

test('nearby events are chronological, unique and exclude all cancellations', async ({
  page,
}) => {
  await page.goto('/tips');
  await page.getByRole('button', { name: 'Evenementen in de buurt' }).click();

  const eventCards = page.locator('[data-event-id]');
  await expect(eventCards).toHaveCount(9);
  expect(
    await eventCards.evaluateAll((cards) =>
      cards.map((card) => card.getAttribute('data-event-id')),
    ),
  ).toEqual(activeEventIds);
  await expect(page.getByText('The Grave Rave', { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText('Friesland Pop Pizza Party', { exact: true }),
  ).toHaveCount(0);

  const urls = await eventCards
    .locator('a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(new Set(urls).size).toBe(9);
  await expect(
    page.getByRole('link', { name: /Bekijk evenement · Fries Museum/ }),
  ).toHaveAttribute(
    'href',
    'https://www.friesmuseum.nl/activiteiten/museumnacht-2026',
  );
});

test('Campus Tour remains a bilingual external First-year tip', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/tips');
  await expect(page.getByText('Scan. Zoek. Op weg.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Handige eerstejaars-tips' }).click();
  const card = page.locator('[data-tip-id="campus-tour"]');
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
