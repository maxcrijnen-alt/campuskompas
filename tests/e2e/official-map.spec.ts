import {test,expect} from '@playwright/test';

test('all eight original floor plans load and the mobile plan fits before zooming',async({page})=>{
  await page.setViewportSize({width:320,height:740});
  await page.goto('/');
  await expect(page.getByRole('button',{name:'NHL Stenden-plattegrond',exact:true})).toHaveAttribute('aria-pressed','true');
  for(const building of ['R8','R10']){
    await page.getByRole('button',{name:building,exact:true}).click();
    for(let floor=0;floor<4;floor++){
      await page.getByRole('button',{name:'Verdieping '+floor,exact:true}).click();
      const image=page.getByRole('img',{name:`NHL Stenden-plattegrond, ${building}, verdieping ${floor}`});
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute('src',`/maps/${building.toLowerCase()}-${floor}.webp`);
      await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>1000)).toBe(true);
      const bounds=await image.boundingBox();
      expect(bounds?.width).toBeLessThanOrEqual(300);
      await expect(page.getByRole('link',{name:'Originele PDF ↗'})).toHaveAttribute('href',new RegExp('#page='+((building==='R8'?18:22)+floor)+'$'));
    }
  }
  await page.getByRole('button',{name:'Inzoomen',exact:true}).click();
  await page.getByRole('button',{name:'Kaart herstellen',exact:true}).click();
});
