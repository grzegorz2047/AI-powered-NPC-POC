import { expect, test } from '@playwright/test';

test('mockup visual pass applies only after Roosevelt scene assets are ready', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start investigation/i }).click();

  const host = page.getByLabel(/investigation scene: Lobby \/ First Floor/i);
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-mockup-visual-pass', 'applied');
});

test('approved mockup chrome stays present around the Phaser scene', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start investigation/i }).click();

  await expect(page.getByRole('heading', { name: 'Hotel Nocturne' })).toBeVisible();
  await expect(page.getByText('A place where stories stay')).toBeVisible();
  await expect(page.getByText('Evidence & Clues')).toBeVisible();
  await expect(page.locator('.evidence-card')).toHaveCount(7);
  await expect(page.locator('.detective-portrait img')).toBeVisible();
});
