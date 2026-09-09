import {test,expect} from '@playwright/test';
for(const width of [1280,320])test(`clickable opening hours work at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:800});
  await page.goto('/');
  await page.getByRole('button',{name:'Openingstijden van Bibliotheek',exact:true}).click();
  const hours=page.getByRole('region',{name:'Openingstijden: Bibliotheek',exact:true});
  await expect(hours).toBeVisible();
  await expect(hours).toBeFocused();
  await expect(hours.getByText('08:30–17:00',{exact:true})).toHaveCount(5);
  await expect(hours.getByText('Niet bevestigd',{exact:true})).toHaveCount(2);
  await expect(hours.getByRole('link')).toHaveAttribute('href',/nhlstenden.com\/bibliotheek/);
  await page.locator('.map-places').getByRole('button',{name:'Café IF',exact:true}).click();
  await expect(page.getByRole('region',{name:'Openingstijden: Café IF',exact:true})).toContainText('nog niet bevestigd');
  await page.getByRole('button',{name:'Switch to English'}).click();
  await expect(page.getByRole('region',{name:'Opening hours: Café IF',exact:true})).toContainText('not confirmed');
});
