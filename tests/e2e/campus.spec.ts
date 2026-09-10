import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { serviceDb, publicDb } from '../../lib/server/supabase';
test('find a room, route across floors, accessible failure, English and QR deep link', async ({
  page,
}) => {
  await page.goto('/');
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
    page.getByText(/Geen mogelijke trapvrije route/),
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
  expect(await page.locator('.route-path-active').count()).toBeGreaterThan(0);
});
test('wheelchair route uses unknown lift data with an honest warning', async ({ page }) => {
  await page.goto('/map?from=R8-002&to=R8-301&accessible=1&route=active');
  await expect(page.getByText(/vermijdt trappen, maar de toegankelijkheid/)).toBeVisible();
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
test('new Hidden Gem place stays a non-routeable proposal for moderation', async ({ page }) => {
  const title = 'QA proposed gem ' + Date.now();
  let gemId: string | undefined;
  try {
    await page.goto('/gems');
    await page.getByRole('button', { name: 'Deel een Hidden Gem' }).click();
    await page.getByLabel('Titel', { exact: true }).fill(title);
    await page.getByLabel('Beschrijving').fill('Tijdelijk voorstel om de moderatiestroom te controleren.');
    await page.getByLabel('Stel een nieuwe plek voor').check();
    await page.getByLabel('Naam van de plek').fill('QA onbekende studienis');
    await page.getByLabel('Hoe kan een beheerder de plek vinden?').fill('Naast een herkenbaar informatiebord; exacte verdieping onbekend.');
    await page.waitForTimeout(3200);
    await page.getByRole('button', { name: 'Verstuur mijn ontdekking' }).click();
    await expect(page.locator('.toast[role="status"]')).toContainText('Je tip wordt eerst even gecontroleerd');
    const { data, error } = await serviceDb().from('hidden_gems').select('*').eq('title', title).single();
    expect(error).toBeNull();
    gemId = data!.id;
    expect(data).toMatchObject({
      location_id: null,
      location_review_status: 'proposed',
      proposed_location_name: 'QA onbekende studienis',
      status: 'pending',
    });
  } finally {
    if (gemId) await serviceDb().from('hidden_gems').delete().eq('id', gemId);
  }
});

test('BRÛZE keeps its approved content without a false route link', async ({ page }) => {
  await page.goto('/gems');
  const card = page.locator('article').filter({ hasText: /Bruze/i });
  await expect(card).toBeVisible();
  await expect(card.getByText('Deze plek wacht nog op kaart- en routecontrole.')).toBeVisible();
  await expect(card.getByRole('link', { name: /Route hierheen/ })).toHaveCount(0);
  await expect(card.getByRole('link', { name: /Bekijk kaart/ })).toHaveCount(0);
});
test('real Supabase submission, photo moderation, publishing and deduplicated likes', async ({
  page,
  browser,
}) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires provisioned admin');
  const title = 'QA temporary gem ' + Date.now();
  let gemId: string | undefined;
  try {
    await page.goto('/gems');
    await page.getByRole('button', { name: 'Deel een Hidden Gem' }).click();
    await page.getByLabel('Titel', { exact: true }).fill(title);
    await page
      .getByLabel('Beschrijving')
      .fill('Temporary integration test for moderated campus submissions.');
    await page.getByRole('textbox', { name: 'Zoek een campuslocatie' }).fill('bibliotheek');
    await page.getByRole('button', { name: /Bibliotheek.*R8/i }).click();
    await page
      .getByLabel('Foto (optioneel, max. 3 MB)')
      .setInputFiles('public/maps/r8-0.webp');
    await page.waitForTimeout(3200);
    await page
      .getByRole('button', { name: 'Verstuur mijn ontdekking' })
      .click();
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
    await card.getByRole('button', { name: 'Goedkeuren / Approve' }).click();
    await expect(card.getByText('approved', { exact: true })).toBeVisible();
    await page.reload();
    const publicCard = page.locator('article').filter({ hasText: title });
    await expect(publicCard).toBeVisible();
    await expect(publicCard.getByRole('link', { name: 'Bekijk kaart' })).toHaveAttribute('href', '/map?to=library');
    await expect(publicCard.getByRole('link', { name: 'Route hierheen' })).toHaveAttribute('href', '/map?to=library&navigate=1');
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
    if (gemId) {
      const db = serviceDb();
      const { data } = await db
        .from('hidden_gems')
        .select('photo_path')
        .eq('id', gemId)
        .maybeSingle();
      await db.from('hidden_gems').delete().eq('id', gemId);
      if (data?.photo_path)
        await db.storage.from('gem-photos').remove([data.photo_path]);
    }
  }
});
test('admin links a proposed gem to one validated canonical location', async ({ page }) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires provisioned admin');
  const title = 'QA link proposal ' + Date.now();
  const { data, error } = await serviceDb().from('hidden_gems').insert({
    title,
    description: 'Temporary proposed location for the admin linking test.',
    category: 'study',
    location_id: null,
    location_review_status: 'proposed',
    proposed_location_name: 'QA proposed study spot',
    proposed_location_description: 'Exact location must be selected by a moderator.',
    status: 'pending',
    slug: crypto.randomUUID(),
  }).select('id').single();
  expect(error).toBeNull();
  try {
    await page.goto('/admin/gems');
    await page.getByLabel('E-mail', { exact: true }).fill(process.env.TEST_ADMIN_EMAIL!);
    await page.getByLabel('Wachtwoord / Password').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Inloggen / Sign in' }).click();
    const card = page.locator('article').filter({ hasText: title });
    await card.getByLabel('Canonieke locatie / Canonical location').selectOption('library');
    await expect.poll(async () => (await serviceDb().from('hidden_gems').select('location_id,location_review_status,proposed_location_name').eq('id', data!.id).single()).data).toMatchObject({
      location_id: 'library',
      location_review_status: 'approved',
      proposed_location_name: null,
    });
  } finally {
    await serviceDb().from('hidden_gems').delete().eq('id', data!.id);
  }
});

test('admin rejects a wrong-floor endpoint and validates a real endpoint', async ({ page }) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires provisioned admin');
  const id = 'qa-location-' + Date.now();
  await page.goto('/admin/locations');
  await page.getByLabel('E-mail', { exact: true }).fill(process.env.TEST_ADMIN_EMAIL!);
  await page.getByLabel('Wachtwoord / Password').fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Inloggen / Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Nieuw / New' })).toBeVisible();
  const base = {
    id,
    name: { nl: 'QA tijdelijke locatie', en: 'QA temporary location' },
    description: { nl: 'Wordt na de test verwijderd.', en: 'Removed after the test.' },
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
    expect((await page.request.post('/api/admin/locations', { data: base })).status()).toBe(200);
    expect((await page.request.post('/api/admin/locations', { data: { ...base, node_id: 'plan-R10-3-29_96-47_066' } })).status()).toBe(400);
    expect((await page.request.post('/api/admin/locations', { data: { ...base, node_id: 'plan-R8-0-14-29_2', status: 'approved', verification_status: 'verified' } })).status()).toBe(200);
    const saved = await serviceDb().from('locations').select('node_id,routing_status,endpoint_source,status,verification_status').eq('id', id).single();
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
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Routing health' })).toBeVisible();
  await expect(page.getByText('100%')).toBeVisible();
  await page.goto('/admin/locations');
  await expect(page.getByRole('columnheader', { name: 'Endpoint-node' })).toBeVisible();
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
