import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const release = pathToFileURL(resolve('release/Donkey-Face.html')).href;
const showUrl = 'http://127.0.0.1:4173/Donkey-Face.html';
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('donkeyface.show.v1')));
async function openShow(page) {
  await page.goto(showUrl);
  await expect(page.getByRole('heading', { name: 'Good music. Great visuals.' })).toBeVisible();
}

test.beforeEach(async ({ context }) => {
  // Load the actual release through the Node HTTP server. Reject every other
  // network destination so embedded assets cannot silently depend on a CDN.
  await context.route('**/*', route => {
    if (route.request().url().startsWith('file:')) return route.continue();
    if (new URL(route.request().url()).origin === new URL(showUrl).origin) return route.continue();
    return route.abort();
  });
});

test('direct local-file startup where permitted by browser policy', async ({ page }) => {
  try { await page.goto(release); }
  catch (error) {
    if (String(error).includes('ERR_BLOCKED_BY_ADMINISTRATOR')) test.skip(true, 'Cloud browser policy blocks file://; the release is tested over HTTP in the other cases.');
    throw error;
  }
  await expect(page.locator('#preview')).toBeVisible();
});

test('release loads over HTTP without external assets and syncs controls through the opener', async ({ page, context }) => {
  const errors = [], network = [];
  context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  page.on('pageerror', e => errors.push(e.message));
  context.on('request', request => { if (!request.url().startsWith(showUrl) && !request.url().startsWith('data:')) network.push(request.url()); });
  // Exercise the window.opener transport independently of origin-based storage/BC.
  await context.addInitScript(() => {
    window.BroadcastChannel = undefined;
    const original = window.addEventListener.bind(window);
    window.addEventListener = (type, ...args) => { if (type !== 'storage') original(type, ...args); };
  });
  await openShow(page);
  const [stage] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: 'Open stage window' }).click()]);
  await expect(stage.locator('#stage-canvas')).toBeVisible();
  await expect(page.locator('#stage-status')).toHaveText('Stage connected', { timeout: 6000 });
  await page.getByRole('listitem', { name: 'Play Run Away', exact: true }).click();
  await expect.poll(async () => (await state(stage))?.song).toBe(8);
  await page.getByRole('button', { name: 'Sax spotlight' }).click();
  await expect.poll(async () => (await state(stage))?.spotlight).toBe(true);
  await stage.keyboard.press('ArrowRight');
  await expect(page.locator('#current-title')).toHaveText('Shut Up and Dance');
  await page.getByRole('button', { name: 'Blackout', exact: true }).click();
  await expect.poll(async () => stage.locator('canvas').evaluate(c => [...c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data])).toEqual([0, 0, 0, 255]);
  await stage.keyboard.press('b');
  await expect(page.getByRole('button', { name: 'Blackout', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(network).toEqual([]); expect(errors).toEqual([]);
});

test('server sends the exact release bytes, supports stage queries and HEAD, and limits file access', async ({ request }) => {
  const url = 'http://127.0.0.1:4173';
  const html = await readFile(resolve('release/Donkey-Face.html'));
  const root = await request.get(url);
  expect(root.status()).toBe(200);
  expect(await root.body()).toEqual(html);
  expect(root.headers()['content-type']).toBe('text/html; charset=utf-8');
  const stage = await request.get(`${showUrl}?stage=1`);
  expect(await stage.body()).toEqual(html);
  const head = await request.head(showUrl);
  expect(head.status()).toBe(200);
  expect(head.headers()['content-length']).toBe(String(html.length));
  expect((await head.body()).length).toBe(0);
  expect((await request.get(`${url}/package.json`)).status()).toBe(404);
  expect((await request.get(`${url}/%2e%2e%2fpackage.json`)).status()).toBe(404);
  expect((await request.post(showUrl)).status()).toBe(405);
});

test('normal HTTP window synchronization works with browser messaging enabled', async ({ page }) => {
  await openShow(page);
  const [stage] = await Promise.all([page.waitForEvent('popup'), page.locator('#open-stage').click()]);
  await expect(page.locator('#stage-status')).toHaveText('Stage connected');
  await page.getByRole('listitem', { name: 'Play Sweet Dreams', exact: true }).click();
  await expect.poll(async () => (await state(stage))?.song).toBe(3);
  await page.locator('#blackout').click();
  await expect.poll(async () => stage.locator('canvas').evaluate(c => [...c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data])).toEqual([0, 0, 0, 255]);
  await stage.keyboard.press('ArrowRight');
  await expect(page.locator('#current-title')).toHaveText('Viva La Vida');
  await stage.close();
  await expect(page.locator('#stage-status')).toHaveText('Stage not connected', { timeout: 6000 });
});

test('each song renders a different scene; tap tempo, pause, and manual tempo work', async ({ page }) => {
  test.setTimeout(60000); // Ten real scene transitions plus tempo/transport interaction.
  await openShow(page);
  const hashes = [];
  for (let i = 0; i < 10; i++) {
    await page.locator(`[data-song="${i}"]`).click();
    await page.waitForTimeout(1200);
    hashes.push(await page.locator('#preview').evaluate(c => {
      const pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let hash = 2166136261;
      for (let p = 0; p < pixels.length; p += 97) hash = Math.imul(hash ^ pixels[p], 16777619);
      return hash >>> 0;
    }));
    await expect(page.locator('#current-title')).toHaveText(['Seven Nation Army', 'Uprising', 'Take On Me', 'Sweet Dreams', 'Viva La Vida', 'Hun er forelska i lærer’n', 'Sex on Fire', 'Teenage Dirtbag', 'Run Away', 'Shut Up and Dance'][i]);
  }
  expect(new Set(hashes).size).toBe(10);
  // Clock-driven taps avoid timing jitter in a busy headless browser.
  await page.clock.install({ time: new Date('2026-10-23T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-23T12:00:01Z'));
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Space'); await page.clock.runFor(500); }
  await expect(page.locator('#bpm-input')).toHaveValue('120');
  await expect(page.locator('#tap-help')).toContainText('8 taps averaged');
  await page.getByRole('button', { name: 'Pause motion' }).click();
  await page.clock.runFor(200);
  const frozen = await page.locator('#preview').evaluate(c => c.toDataURL());
  await page.clock.runFor(800);
  expect(await page.locator('#preview').evaluate(c => c.toDataURL())).toBe(frozen);
  await page.getByRole('button', { name: 'Resume motion' }).click();
  await page.locator('#bpm-input').fill('140'); await page.locator('#bpm-input').press('Tab');
  await expect(page.locator('#tempo-source')).toHaveText('Manual tempo');
  expect((await state(page)).bpm).toBe(140);
});

test('scene library, artwork, and exported show work on a fresh machine', async ({ page, browser }) => {
  await openShow(page);
  await page.getByRole('button', { name: 'Scene library' }).click();
  await expect(page.locator('.scene-card')).toHaveCount(10);
  await page.locator('[data-scene="3"]').click();
  await expect(page.locator('#current-title')).toHaveText('Sweet Dreams');
  await page.getByRole('button', { name: 'Show settings' }).click();
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
  await page.locator('#art-upload').setInputFiles({ name: 'custom-logo.png', mimeType: 'image/png', buffer: image });
  await expect(page.locator('#artwork-status')).toContainText('Custom artwork loaded');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save show file' }).click()]);
  const path = resolve('test-results/Exported-show.html'); await download.saveAs(path);
  const exported = await readFile(path, 'utf8');
  expect(exported).toContain('donkeyface-show-data');
  // Serve the downloaded export as a real file on a separate local server too.
  const exportUrl = 'http://127.0.0.1:4174/';
  const exportServer = spawn(process.execPath, ['scripts/serve.mjs', '--port', '4174', '--file', path], { stdio: 'ignore' });
  const fresh = await browser.newContext();
  try {
    await expect.poll(async () => { try { return (await fetch(exportUrl)).status; } catch { return 0; } }).toBe(200);
    await fresh.route('**/*', route => new URL(route.request().url()).origin === new URL(exportUrl).origin ? route.continue() : route.abort());
    const other = await fresh.newPage();
    const errors = []; other.on('pageerror', e => errors.push(e.message));
    await other.goto(exportUrl);
    await expect(other.locator('#current-title')).toHaveText('Sweet Dreams');
    expect(await other.evaluate(() => localStorage.getItem('donkeyface.artwork.v1'))).toContain('data:image/png;base64,');
    expect(errors).toEqual([]);
  } finally { await fresh.close(); exportServer.kill(); }
});

test('mobile controls fit the screen and keyboard shortcuts do not steal input focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openShow(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('#bpm-input').focus(); await page.keyboard.press('b');
  expect((await state(page))?.blackout ?? false).toBe(false);
  await page.getByRole('listitem', { name: 'Play Uprising', exact: true }).click();
  await page.keyboard.press('b');
  await expect(page.getByRole('button', { name: 'Restore stage' })).toBeVisible();
  await page.getByRole('button', { name: 'Compact desk' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('listitem', { name: 'Play Shut Up and Dance' })).toBeVisible();
});
