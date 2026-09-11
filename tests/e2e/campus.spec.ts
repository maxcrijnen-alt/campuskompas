import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { serviceDb, publicDb } from '../../lib/server/supabase';

async function removeTemporaryGems(titlePattern: string) {
  const db = serviceDb();
  const { data, error } = await db
    .from('hidden_gems')
    .select('id,photo_path')
    .like('title', titlePattern);
  if (error) throw error;
  for (const gem of data ?? []) {
    if (gem.photo_path) {
      const { error: storageError } = await db.storage
        .from('gem-photos')
        .remove([gem.photo_path]);
      if (storageError) throw storageError;
    }
    const { error: deleteError } = await db
      .from('hidden_gems')
      .delete()
      .eq('id', gem.id);
    if (deleteError) throw deleteError;
  }
}

test('find a room, route across floors, accessible failure, English and QR deep link', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'R8', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('textbox', { name: 'Zoek lokaal of voorziening' })
    .fill('f 3 025');
  await page.getByRole('button', { name: /F3.025.*R10/ }).click();
  await expect(page.getByRole('heading', { name: 'F3.025' })).toBeVisible();
  await page.getByRole('button', { name: 'Route hierheen' }).click();
  await page
    .getByRole('textbox', { name: 'Zoek huidige locatie' })
    .fill('ishop');
  await page.getByRole('button', { name: /iShop.*R8.*0\.26/i }).click();
  await page.getByRole('switch', { name: 'Toegankelijke route' }).click();
  await page.getByRole('button', { name: 'Toon route' }).click();
  await expect(
    page.getByText(/nog geen geverifieerde trapvrije route/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Kies ander startpunt' }).click();
  await page.getByRole('switch', { name: 'Toegankelijke route' }).click();
  await page.getByRole('button', { name: 'Toon route' }).click();
  await expect(page.getByText(/Kaartindicatie/)).toBeVisible();
  await expect(page.getByText('± 4 min lopen')).toBeVisible();
  await expect(page.getByLabel('START · 0.26')).toBeVisible();
  await expect(page.locator('.route-path-active')).not.toHaveCount(0);
  await page.getByRole('button', { name: 'Volgende routefase' }).click();
  await expect(
    page.getByRole('heading', { name: 'R10 · Begane grond' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/stage=1/);
  await page.getByRole('button', { name: 'R10 · verdieping 3' }).click();
  await expect(page.getByLabel('BESTEMMING · F3.025')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'R10 · Verdieping 3' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(
    page.getByRole('heading', { name: 'Where are you heading?' }),
  ).toBeVisible();
  await page.goto('/map?from=qr:R10_MAIN_ENTRANCE&to=F3025');
  await expect(page.getByRole('heading', { name: 'To F3.025' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'R10', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});
test('same-floor route stays simple and route debug is development-only', async ({
  page,
}) => {
  await page.goto(
    '/map?from=R8-002&to=library&route=active&stage=0&debugRouting=1',
  );
  await expect(page.getByText('Deel 1 van 1')).toBeVisible();
  await expect(page.getByText('± 1 min lopen')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Volgende routefase' }),
  ).toBeDisabled();
  await expect(page.getByText('Routing debug')).toBeVisible();
  await expect(page.locator('.route-path-active')).not.toHaveCount(0);
});
test('wheelchair route uses unknown lift data with an honest warning', async ({
  page,
}) => {
  await page.goto('/map?from=R8-002&to=R8-301&accessible=1&route=active');
  await expect(
    page.getByText(/vermijdt trappen, maar de toegankelijkheid/),
  ).toBeVisible();
  await expect(page.getByText(/Neem de lift naar verdieping 1/)).toBeVisible();
  await expect(page.locator('.route-path-active')).not.toHaveCount(0);
  await expect(page.getByText(/bevestigd toegankelijk/)).toHaveCount(0);
});
test('mobile route keeps the current map segment and controls usable at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/map?from=ishop&to=F3025&route=active&stage=0');
  await expect(page.getByText('Deel 1 van 5')).toBeVisible();
  await expect(page.getByLabel('START · 0.26')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.locator('.official-canvas').evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.height >= 300 && bounds.top < window.innerHeight;
    }),
  ).toBe(true);
  await page.getByRole('button', { name: 'Volgende routefase' }).click();
  await expect(page.getByText('Deel 2 van 5')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'R10 · Begane grond' }),
  ).toBeVisible();
});
test('homepage, map and opening-hours details fit 375px and 390px', async ({
  page,
}) => {
  test.setTimeout(180000);
  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.goto('/map?to=library');
    await expect(
      page.getByRole('button', { name: 'Route hierheen' }),
    ).toBeVisible();
    await expect(page.locator('.hours-card')).toBeVisible();
    expect(
      await page.locator('.hours-card').evaluate((hours) => {
        const routeButton = document.querySelector('.location-cta');
        return Boolean(
          routeButton &&
          hours.compareDocumentPosition(routeButton) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
      }),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.goto('/map?from=ishop&to=F3025&route=active&stage=0');
    await expect(page.getByText('Deel 1 van 5')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
test('missing corridor geometry shows a clear no-route state without a shortcut', async ({
  page,
}) => {
  await page.goto('/map?from=cafe-if&to=canteen&route=active');
  await expect(
    page.getByText(
      'Voor deze combinatie kunnen we nog geen betrouwbare route maken.',
    ),
  ).toBeVisible();
  await expect(page.getByText(/We tekenen geen afsnijding/)).toBeVisible();
  await expect(page.locator('.route-path-active')).toHaveCount(0);
});
test('searches the same locations for From and To and keeps swap URL state', async ({
  page,
}) => {
  await page.goto('/map?to=F3025&navigate=1');
  await page
    .getByRole('textbox', { name: 'Zoek huidige locatie' })
    .fill('ishop');
  await page.getByRole('button', { name: /iShop.*R8.*0\.26/i }).click();
  await page
    .getByRole('button', { name: 'Wissel start en bestemming' })
    .click();
  await expect(page.getByRole('heading', { name: 'Naar 0.26' })).toBeVisible();
  await expect(page).toHaveURL(/from=F3025/);
  await expect(page).toHaveURL(/to=ishop/);
});
test('mobile map and search fit 320px, keyboard access and accessibility audit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Waar moet je heen?' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('textbox', { name: 'Zoek lokaal of voorziening' })
    .fill('library');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Bibliotheek', level: 2 }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: 'outputs/mobile.png', fullPage: true });
});
test('opening hours show a Library exception, closed state and semantic unknown state', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-12T08:00:00Z'));
  await page.goto('/map?to=library');
  await expect(page.getByText('Open · tot 13:00')).toBeVisible();
  await expect(page.getByText(/Afwijkende openingstijd vandaag/)).toBeVisible();
  await page.getByText('Openingstijden bekijken').click();
  await expect(page.locator('.opening-week .today')).toContainText('Maandag');
  await expect(
    page.getByRole('link', { name: /Bron bekijken/ }),
  ).toHaveAttribute('href', /nhlstenden\.com\/bibliotheek/);

  await page.clock.setFixedTime(new Date('2026-09-12T10:00:00Z'));
  await page.reload();
  await expect(
    page.getByText(/Vandaag gesloten · opent maandag 08:30/),
  ).toBeVisible();

  await page.goto('/map?to=central-brew');
  await expect(
    page.getByText('Openingstijden nog niet bevestigd'),
  ).toBeVisible();
  await page.goto('/map?to=F3025');
  await expect(page.locator('.hours-card')).toHaveCount(0);
});

test('Student Info labels confirmed contact times without claiming physical opening', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-09-10T10:00:00Z'));
  await page.goto('/map?to=student-info');
  await expect(
    page.getByText(/Telefonisch bereikbaar · tot 16:30/),
  ).toBeVisible();
  await expect(
    page
      .locator('.hours-note')
      .getByText(/fysieke balie-uren zijn niet bevestigd/),
  ).toBeVisible();
  await expect(page.getByText(/Gebouw open/)).toHaveCount(0);
});

test('admin creates, previews and links URL-less hours by facility name', async ({
  page,
  request,
}) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires provisioned admin');
  const suffix = Date.now();
  const locationId = `qa-hours-location-${suffix}`;
  const locationName = `QA tijdelijke urenvoorziening ${suffix}`;
  const gemTitle = `QA tijdelijke uren-gem ${suffix}`;
  const database = serviceDb();
  const inserted = await database.from('locations').insert({
    id: locationId,
    name: { nl: locationName, en: `QA temporary hours facility ${suffix}` },
    description: {
      nl: 'Tijdelijke geautomatiseerde acceptatietest; wordt direct verwijderd.',
      en: 'Temporary automated acceptance test; removed immediately.',
    },
    building_id: 'R8',
    floor_id: 'R8-0',
    category_id: 'coffee',
    room_code: null,
    aliases: ['qa hours facility'],
    node_id: 'plan-R8-0-14-29_2',
    x: 180,
    y: 230,
    status: 'approved',
    verification_status: 'unverified',
    source_id: 'campus',
    hours_id: null,
    routing_status: 'direct',
    endpoint_source: 'manual',
  });
  if (inserted.error) throw inserted.error;
  const insertedGem = await database
    .from('hidden_gems')
    .insert({
      title: gemTitle,
      description:
        'Tijdelijke Hidden Gem voor de geautomatiseerde uren-koppelingstest.',
      category: 'coffee',
      location_id: locationId,
      location_review_status: 'approved',
      status: 'approved',
      featured: false,
      photo_path: null,
      hours_id: null,
    })
    .select('id')
    .single();
  if (insertedGem.error || !insertedGem.data) {
    await database.from('locations').delete().eq('id', locationId);
    throw insertedGem.error ?? new Error('Temporary Hidden Gem not created');
  }
  const gemId = insertedGem.data.id as string;
  let hoursId: string | null = null;
  try {
    await page.goto('/admin/opening-hours');
    await page
      .getByLabel('E-mail', { exact: true })
      .fill(process.env.TEST_ADMIN_EMAIL!);
    await page
      .getByLabel('Wachtwoord / Password')
      .fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Inloggen / Sign in' }).click();
    const facilitySearch = page.getByRole('searchbox', {
      name: /Voorziening of Hidden Gem/,
    });
    await facilitySearch.fill(locationName);
    await page.getByRole('button', { name: new RegExp(locationName) }).click();
    await expect(
      page.getByRole('heading', { name: locationName }),
    ).toBeVisible();
    await page
      .getByLabel('Korte bronbeschrijving / Short source description')
      .fill('Tijdelijke handmatige testbron zonder URL; wordt verwijderd.');
    await page.getByLabel('Maandag').fill('17:00–08:30');
    await page.getByRole('button', { name: /Opslaan en koppelen/ }).click();
    await expect(page.locator('.hours-admin-form .form-error')).toContainText(
      /eindtijd moet later zijn/,
    );
    await page.getByLabel('Maandag').fill('08:30–12:00, 13:00–17:00');
    await page.getByRole('button', { name: /Uitzondering toevoegen/ }).click();
    await page
      .getByLabel('Uitzonderingsdatum / Exception date')
      .fill('2026-10-12');
    await page
      .getByLabel('Uitzonderingstijden / Exception periods')
      .fill('09:00–13:00');
    await expect(page.getByLabel('Brontype / Source type')).toHaveValue(
      'manual_admin',
    );
    await page.getByRole('button', { name: /Opslaan en koppelen/ }).click();
    await expect
      .poll(async () => {
        const result = await database
          .from('locations')
          .select('hours_id')
          .eq('id', locationId)
          .single();
        return result.data?.hours_id ?? null;
      })
      .toMatch(/^hours-/);
    hoursId = (
      await database
        .from('locations')
        .select('hours_id')
        .eq('id', locationId)
        .single()
    ).data!.hours_id;
    await expect
      .poll(async () => {
        const result = await database
          .from('opening_hours')
          .select(
            'weekly,exceptions,hours_kind,timezone,source_type,source_url,source_description,verification_status',
          )
          .eq('id', hoursId!)
          .maybeSingle();
        return result.data;
      })
      .toMatchObject({
        weekly: {
          '1': [
            ['08:30', '12:00'],
            ['13:00', '17:00'],
          ],
        },
        exceptions: { '2026-10-12': [['09:00', '13:00']] },
        hours_kind: 'physical_opening',
        timezone: 'Europe/Amsterdam',
        source_type: 'manual_admin',
        source_url: null,
        verification_status: 'unverified',
      });

    await page.goto(`/map?to=${encodeURIComponent(locationId)}`);
    await expect(
      page.getByRole('heading', { name: locationName }),
    ).toBeVisible();
    await page.getByText('Openingstijden bekijken').click();
    await expect(page.getByText('Handmatige beheernotitie')).toBeVisible();
    await expect(
      page.getByText('Tijden moeten worden gecontroleerd'),
    ).toBeVisible();

    await page.goto('/admin/opening-hours');
    const gemSearch = page.getByRole('searchbox', {
      name: /Voorziening of Hidden Gem/,
    });
    await gemSearch.fill(gemTitle);
    await page.getByRole('button', { name: new RegExp(gemTitle) }).click();
    await expect(page.locator('.hours-admin-form h2')).toContainText(gemTitle);
    const hoursSelect = page.getByLabel('Urenrecord / Hours record');
    const linkedHoursOption = hoursSelect
      .locator('option')
      .filter({ hasText: locationName });
    const linkedHoursLabel = (await linkedHoursOption.textContent())?.trim();
    expect(linkedHoursLabel).toBeTruthy();
    await hoursSelect.selectOption({ label: linkedHoursLabel! });
    await page.getByRole('button', { name: /Opslaan en koppelen/ }).click();
    await expect
      .poll(async () => {
        const result = await database
          .from('hidden_gems')
          .select('hours_id')
          .eq('id', gemId)
          .single();
        return result.data?.hours_id;
      })
      .toBe(hoursId);

    const savedHours = (
      await database
        .from('opening_hours')
        .select('*')
        .eq('id', hoursId!)
        .single()
    ).data;
    expect(savedHours).toBeTruthy();
    expect(
      (
        await page.request.post('/api/admin/hours-records', {
          data: { hours: savedHours, target: null },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await page.request.post('/api/admin/hours-records', {
          data: {
            hours: savedHours,
            target: { target_type: 'location', target_id: 'F3025' },
          },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.post('/api/admin/hours-records', {
          data: {
            hours: { ...savedHours, hours_kind: 'building_access' },
            target: null,
          },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.post('/api/admin/opening_hours', {
          data: savedHours,
        })
      ).status(),
    ).toBe(400);

    expect(
      (
        await request.post('/api/admin/hours-records', {
          data: {
            hours: savedHours,
            target: { target_type: 'location', target_id: locationId },
          },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await page.request.post('/api/admin/hours-records', {
          headers: { Origin: 'https://example.invalid' },
          data: {
            hours: savedHours,
            target: { target_type: 'location', target_id: locationId },
          },
        })
      ).status(),
    ).toBe(403);
  } finally {
    const cleanupErrors: unknown[] = [];
    const linked = await database
      .from('locations')
      .select('hours_id')
      .eq('id', locationId)
      .maybeSingle();
    const cleanupHoursId = hoursId ?? linked.data?.hours_id ?? null;
    const gemCleanup = await database
      .from('hidden_gems')
      .delete()
      .eq('id', gemId);
    if (gemCleanup.error) cleanupErrors.push(gemCleanup.error);
    const locationCleanup = await database
      .from('locations')
      .delete()
      .eq('id', locationId);
    if (locationCleanup.error) cleanupErrors.push(locationCleanup.error);
    if (cleanupHoursId) {
      const hoursCleanup = await database
        .from('opening_hours')
        .delete()
        .eq('id', cleanupHoursId);
      if (hoursCleanup.error) cleanupErrors.push(hoursCleanup.error);
    }
    expect(cleanupErrors).toEqual([]);
  }
});
test('public cannot enter admin data or mutate protected resources', async ({
  request,
  page,
}) => {
  await page.goto('/admin');
  await expect(page.getByLabel('Wachtwoord / Password')).toBeVisible();
  for (const table of ['locations', 'route_nodes', 'hidden_gems']) {
    expect((await request.get('/api/admin/' + table)).status()).toBe(401);
    expect(
      (
        await request.post('/api/admin/' + table, {
          data: { id: 'anything', status: 'approved' },
        })
      ).status(),
    ).toBe(401);
  }
  const db = publicDb();
  const change = await db
    .from('locations')
    .update({ status: 'archived' })
    .eq('id', 'library')
    .select();
  expect(change.error !== null || change.data?.length === 0).toBe(true);
  const privilege = await db
    .from('admin_profiles')
    .insert({ user_id: process.env.TEST_ADMIN_ID });
  expect(privilege.error).not.toBeNull();
  const signup = await db.auth.signUp({
    email: 'blocked-' + Date.now() + '@example.com',
    password: 'Rejected-Only-Password123!',
  });
  expect(signup.error).not.toBeNull();
});
test('new Hidden Gem place stays a non-routeable proposal for moderation', async ({
  page,
}) => {
  test.setTimeout(90000);
  await removeTemporaryGems('QA proposed gem %');
  const title = 'QA proposed gem ' + Date.now();
  try {
    await page.goto('/gems');
    await page.getByRole('button', { name: 'Deel een Hidden Gem' }).click();
    await page.getByLabel('Titel', { exact: true }).fill(title);
    await page
      .getByLabel('Beschrijving')
      .fill('Tijdelijk voorstel om de moderatiestroom te controleren.');
    await page.getByLabel('Stel een nieuwe plek voor').check();
    await page.getByLabel('Naam van de plek').fill('QA onbekende studienis');
    await page
      .getByLabel('Hoe kan een beheerder de plek vinden?')
      .fill('Naast een herkenbaar informatiebord; exacte verdieping onbekend.');
    await page.waitForTimeout(3200);
    const submission = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/gems',
      { timeout: 45000 },
    );
    await page
      .getByRole('button', { name: 'Verstuur mijn ontdekking' })
      .click();
    expect((await submission).status()).toBe(201);
    await expect(page.locator('.toast[role="status"]')).toContainText(
      'Je tip wordt eerst even gecontroleerd',
    );
    const { data, error } = await serviceDb()
      .from('hidden_gems')
      .select('*')
      .eq('title', title)
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({
      location_id: null,
      location_review_status: 'proposed',
      proposed_location_name: 'QA onbekende studienis',
      proposed_location_context: 'r8',
      proposed_building_id: 'R8',
      status: 'pending',
    });
  } finally {
    await removeTemporaryGems(title);
  }
});

test('an outdoor Hidden Gem can be moderated without inventing an indoor route', async ({
  page,
}) => {
  test.setTimeout(120000);
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires provisioned admin');
  await removeTemporaryGems('QA outdoor gem %');
  const title = 'QA outdoor gem ' + Date.now();
  let gemId: string | undefined;
  try {
    await page.goto('/gems');
    await page.getByRole('button', { name: 'Deel een Hidden Gem' }).click();
    await page.getByLabel('Titel', { exact: true }).fill(title);
    await page
      .getByLabel('Beschrijving')
      .fill('Tijdelijke buitentip om locatiecontext en moderatie te testen.');
    await page.getByLabel('Stel een nieuwe plek voor').check();
    await page.getByLabel('Gebied op de campus').selectOption('campus_outdoor');
    await page.getByLabel('Naam van de plek').fill('QA tafel op campusplein');
    await page
      .getByLabel('Lokaal, zone of herkenningspunt (indien bekend)')
      .fill('Bij de fietsenrekken aan het plein');
    await page
      .getByLabel('Hoe kan een beheerder de plek vinden?')
      .fill('Buiten op het plein, naast de grote plantenbak.');
    await expect(page.getByLabel('Gebouw')).toHaveCount(0);
    await page.waitForTimeout(3200);
    const submission = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/gems',
      { timeout: 45000 },
    );
    await page
      .getByRole('button', { name: 'Verstuur mijn ontdekking' })
      .click();
    expect((await submission).status()).toBe(201);

    const saved = await serviceDb()
      .from('hidden_gems')
      .select(
        'id,status,location_id,proposed_location_context,proposed_building_id,proposed_floor_id',
      )
      .eq('title', title)
      .single();
    expect(saved.error).toBeNull();
    gemId = saved.data!.id;
    expect(saved.data).toMatchObject({
      status: 'pending',
      location_id: null,
      proposed_location_context: 'campus_outdoor',
      proposed_building_id: null,
      proposed_floor_id: null,
    });

    await page.goto('/admin/gems');
    await page
      .getByLabel('E-mail', { exact: true })
      .fill(process.env.TEST_ADMIN_EMAIL!);
    await page
      .getByLabel('Wachtwoord / Password')
      .fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Inloggen / Sign in' }).click();
    const moderationCard = page.locator('article').filter({ hasText: title });
    await expect(moderationCard).toContainText(
      'Buiten op campus / Campus outdoor',
    );
    await moderationCard
      .getByRole('button', { name: 'Goedkeuren / Approve' })
      .click();
    await expect
      .poll(
        async () =>
          (
            await serviceDb()
              .from('hidden_gems')
              .select('status,location_id,proposed_location_context')
              .eq('id', gemId!)
              .single()
          ).data,
      )
      .toMatchObject({
        status: 'approved',
        location_id: null,
        proposed_location_context: 'campus_outdoor',
      });

    await page.goto('/gems');
    const publicCard = page.locator('article').filter({ hasText: title });
    await expect(publicCard).toContainText('Buiten de indoor routekaart');
    await expect(publicCard).toContainText(
      'Route via CampusKompas is voor deze plek nog niet beschikbaar.',
    );
    await expect(
      publicCard.getByRole('link', { name: /Route hierheen|Bekijk kaart/ }),
    ).toHaveCount(0);
  } finally {
    await removeTemporaryGems(title);
  }
});

test('admin password reset is neutral and rejects invalid recovery tokens', async ({
  page,
}) => {
  await page.goto('/admin');
  await page
    .getByLabel('E-mail', { exact: true })
    .fill('unknown-admin@example.com');
  const reset = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/admin/password-reset',
  );
  await page
    .getByRole('button', { name: 'Wachtwoord vergeten? / Forgot password?' })
    .click();
  expect((await reset).status()).toBe(202);
  await expect(
    page.getByText(/Als dit e-mailadres beheerderstoegang heeft/),
  ).toBeVisible();
  expect(
    (
      await page.request.post('/api/admin/password-reset', {
        headers: { Origin: 'https://example.invalid' },
        data: { email: 'unknown-admin@example.com' },
      })
    ).status(),
  ).toBe(403);

  await page.goto('/admin/reset-password');
  await expect(
    page.getByText(/resetlink is ongeldig of verlopen/),
  ).toBeVisible();
  expect(
    (
      await page.request.post('/api/admin/password-update', {
        data: {
          access_token: 'x'.repeat(120),
          password: 'Valid-looking-Password123!',
        },
      })
    ).status(),
  ).toBe(401);

  await page.goto('/#access_token=fake-recovery-token&type=recovery');
  await expect(page).toHaveURL('/admin/reset-password');
  await expect(
    page.getByLabel('Nieuw wachtwoord / New password'),
  ).toBeVisible();
  expect(await page.evaluate(() => window.location.hash)).toBe('');
});

test('BRÛZE keeps its approved content without a false route link', async ({
  page,
}) => {
  await page.goto('/gems');
  const card = page.locator('article').filter({ hasText: /Bruze/i });
  await expect(card).toBeVisible();
  await expect(
    card.getByText(
      'Route via CampusKompas is voor deze plek nog niet beschikbaar.',
    ),
  ).toBeVisible();
  await expect(
    card.getByText(/Tijden moeten worden gecontroleerd/),
  ).toBeVisible();
  await expect(card.locator('.hours-note')).toContainText('09:00–18:00');
  await expect(card.getByRole('link', { name: /Route hierheen/ })).toHaveCount(
    0,
  );
  await expect(card.getByRole('link', { name: /Bekijk kaart/ })).toHaveCount(0);
});
test('real Supabase submission, photo moderation, publishing and deduplicated likes', async ({
  page,
  browser,
}) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires provisioned admin');
  await removeTemporaryGems('QA temporary gem %');
  const title = 'QA temporary gem ' + Date.now();
  let gemId: string | undefined;
  try {
    await page.goto('/gems');
    await page.getByRole('button', { name: 'Deel een Hidden Gem' }).click();
    await page.getByLabel('Titel', { exact: true }).fill(title);
    await page
      .getByLabel('Beschrijving')
      .fill('Temporary integration test for moderated campus submissions.');
    await page
      .getByRole('textbox', { name: 'Zoek een campuslocatie' })
      .fill('bibliotheek');
    await page.getByRole('button', { name: /Bibliotheek.*R8/i }).click();
    await page
      .getByLabel('Foto (optioneel, max. 3 MB)')
      .setInputFiles('public/maps/r8-0.webp');
    await page.waitForTimeout(3200);
    const submission = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/gems',
      { timeout: 30000 },
    );
    await page
      .getByRole('button', { name: 'Verstuur mijn ontdekking' })
      .click();
    expect((await submission).status()).toBe(201);
    await expect(page.locator('.toast[role="status"]')).toContainText(
      'Je tip wordt eerst even gecontroleerd',
    );
    const { data, error } = await serviceDb()
      .from('hidden_gems')
      .select('*')
      .eq('title', title)
      .single();
    expect(error).toBeNull();
    gemId = data!.id;
    expect(data!.status).toBe('pending');
    expect(data!.photo_path).toBeTruthy();
    expect(
      (await publicDb().from('hidden_gems').select('id').eq('id', gemId!)).data,
    ).toEqual([]);
    expect(
      (await page.request.get('/api/gems/' + gemId + '/photo')).status(),
    ).toBe(404);
    const admin = await browser.newPage();
    await admin.goto('/admin/gems');
    await admin
      .getByLabel('E-mail', { exact: true })
      .fill(process.env.TEST_ADMIN_EMAIL!);
    await admin
      .getByLabel('Wachtwoord / Password')
      .fill(process.env.TEST_ADMIN_PASSWORD!);
    await admin.getByRole('button', { name: 'Inloggen / Sign in' }).click();
    const card = admin.locator('article').filter({ hasText: title });
    await expect(card).toBeVisible();
    const approval = admin.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/admin/hidden_gems',
      { timeout: 30000 },
    );
    await card.getByRole('button', { name: 'Goedkeuren / Approve' }).click();
    expect((await approval).status()).toBe(200);
    await expect(card.getByText('approved', { exact: true })).toBeVisible({
      timeout: 30000,
    });
    await page.reload();
    const publicCard = page.locator('article').filter({ hasText: title });
    await expect(publicCard).toBeVisible();
    await expect(
      publicCard.getByRole('link', { name: 'Bekijk kaart' }),
    ).toHaveAttribute('href', '/map?to=library');
    await expect(
      publicCard.getByRole('link', { name: 'Route hierheen' }),
    ).toHaveAttribute('href', '/map?to=library&navigate=1');
    await publicCard.getByRole('button', { name: 'Like ' + title }).click();
    await expect(
      publicCard.getByRole('button', { name: 'Like ' + title }),
    ).toContainText('1');
    const repeat = await page.request.post('/api/gems/' + gemId + '/like');
    expect(repeat.status()).toBe(200);
    expect((await repeat.json()).likes).toBe(1);
    expect(
      (await page.request.get('/api/gems/' + gemId + '/photo')).status(),
    ).toBe(200);
    await admin.close();
  } finally {
    await removeTemporaryGems(title);
  }
});
test('admin links a proposed gem to one validated canonical location', async ({
  page,
}) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires provisioned admin');
  const title = 'QA link proposal ' + Date.now();
  const { data, error } = await serviceDb()
    .from('hidden_gems')
    .insert({
      title,
      description: 'Temporary proposed location for the admin linking test.',
      category: 'study',
      location_id: null,
      location_review_status: 'proposed',
      proposed_location_context: 'r8',
      proposed_building_id: 'R8',
      proposed_location_name: 'QA proposed study spot',
      proposed_location_description:
        'Exact location must be selected by a moderator.',
      status: 'pending',
      slug: crypto.randomUUID(),
    })
    .select('id')
    .single();
  expect(error).toBeNull();
  try {
    await page.goto('/admin/gems');
    await page
      .getByLabel('E-mail', { exact: true })
      .fill(process.env.TEST_ADMIN_EMAIL!);
    await page
      .getByLabel('Wachtwoord / Password')
      .fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Inloggen / Sign in' }).click();
    const card = page.locator('article').filter({ hasText: title });
    await card
      .getByLabel('Canonieke locatie / Canonical location')
      .selectOption('library');
    await expect
      .poll(
        async () =>
          (
            await serviceDb()
              .from('hidden_gems')
              .select(
                'location_id,location_review_status,proposed_location_name',
              )
              .eq('id', data!.id)
              .single()
          ).data,
      )
      .toMatchObject({
        location_id: 'library',
        location_review_status: 'approved',
        proposed_location_name: null,
      });
  } finally {
    await serviceDb().from('hidden_gems').delete().eq('id', data!.id);
  }
});

test('admin rejects a wrong-floor endpoint and validates a real endpoint', async ({
  page,
}) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires provisioned admin');
  const id = 'qa-location-' + Date.now();
  await page.goto('/admin/locations');
  await page
    .getByLabel('E-mail', { exact: true })
    .fill(process.env.TEST_ADMIN_EMAIL!);
  await page
    .getByLabel('Wachtwoord / Password')
    .fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Inloggen / Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Nieuw / New' })).toBeVisible();
  const base = {
    id,
    name: { nl: 'QA tijdelijke locatie', en: 'QA temporary location' },
    description: {
      nl: 'Wordt na de test verwijderd.',
      en: 'Removed after the test.',
    },
    building_id: 'R8',
    floor_id: 'R8-0',
    category_id: 'study',
    room_code: null,
    aliases: [],
    node_id: null,
    x: 180,
    y: 230,
    status: 'pending',
    verification_status: 'unverified',
    source_id: 'campus',
    hours_id: null,
    routing_status: 'needs_review',
    endpoint_source: null,
  };
  try {
    expect(
      (
        await page.request.post('/api/admin/locations', { data: base })
      ).status(),
    ).toBe(200);
    expect(
      (
        await page.request.post('/api/admin/locations', {
          data: { ...base, node_id: 'plan-R10-3-29_96-47_066' },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.post('/api/admin/locations', {
          data: {
            ...base,
            node_id: 'plan-R8-0-14-29_2',
            status: 'approved',
            verification_status: 'verified',
          },
        })
      ).status(),
    ).toBe(200);
    const saved = await serviceDb()
      .from('locations')
      .select(
        'node_id,routing_status,endpoint_source,status,verification_status',
      )
      .eq('id', id)
      .single();
    expect(saved.data).toMatchObject({
      node_id: 'plan-R8-0-14-29_2',
      routing_status: 'direct',
      endpoint_source: 'manual',
      status: 'approved',
      verification_status: 'verified',
    });
  } finally {
    await serviceDb().from('locations').delete().eq('id', id);
  }
});
test('admin can edit data, produce QR and inspect maps; landing screenshot', async ({
  page,
}) => {
  test.setTimeout(180000);
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires provisioned admin');
  await page.goto('/admin/maps');
  await page
    .getByLabel('E-mail', { exact: true })
    .fill(process.env.TEST_ADMIN_EMAIL!);
  await page
    .getByLabel('Wachtwoord / Password')
    .fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Inloggen / Sign in' }).click();
  await expect(
    page.getByRole('heading', { name: 'Kaarteditor / Map editor' }),
  ).toBeVisible();
  const routingHealth = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/admin/routing-health',
    { timeout: 45000 },
  );
  await page.goto('/admin');
  expect((await routingHealth).status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'Routing health' }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('100%')).toBeVisible();
  await page.goto('/admin/locations');
  await expect(
    page.getByRole('columnheader', { name: 'Endpoint-node' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nieuw / New' })).toBeVisible();
  await page.goto('/admin/gems');
  const bruze = page.locator('article').filter({ hasText: /Bruze/i });
  await expect(bruze.getByText('Café BRÛZE')).toBeVisible();
  await expect(bruze.getByText(/Exacte kaartpositie/)).toBeVisible();
  await page.goto('/admin/qr');
  await page.getByRole('button', { name: 'QR export' }).first().click();
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
  await page.goto('/');
  await page.screenshot({ path: 'outputs/desktop.png', fullPage: true });
});
