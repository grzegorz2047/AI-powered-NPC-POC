import { expect, test } from '@playwright/test';

test('mockup visual pass applies only after Roosevelt scene assets are ready', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start investigation/i }).click();

  const host = page.getByLabel(/investigation scene: Lobby \/ First Floor/i);
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-mockup-visual-pass', 'applied');
});
