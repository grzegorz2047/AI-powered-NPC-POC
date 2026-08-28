import { expect, test } from '@playwright/test';

test('menu -> Roosevelt evidence -> new lead -> lobby rules interview works in a real browser', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Room 307' })).toBeVisible();
  await page.getByRole('button', { name: /Start investigation/i }).click();
  await expect(page.getByLabel(/investigation scene: Lobby \/ First Floor/i)).toBeVisible();

  await page.getByRole('button', { name: 'Scene list' }).click();
  let scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await scene.getByRole('button', { name: /Elevator to third floor \/ Room 307/i }).click();
  await expect(page.getByLabel(/investigation scene: Third Floor \/ Room 307/i)).toBeVisible();

  await page.getByRole('button', { name: 'Scene list' }).click();
  scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await scene.getByRole('button', { name: /Inspect clue: Master keycard log/i }).click();
  await scene.getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('heading', { name: 'Master keycard log' })).toBeVisible();
  await expect(page.getByText('NEW LEAD').first()).toBeVisible();

  const ninaLead = page.getByRole('button', { name: /Nina Sokolowska: Who owns master card M-01/i });
  await expect(ninaLead).toBeDisabled();

  await page.getByRole('button', { name: 'Scene list' }).click();
  scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await scene.getByRole('button', { name: /Elevator to lobby/i }).click();
  await expect(page.getByLabel(/investigation scene: Lobby \/ First Floor/i)).toBeVisible();
  await expect(ninaLead).toBeEnabled();

  await ninaLead.click();
  const interview = page.getByRole('dialog', { name: /Interview with Nina Sokolowska/i });
  await expect(interview).toBeVisible();
  await interview.getByRole('button', { name: /Who owns master card M-01/i }).click();

  await expect(interview.getByText(/M-01 is the manager master card/i)).toBeVisible();
  await expect(interview.getByText(/AI rules/i)).toBeVisible();
});

test('accessibility scene is spoiler-safe and Marek cannot confess without contradictions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start investigation/i }).click();
  await expect(page.getByLabel(/investigation scene: Lobby \/ First Floor/i)).toBeVisible();

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

test('Roosevelt real-hotel world is the default and accessible navigation crosses all three maps', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start investigation/i }).click();
  await expect(page.getByLabel(/investigation scene: Lobby \/ First Floor/i)).toBeVisible();

  await page.getByRole('button', { name: 'Scene list' }).click();
  let scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await expect(scene.getByText(/Lobby \/ First Floor/)).toBeVisible();
  await expect(scene.getByRole('button', { name: /Nina Sokolowska/i })).toBeVisible();
  await expect(scene.getByRole('button', { name: /Kamil Nowak/i })).toBeVisible();
  await expect(scene.getByRole('button', { name: /Marek Wolski/i })).toBeVisible();
  await expect(scene.getByRole('button', { name: /Irena Maj/i })).toHaveCount(0);
  await expect(scene.getByText(/No investigation hotspots on this level/i)).toBeVisible();

  await scene.getByRole('button', { name: /Elevator to third floor \/ Room 307/i }).click();
  await expect(page.getByLabel(/investigation scene: Third Floor \/ Room 307/i)).toBeVisible();

  await page.getByRole('button', { name: 'Scene list' }).click();
  scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await expect(scene.getByRole('button', { name: /Inspect clue: Master keycard log/i })).toBeVisible();
  await expect(scene.getByRole('button', { name: /Irena Maj/i })).toBeVisible();
  await expect(scene.getByRole('button', { name: /Kamil Nowak/i })).toHaveCount(0);
  await scene.getByRole('button', { name: /Inspect clue: Master keycard log/i }).click();
  await scene.getByRole('button', { name: 'Close' }).click();

  const ninaLead = page.getByRole('button', { name: /Nina Sokolowska: Who owns master card M-01/i });
  await expect(ninaLead).toBeDisabled();

  await page.getByRole('button', { name: 'Scene list' }).click();
  scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await scene.getByRole('button', { name: /Elevator to lobby/i }).click();
  await expect(page.getByLabel(/investigation scene: Lobby \/ First Floor/i)).toBeVisible();
  await expect(ninaLead).toBeEnabled();

  await page.getByRole('button', { name: 'Scene list' }).click();
  scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await scene.getByRole('button', { name: /Service elevator to basement/i }).click();
  await expect(page.getByLabel(/investigation scene: Basement \/ Service/i)).toBeVisible();

  await page.getByRole('button', { name: 'Scene list' }).click();
  scene = page.getByRole('dialog', { name: 'Accessible investigation scene' });
  await expect(scene.getByRole('button', { name: /Inspect clue: Burnt ledger fragment/i })).toBeVisible();
  await expect(scene.getByRole('button', { name: /Inspect clue: Brass heron statuette/i })).toBeVisible();
  await expect(scene.getByText(/No witness is currently on this level/i)).toBeVisible();
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

test('deployed Vercel Function runtime responds', async ({ request }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Remote API smoke runs only against a deployed preview.');

  const response = await request.get('/api/health');
  const raw = await response.text();
  expect(response.ok(), `GET /api/health -> ${response.status()} ${raw}`).toBe(true);
  expect(JSON.parse(raw)).toMatchObject({ ok: true, service: 'hotel-nocturne-api' });
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

  const raw = await response.text();
  expect(response.ok(), `POST /api/npc -> ${response.status()} ${raw}`).toBe(true);
  const payload = JSON.parse(raw) as {
    answer?: string;
    resistanceDelta?: number;
    contradictionDelta?: number;
  };
  expect(payload.answer?.length).toBeGreaterThan(0);
  expect(payload.resistanceDelta).toBe(-8);
  expect(payload.contradictionDelta).toBe(1);
});

test('deployed Vercel preview serves every checked-in game audio asset', async ({ request }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Remote audio smoke runs only against a deployed preview.');

  const audioPaths = [
    '/audio/rain-loop.wav',
    '/audio/hotel-hum-loop.wav',
    '/audio/thunder.wav',
    '/audio/card-click.wav',
    '/audio/evidence-sting.wav',
    '/audio/contradiction-sting.wav',
  ];

  for (const path of audioPaths) {
    const response = await request.get(path);
    const body = await response.body();
    expect(response.ok(), `${path} -> ${response.status()}`).toBe(true);
    expect(body.length, `${path} should contain a WAV payload`).toBeGreaterThan(44);
    expect(body.subarray(0, 4).toString('ascii'), `${path} RIFF header`).toBe('RIFF');
  }
});
