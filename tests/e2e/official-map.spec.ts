import { test, expect } from '@playwright/test';

async function hotspotSize(
  page: import('@playwright/test').Page,
  selector: string,
) {
  const bounds = await page.locator(selector).boundingBox();
  expect(bounds).not.toBeNull();
  return bounds!;
}

test('all eight original floor plans load and the mobile plan fits before zooming', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await expect(
    page.getByRole('region', { name: 'Plattegrond NHL Stenden', exact: true }),
  ).toBeVisible();
  for (const building of ['R8', 'R10']) {
    await page.getByRole('button', { name: building, exact: true }).click();
    for (let floor = 0; floor < 4; floor++) {
      await page
        .getByRole('button', { name: 'Verdieping ' + floor, exact: true })
        .click();
      const image = page.getByRole('img', {
        name: `NHL Stenden-plattegrond, ${building}, verdieping ${floor}`,
      });
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute(
        'src',
        `/maps/${building.toLowerCase()}-${floor}.webp`,
      );
      await expect
        .poll(() =>
          image.evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 1000,
          ),
        )
        .toBe(true);
      const bounds = await image.boundingBox();
      expect(bounds?.width).toBeLessThanOrEqual(320);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page.getByRole('button', { name: 'Inzoomen', exact: true }).click();
  await page
    .getByRole('button', { name: 'Kaart herstellen', exact: true })
    .click();
});

test('information marker shrinks visually while its touch target stays usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const marker = page.getByRole('button', {
    name: 'Selecteer Canteen',
    exact: true,
  });
  const visual = page.getByTestId('hotspot-visual-canteen');
  await expect(marker).toBeVisible();
  const beforeVisual = await hotspotSize(
    page,
    '[data-testid="hotspot-visual-canteen"]',
  );
  const beforeTarget = await marker.boundingBox();
  expect(beforeTarget?.width).toBeGreaterThanOrEqual(40);
  expect(beforeTarget?.height).toBeGreaterThanOrEqual(40);

  await page.getByRole('button', { name: 'Inzoomen', exact: true }).click();
  await page.getByRole('button', { name: 'Inzoomen', exact: true }).click();
  await page.waitForTimeout(500);

  const afterVisual = await visual.boundingBox();
  const afterTarget = await marker.boundingBox();
  expect(afterVisual).not.toBeNull();
  expect(afterVisual!.width).toBeLessThan(beforeVisual.width - 1);
  expect(afterTarget?.width).toBeGreaterThanOrEqual(40);
  expect(afterTarget?.width).toBeLessThanOrEqual(46);
  expect(afterTarget?.height).toBeGreaterThanOrEqual(40);
  await marker.click();
  await expect(marker).toHaveAttribute('aria-pressed', 'true');
  await expect(visual).toHaveText('i');
});

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`selected official hotspot remains visible beside its panel on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const marker = page.getByRole('button', {
      name: 'Selecteer Canteen',
      exact: true,
    });
    await marker.click();
    await expect(
      page.getByRole('region', { name: 'Locatiedetails' }),
    ).toBeVisible();
    await expect(marker).toHaveAttribute('aria-pressed', 'true');
    await expect(marker.locator('.hotspot-visual')).toHaveText('i');
    await expect(marker.locator('.selected-map-label')).toHaveCount(0);
    await page.waitForTimeout(500);

    const markerBounds = await marker.boundingBox();
    const panelBounds = await page
      .getByRole('region', { name: 'Locatiedetails' })
      .boundingBox();
    expect(markerBounds).not.toBeNull();
    expect(panelBounds).not.toBeNull();
    expect(markerBounds!.x + markerBounds!.width).toBeGreaterThan(0);
    expect(markerBounds!.x).toBeLessThan(viewport.width);
    expect(markerBounds!.y + markerBounds!.height).toBeGreaterThan(0);
    expect(markerBounds!.y).toBeLessThan(viewport.height);
    const fullyBehindPanel =
      markerBounds!.x >= panelBounds!.x &&
      markerBounds!.x + markerBounds!.width <=
        panelBounds!.x + panelBounds!.width &&
      markerBounds!.y >= panelBounds!.y &&
      markerBounds!.y + markerBounds!.height <=
        panelBounds!.y + panelBounds!.height;
    expect(fullyBehindPanel).toBe(false);

    await page.getByRole('button', { name: 'Details sluiten' }).click();
    await expect(
      page.getByRole('region', { name: 'Locatiedetails' }),
    ).toHaveCount(0);
    await expect(marker).toHaveAttribute('aria-pressed', 'false');
  });
}
