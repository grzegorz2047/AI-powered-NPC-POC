import { describe, expect, it } from 'vitest';
import { byokConfigurationAvailability, localQwenAvailability } from './providerAvailability';
import type { BrowserAiCapabilities } from './types';

const full: BrowserAiCapabilities = { webnn: true, webgpu: true, wasm: true, deviceMemoryGb: 16 };
const cpuOnly: BrowserAiCapabilities = { webnn: false, webgpu: false, wasm: true, deviceMemoryGb: 8 };

describe('provider card availability', () => {
  it('keeps BYOK in needs-configuration state until all session credentials are present', () => {
    expect(byokConfigurationAvailability('https://openrouter.ai/api/v1', '', '').label).toBe('Needs configuration');
    expect(byokConfigurationAvailability('https://openrouter.ai/api/v1', 'model', 'secret').state).toBe('available');
  });

  it('shows Auto local runtime as ready to initialize when at least one backend exists', () => {
    const status = localQwenAvailability(full, 'auto');
    expect(status.state).toBe('downloadable');
    expect(status.detail).toContain('npu → webgpu → wasm');
  });

  it('marks strict NPU unavailable when WebNN is missing', () => {
    expect(localQwenAvailability(cpuOnly, 'npu').state).toBe('unsupported');
  });

  it('still allows strict WASM on CPU-only browsers', () => {
    expect(localQwenAvailability(cpuOnly, 'wasm').state).toBe('downloadable');
  });
});
