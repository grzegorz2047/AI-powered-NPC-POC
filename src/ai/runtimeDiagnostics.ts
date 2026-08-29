export function runtimeNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

export function elapsedRuntimeMs(startedAt: number) {
  return Math.max(0, Math.round(runtimeNowMs() - startedAt));
}

export function formatRuntimeMs(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (value < 1000) return `${value} ms`;
  if (value < 10_000) return `${(value / 1000).toFixed(1)} s`;
  return `${Math.round(value / 1000)} s`;
}
