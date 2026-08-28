import { mkdirSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

const target = process.env.PLAYWRIGHT_BASE_URL ? 'vercel' : 'local';
const visualDir = 'test-results/visual-qa';

mkdirSync(visualDir, { recursive: true });

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth, `horizontal overflow: ${JSON.stringify(overflow)}`).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

async function expectInsideViewportHorizontally(page: Page, locator: Locator, name: string) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();
  expect(viewport, `${name}: viewport missing`).not.toBeNull();
  expect(box, `${name}: element has no bounding box`).not.toBeNull();
  if (!viewport || !box) return;
  expect(box.x, `${name}: starts outside viewport`).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width, `${name}: exceeds viewport width`).toBeLessThanOrEqual(viewport.width + 1);
}

async function expectInsideViewportVertically(page: Page, locator: Locator, name: string) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();
  expect(viewport, `${name}: viewport missing`).not.toBeNull();
  expect(box, `${name}: element has no bounding box`).not.toBeNull();
  if (!viewport || !box) return;
  expect(box.y, `${name}: starts above viewport`).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height, `${name}: falls below viewport`).toBeLessThanOrEqual(viewport.height + 1);
}

async function openSceneList(page: Page) {
  await page.getByRole('button', { name: 'Scene list' }).click();
  const scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await expect(scene).toBeVisible();
  return scene;
}

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  return errors;
}

test('visual QA: Roosevelt lobby, floor 3, basement and free camera fit 1280x720', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: /Start investigation|Continue investigation/i }).click();
  await expect(page.getByLabel(/investigation scene: Lobby \/ First Floor/i)).toBeVisible();
  await page.waitForTimeout(350);

  await expectNoHorizontalOverflow(page);
  await expectInsideViewportHorizontally(page, page.locator('.topbar'), 'topbar');
  await expectInsideViewportHorizontally(page, page.locator('.game-host'), 'game scene');
  await expectInsideViewportHorizontally(page, page.locator('.evidence-board'), 'evidence board');
  await expectInsideViewportHorizontally(page, page.locator('.detective-thought'), 'detective thought');
  await expectInsideViewportVertically(page, page.locator('.detective-thought'), 'detective thought');
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
  await page.screenshot({ path: `${visualDir}/${target}-1280x720-roosevelt-lobby.png`, fullPage: false });

  let scene = await openSceneList(page);
  await scene.getByRole('button', { name: /Elevator to third floor \/ Room 307/i }).click();
  await expect(page.getByLabel(/investigation scene: Third Floor \/ Room 307/i)).toBeVisible();
  await page.waitForTimeout(350);
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
  await page.screenshot({ path: `${visualDir}/${target}-1280x720-roosevelt-floor3.png`, fullPage: false });

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.55);
    await page.mouse.wheel(0, -420);
    await page.keyboard.down('d');
    await page.waitForTimeout(220);
    await page.keyboard.up('d');
    await page.waitForTimeout(100);
    expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
    await page.screenshot({ path: `${visualDir}/${target}-1280x720-roosevelt-floor3-panzoom.png`, fullPage: false });
    await page.keyboard.press('f');
  }

  scene = await openSceneList(page);
  await scene.getByRole('button', { name: /Service elevator to basement/i }).click();
  await expect(page.getByLabel(/investigation scene: Basement \/ Service/i)).toBeVisible();
  await page.waitForTimeout(350);
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
  await page.screenshot({ path: `${visualDir}/${target}-1280x720-roosevelt-basement.png`, fullPage: false });
});

test('visual QA: compact 600x800 layout stays usable', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 600, height: 800 });
  await page.goto('/');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${visualDir}/${target}-600x800-menu.png`, fullPage: false });

  await page.getByRole('button', { name: /Start investigation|Continue investigation/i }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(350);
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
  await expectNoHorizontalOverflow(page);
  await expectInsideViewportHorizontally(page, page.locator('.topbar'), 'compact topbar');
  await expectInsideViewportHorizontally(page, page.locator('.game-host'), 'compact game scene');
  await expectInsideViewportHorizontally(page, page.locator('.evidence-board'), 'compact evidence board');

  const sceneList = await openSceneList(page);
  await expectInsideViewportHorizontally(page, sceneList, 'compact scene list');
  await expectNoHorizontalOverflow(page);

  await page.screenshot({ path: `${visualDir}/${target}-600x800-scene-list.png`, fullPage: true });
});
