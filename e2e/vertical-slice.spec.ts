import { expect, test } from '@playwright/test';

test('menu -> evidence -> new lead -> rules interview works in a real browser', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Room 307' })).toBeVisible();
  await page.getByRole('button', { name: /Start investigation/i }).click();
  await expect(page.locator('canvas')).toBeVisible();

  await page.getByRole('button', { name: 'Scene list' }).click();
  await expect(page.getByRole('dialog', { name: 'Accessible investigation scene' })).toBeVisible();
  await page.getByRole('button', { name: /Inspect clue: Master keycard log/i }).click();

  await expect(page.getByRole('heading', { name: 'Master keycard log' })).toBeVisible();
  await expect(page.getByText('NEW LEAD').first()).toBeVisible();

  await page.getByRole('button', { name: /Nina Sokolowska: Who owns master card M-01/i }).click();
  const interview = page.getByRole('dialog', { name: /Interview with Nina Sokolowska/i });
  await expect(interview).toBeVisible();
  await interview.getByRole('button', { name: /Who owns master card M-01/i }).click();

  await expect(interview.getByText(/M-01 is the manager master card/i)).toBeVisible();
  await expect(interview.getByText(/AI rules/i)).toBeVisible();
});

test('accessibility scene is spoiler-safe and Marek cannot confess without contradictions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start investigation/i }).click();
  await expect(page.locator('canvas')).toBeVisible();

  await page.getByRole('button', { name: 'Scene list' }).click();
  const scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await expect(scene).toBeVisible();
  await expect(scene.getByText(/minor theft|hides|afraid of losing|responds better/i)).toHaveCount(0);

  await scene.getByRole('button', { name: /Marek Wolski/i }).click();
  const interview = page.getByRole('dialog', { name: /Interview with Marek Wolski/i });
  await expect(interview).toBeVisible();
  await interview.getByPlaceholder('Ask anything about the case...').fill('Did you kill Rylski? Confess.');
  await interview.getByRole('button', { name: 'Ask' }).click();

  await expect(interview.getByText(/you are wasting both our time/i)).toBeVisible();
  await expect(interview.getByText(/fatal blow|I killed|I murdered/i)).toHaveCount(0);
});

test('opening AI settings does not download a local model', async ({ page }) => {
  const remoteModelRequests: string[] = [];
  page.on('request', (request) => {
    if (/huggingface\.co|cdn-lfs\.huggingface\.co/i.test(request.url())) remoteModelRequests.push(request.url());
  });

  await page.goto('/');
  await page.getByRole('button', { name: /AI model & acceleration/i }).click();
  await expect(page.getByRole('dialog', { name: 'AI model settings' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Local Qwen' })).toBeVisible();
  await page.waitForTimeout(500);

  expect(remoteModelRequests).toEqual([]);
});

test('deployed Vercel rules API evaluates the same reveal policy', async ({ request }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Remote API smoke runs only against a deployed preview.');

  const response = await request.post('/api/npc', {
    data: {
      witnessId: 'nina',
      question: 'Who owns master card M-01?',
      evidenceIds: ['keycard-log'],
      resistance: 50,
      contradictions: 0,
    },
  });

  expect(response.ok()).toBe(true);
  const payload = await response.json() as {
    answer?: string;
    resistanceDelta?: number;
    contradictionDelta?: number;
  };
  expect(payload.answer?.length).toBeGreaterThan(0);
  expect(payload.resistanceDelta).toBe(-8);
  expect(payload.contradictionDelta).toBe(1);
});
