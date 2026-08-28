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

test('visual QA: investigation layout fits 1280x720', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: /Start investigation|Continue investigation/i }).click();
  await expect(page.locator('canvas')).toBeVisible();

  await expectNoHorizontalOverflow(page);
  await expectInsideViewportHorizontally(page, page.locator('.topbar'), 'topbar');
  await expectInsideViewportHorizontally(page, page.locator('.game-host'), 'game scene');
  await expectInsideViewportHorizontally(page, page.locator('.evidence-board'), 'evidence board');
  await expectInsideViewportHorizontally(page, page.locator('.detective-thought'), 'detective thought');

  await page.screenshot({ path: `${visualDir}/${target}-1280x720-investigation.png`, fullPage: false });
});

test('visual QA: compact 600x800 layout stays usable', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await page.goto('/');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${visualDir}/${target}-600x800-menu.png`, fullPage: false });

  await page.getByRole('button', { name: /Start investigation|Continue investigation/i }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectInsideViewportHorizontally(page, page.locator('.topbar'), 'compact topbar');
  await expectInsideViewportHorizontally(page, page.locator('.game-host'), 'compact game scene');
  await expectInsideViewportHorizontally(page, page.locator('.evidence-board'), 'compact evidence board');

  await page.getByRole('button', { name: 'Scene list' }).click();
  const sceneList = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await expect(sceneList).toBeVisible();
  await expectInsideViewportHorizontally(page, sceneList, 'compact scene list');
  await expectNoHorizontalOverflow(page);

  await page.screenshot({ path: `${visualDir}/${target}-600x800-scene-list.png`, fullPage: true });
});
