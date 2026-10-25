import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

test('Pages homepage and stage work under the repository site path', async ({ page, context }) => {
  const html = await readFile('dist-pages/index.html');
  expect(html).toEqual(await readFile('release/Donkey-Face.html'));
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path !== '/donkeyface-vibes/') { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(html);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const url = `${origin}/donkeyface-vibes/`;
  const requests = [], errors = [];
  context.on('request', request => { if (!request.url().startsWith('data:')) requests.push(request.url()); });
  context.on('page', popup => popup.on('pageerror', error => errors.push(error.message)));
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  try {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Good music. Great visuals.' })).toBeVisible();
    const [stage] = await Promise.all([page.waitForEvent('popup'), page.locator('#open-stage').click()]);
    await expect(stage).toHaveURL(`${url}?stage=1`);
    await expect(stage.locator('canvas')).toBeVisible();
    await expect(page.locator('#stage-status')).toHaveText('Stage connected');
    await page.getByRole('listitem', { name: 'Play Run Away', exact: true }).click();
    await stage.keyboard.press('ArrowRight');
    await expect(page.locator('#current-title')).toHaveText('Shut Up and Dance');
    await page.locator('#blackout').click();
    await expect.poll(() => stage.locator('canvas').evaluate(canvas => [...canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data])).toEqual([0, 0, 0, 255]);
    await page.getByRole('link', { name: 'Donkey Face home' }).click();
    await expect(page).toHaveURL(url);
    expect(errors).toEqual([]);
    expect(requests.every(request => request.startsWith(url))).toBe(true);
    await stage.close();
  } finally { await new Promise(resolve => server.close(resolve)); }
});
