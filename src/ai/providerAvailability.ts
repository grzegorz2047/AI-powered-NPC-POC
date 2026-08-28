import { resolveBackendCandidates } from './capabilities';
import type { BrowserAcceleration, BrowserAiCapabilities, ProviderAvailability } from './types';

export function byokConfigurationAvailability(baseUrl: string, model: string, apiKey: string): ProviderAvailability {
  const missing = [
    !baseUrl.trim() ? 'endpoint' : null,
    !model.trim() ? 'model' : null,
    !apiKey.trim() ? 'API key' : null,
  ].filter(Boolean) as string[];

  if (!missing.length) {
    return { state: 'available', label: 'Ready to test', detail: 'Credentials are present in this tab session.' };
  }

  return {
    state: 'downloadable',
    label: 'Needs configuration',
    detail: `Missing: ${missing.join(', ')}.`,
  };
}

export function localQwenAvailability(
  capabilities: BrowserAiCapabilities,
  acceleration: BrowserAcceleration,
): ProviderAvailability {
  try {
    const candidates = resolveBackendCandidates(acceleration, capabilities);
    return {
      state: 'downloadable',
      label: 'Ready to initialize',
      detail: `Backend candidates: ${candidates.join(' → ')}. Model download starts only after your click.`,
    };
  } catch (error) {
    return {
      state: 'unsupported',
      label: 'Selected accelerator unavailable',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
