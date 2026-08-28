const token = process.env.GH_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.TARGET_SHA;
const pullRequest = process.env.PR_NUMBER;

if (!token || !repository || !sha || !pullRequest) {
  throw new Error('GH_TOKEN, GITHUB_REPOSITORY, TARGET_SHA and PR_NUMBER are required.');
}

const headers = {
  authorization: `Bearer ${token}`,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
};

async function github(path) {
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${path}`);
  return response.json();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let ready = false;
for (let attempt = 0; attempt < 36; attempt += 1) {
  const combined = await github(`/commits/${sha}/status`);
  const vercel = combined.statuses?.find((status) => status.context === 'Vercel');
  if (vercel?.state === 'success') {
    ready = true;
    break;
  }
  if (vercel?.state === 'failure' || vercel?.state === 'error') {
    throw new Error(`Vercel deployment failed for ${sha}.`);
  }
  await sleep(5_000);
}

if (!ready) throw new Error(`Timed out waiting for Vercel status on ${sha}.`);

for (let attempt = 0; attempt < 12; attempt += 1) {
  const comments = await github(`/issues/${pullRequest}/comments?per_page=100`);
  const vercelComment = [...comments].reverse().find((comment) => comment.user?.login === 'vercel[bot]');
  const match = vercelComment?.body?.match(/\[Preview\]\((https:\/\/[^)]+\.vercel\.app)\)/);
  if (match?.[1]) {
    process.stdout.write(`PLAYWRIGHT_BASE_URL=${match[1]}\n`);
    process.exit(0);
  }
  await sleep(5_000);
}

throw new Error('Vercel reported success but no public Preview URL was found in the PR comment.');
