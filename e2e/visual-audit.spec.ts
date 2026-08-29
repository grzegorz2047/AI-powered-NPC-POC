import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

type VisualAuditReport = {
  mapId: string;
  errors: string[];
  metrics: {
    wallCount: number;
    perspectiveCorrectCount: number;
    sconceCount: number;
    minimumWallHeight: number;
    duplicateWallCount: number;
    walkableCollisionConflicts: number;
  };
};

const auditDirectory = path.resolve('test-results/visual-audit');

async function readAudit(page: Page, expectedMapId: string) {
  await expect.poll(
    () => page.evaluate(() => (
      window as typeof window & { __NOCTURNE_VISUAL_AUDIT__?: { report?: { mapId?: string } } }
    ).__NOCTURNE_VISUAL_AUDIT__?.report?.mapId ?? null),
    { timeout: 10_000 },
  ).toBe(expectedMapId);

  return page.evaluate(() => (
    window as typeof window & { __NOCTURNE_VISUAL_AUDIT__?: { report?: VisualAuditReport } }
  ).__NOCTURNE_VISUAL_AUDIT__?.report ?? null);
}

async function setAuditOverlay(page: Page, visible: boolean) {
  await page.evaluate((nextVisible) => {
    const bridge = (
      window as typeof window & { __NOCTURNE_VISUAL_AUDIT__?: { setOverlay?: (visible: boolean) => void } }
    ).__NOCTURNE_VISUAL_AUDIT__;
    bridge?.setOverlay?.(nextVisible);
  }, visible);
}

async function captureVisualState(page: Page, slug: string, mapId: string) {
  const report = await readAudit(page, mapId);
  expect(report, `${mapId} must expose a visual audit report`).not.toBeNull();
  await page.waitForTimeout(250);

  await setAuditOverlay(page, false);
  await page.screenshot({
    path: path.join(auditDirectory, `${slug}-game.png`),
    fullPage: true,
    animations: 'disabled',
  });
  await page.locator('canvas').screenshot({
    path: path.join(auditDirectory, `${slug}-canvas.png`),
    animations: 'disabled',
  });

  await setAuditOverlay(page, true);
  await page.screenshot({
    path: path.join(auditDirectory, `${slug}-geometry-audit.png`),
    fullPage: true,
    animations: 'disabled',
  });
  await setAuditOverlay(page, false);

  fs.writeFileSync(path.join(auditDirectory, `${slug}-report.json`), JSON.stringify(report, null, 2));
  return report as VisualAuditReport;
}

async function openSceneList(page: Page) {
  await page.getByRole('button', { name: 'Scene list' }).click();
  return page.getByRole('dialog', { name: 'Accessible investigation scene' });
}

test('visual game audit captures every hotel level and rejects fake upright walls', async ({ page }) => {
  test.setTimeout(90_000);
  fs.mkdirSync(auditDirectory, { recursive: true });
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: /Start investigation/i }).click();
  await expect(page.getByLabel(/investigation scene: Lobby \/ First Floor/i)).toBeVisible();

  const reports: VisualAuditReport[] = [];
  reports.push(await captureVisualState(page, '01-lobby', 'roosevelt-lobby'));

  let scene = await openSceneList(page);
  await scene.getByRole('button', { name: /Elevator to third floor \/ Room 307/i }).click();
  await expect(page.getByLabel(/investigation scene: Third Floor \/ Room 307/i)).toBeVisible();
  reports.push(await captureVisualState(page, '02-floor-3', 'roosevelt-floor-3'));

  scene = await openSceneList(page);
  await scene.getByRole('button', { name: /Elevator to lobby/i }).click();
  await expect(page.getByLabel(/investigation scene: Lobby \/ First Floor/i)).toBeVisible();
  scene = await openSceneList(page);
  await scene.getByRole('button', { name: /Service elevator to basement/i }).click();
  await expect(page.getByLabel(/investigation scene: Basement \/ Service/i)).toBeVisible();
  reports.push(await captureVisualState(page, '03-basement', 'roosevelt-basement'));

  fs.writeFileSync(path.join(auditDirectory, 'browser-errors.json'), JSON.stringify(browserErrors, null, 2));

  for (const report of reports) {
    expect.soft(report.metrics.wallCount, `${report.mapId} needs enough architecture to read as a room`).toBeGreaterThan(8);
    expect.soft(report.metrics.perspectiveCorrectCount, `${report.mapId} cannot contain pasted upright wall rectangles`).toBe(report.metrics.wallCount);
    expect.soft(report.metrics.minimumWallHeight, `${report.mapId} walls must read as full-height cutaway architecture`).toBeGreaterThanOrEqual(148);
    expect.soft(report.metrics.duplicateWallCount, `${report.mapId} cannot double-stack wall segments`).toBe(0);
    expect.soft(report.metrics.walkableCollisionConflicts, `${report.mapId} walls cannot cross legal walkable edges`).toBe(0);
    expect.soft(report.metrics.sconceCount, `${report.mapId} needs warm architectural lighting`).toBeGreaterThan(0);
    expect.soft(report.errors, `${report.mapId} visual geometry errors`).toEqual([]);
  }

  expect.soft(browserErrors, 'visual pass must not introduce browser/runtime errors').toEqual([]);
});
