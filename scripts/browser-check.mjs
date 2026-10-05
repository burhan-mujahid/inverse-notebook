import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await mkdir('artifacts', { recursive: true });
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks++; };
const value = selector => page.locator(selector).inputValue().then(Number);
const status = () => page.locator('#app').getAttribute('data-status');
const baseline = () => page.locator('#baseline-value').textContent();
const setTarget = async mm => { await page.locator('#target-input').fill(String(mm)); };
const reset = async () => { await page.locator('#reset-button').click(); };

try {
  await page.goto(baseURL);
  await page.locator('#tip-handle').waitFor();
  ok(await baseline() === '14.49 mm', 'Default forward calculation renders correctly.');
  ok(await status() === 'solved', 'Initial state is feasible.');
  ok(await page.locator('#apply-button').isDisabled(), 'No-op proposal cannot be applied.');
  await page.screenshot({ path: 'artifacts/notebook-initial.png', fullPage: true });

  await page.locator('#example-button').click();
  ok(await status() === 'solved', 'Example target creates a feasible proposal.');
  ok(await value('#input-width') === 40 && await value('#input-thickness') === 12, 'Preview does not alter committed input fields.');
  ok(await page.locator('.change-row').count() === 2, 'Both unlocked parameter changes are explained.');
  await page.screenshot({ path: 'artifacts/notebook-desktop.png', fullPage: true });
  await page.locator('#apply-button').click();
  ok(await baseline() === '8.00 mm', 'Apply commits the actual target result.');
  ok(Math.abs(await value('#input-thickness') - 14.476853144) < 0.00001, 'Rendered thickness agrees with the mathematical solution.');
  await page.locator('#undo-button').click();
  ok(await baseline() === '14.49 mm', 'Undo restores original model.');
  await page.locator('#redo-button').click();
  ok(await baseline() === '8.00 mm', 'Redo restores applied model.');
  await page.reload();
  ok(await baseline() === '8.00 mm', 'Local storage survives reload.');

  await reset();
  await page.locator('#lock-width').click();
  await setTarget(8);
  ok(await page.locator('.change-row').count() === 1, 'Locking width leaves only a thickness change.');
  await page.locator('#apply-button').click();
  ok(await value('#input-width') === 40, 'A locked parameter stays exact on Apply.');
  await page.locator('#undo-button').click();
  await setTarget(100);
  ok(await status() === 'unreachable', 'Impossible target has explicit unreachable status.');
  ok(await page.locator('#apply-button').isDisabled(), 'Impossible target cannot be applied.');
  ok(await value('#target-input') === 100, 'Unreachable target is not silently clamped.');
  await page.screenshot({ path: 'artifacts/notebook-unreachable.png', fullPage: true });
  await page.locator('#nearest-button').click();
  ok(await status() === 'solved', 'Explicit nearest reachable target solves at its boundary.');
  ok(Math.abs(await value('#target-input') - 30) < 0.001, 'Reachable boundary respects model deflection limit.');

  await reset();
  await page.locator('#lock-width').click();
  await page.locator('#lock-thickness').click();
  await setTarget(8);
  ok(await status() === 'unreachable', 'All-locked inverse request fails explicitly.');
  await reset();
  await setTarget(0);
  ok(await status() === 'invalid' && await page.locator('#apply-button').isDisabled(), 'Nonpositive target is invalid.');
  await page.locator('#cancel-button').click();
  const originalForce = await value('#input-force');
  await page.locator('#input-force').fill('0');
  await page.locator('#input-force').press('Tab');
  ok(await page.locator('#error-force').isVisible(), 'Invalid forward input has a field error.');
  ok(await baseline() === '14.49 mm', 'Invalid forward input preserves the committed model.');
  await reset();
  ok(await value('#input-force') === originalForce, 'Reset clears invalid field contents.');

  await page.locator('#tip-handle').focus();
  const beforeKey = await value('#target-input');
  await page.keyboard.press('ArrowUp');
  ok(Math.abs(await value('#target-input') - (beforeKey - 0.1)) < 0.001, 'Keyboard slider uses the same target path.');
  await page.keyboard.press('Escape');
  ok(await page.locator('#apply-button').isDisabled(), 'Escape cancels the preview.');
  const handle = await page.locator('#tip-handle').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 - 22, { steps: 8 });
  await page.mouse.up();
  ok(await value('#target-input') < beforeKey - 1, 'Pointer dragging changes the desired output.');
  ok(await baseline() === '14.49 mm', 'Pointer dragging is a preview, not a commit.');

  await reset();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-button').click();
  const download = await downloadPromise;
  const exported = await readFile(await download.path(), 'utf8');
  ok(JSON.parse(exported).params.force === 80, 'Export contains the committed state.');
  await page.locator('#material-select').selectOption('steel');
  await page.locator('#import-file').setInputFiles({ name: 'notebook.json', mimeType: 'application/json', buffer: Buffer.from(exported) });
  await page.waitForFunction(() => document.querySelector('#material-select').value === 'aluminum');
  ok(await baseline() === '14.49 mm', 'Import restores a complete exported notebook.');
  await page.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('not valid JSON'));
  ok(await baseline() === '14.49 mm', 'Failed import is nondestructive.');

  await page.locator('#guide-button').click();
  ok(await page.locator('#guide-dialog').isVisible(), 'Guide is a working modal.');
  await page.keyboard.press('Escape');
  ok(!await page.locator('#guide-dialog').isVisible(), 'Guide closes with Escape.');
  await page.locator('#example-button').click();
  await page.waitForFunction(() => document.querySelector('#toast').hidden);
  await page.setViewportSize({ width: 375, height: 812 });
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), '375px layout has no horizontal document overflow.');
  await page.screenshot({ path: 'artifacts/notebook-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), '320px layout has no horizontal document overflow.');

  const mobileHit = await page.locator('#tip-handle .handle-hit').boundingBox();
  ok(mobileHit.width >= 44 && mobileHit.height >= 44, 'Mobile handle has a usable touch area.');

  const touchContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(baseURL);
  const hit = await touchPage.locator('#tip-handle .handle-hit').boundingBox();
  const session = await touchContext.newCDPSession(touchPage);
  const point = { x: hit.x + hit.width / 2, y: hit.y + hit.height / 2 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x, y: point.y - 12 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  ok(Number(await touchPage.locator('#target-input').inputValue()) < 14, 'Touch dragging adjusts deflection on a mobile viewport.');
  await touchContext.close();

  const recoveryContext = await browser.newContext();
  await recoveryContext.addInitScript(() => localStorage.setItem('inverse.notebook.v1', '{broken'));
  const recoveryPage = await recoveryContext.newPage();
  await recoveryPage.goto(baseURL);
  ok(await recoveryPage.locator('#notice').isVisible(), 'Corrupt saved state shows a recovery notice.');
  ok(await recoveryPage.locator('#baseline-value').textContent() === '14.49 mm', 'Corrupt saved state falls back to documented defaults.');
  await recoveryContext.close();

  const blockedContext = await browser.newContext();
  await blockedContext.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
  });
  const blockedPage = await blockedContext.newPage();
  await blockedPage.goto(baseURL);
  ok((await blockedPage.locator('#save-status').textContent()).includes('Unsaved'), 'Storage failure is visible.');
  await blockedPage.locator('#example-button').click();
  await blockedPage.locator('#apply-button').click();
  ok(await blockedPage.locator('#baseline-value').textContent() === '8.00 mm', 'Computation remains usable without storage.');
  await blockedContext.close();

  const custom = JSON.parse(exported); custom.weights.width = 1.5;
  await page.locator('#import-file').setInputFiles({ name: 'custom.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(custom)) });
  await page.waitForFunction(() => document.querySelector('#weight-width').value === '1.5');
  ok(await value('#weight-width') === 1.5, 'Valid imported custom resistance remains visible.');

  const contrast = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const luminance = token => {
      ctx.fillStyle = css.getPropertyValue(token).trim(); ctx.fillRect(0, 0, 1, 1);
      const rgb = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map(v => {
        v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    return Object.fromEntries(['--ink', '--muted', '--primary', '--success', '--warning'].map(token => [token, ratio(luminance(token), luminance('--bg'))]));
  });
  for (const [token, ratio] of Object.entries(contrast)) ok(ratio >= 4.5, `${token} text contrast is at least 4.5:1.`);
  ok(errors.length === 0, `No browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({ checks, browser: await browser.version(), baseURL, contrast, screenshots: ['notebook-initial.png', 'notebook-desktop.png', 'notebook-unreachable.png', 'notebook-mobile.png'], errors }, null, 2));
} finally { await browser.close(); }
