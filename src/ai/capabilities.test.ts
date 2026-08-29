import { describe, expect, it } from 'vitest';
import { recommendQwenProfile, resolveBackendCandidates, transformersDevice } from './capabilities';
import type { BrowserAiCapabilities } from './types';

const all: BrowserAiCapabilities = { webnn: true, webgpu: true, wasm: true, deviceMemoryGb: 16 };

describe('browser AI backend selection', () => {
  it('prefers NPU then WebGPU then WASM in auto mode', () => {
    expect(resolveBackendCandidates('auto', all)).toEqual(['npu', 'webgpu', 'wasm']);
  });

  it('does not silently fall back in NPU-only mode', () => {
    expect(() => resolveBackendCandidates('npu', { ...all, webnn: false })).toThrow(/NPU/);
  });

  it('falls through unavailable capabilities only in auto mode', () => {
    expect(resolveBackendCandidates('auto', { ...all, webnn: false })).toEqual(['webgpu', 'wasm']);
  });

  it('maps NPU to the native Transformers.js webnn-npu device', () => {
    expect(transformersDevice('npu')).toBe('webnn-npu');
  });

  it('recommends the larger model only on higher-memory accelerated devices', () => {
    expect(recommendQwenProfile('auto', all)).toBe('quality');
    expect(recommendQwenProfile('auto', { ...all, deviceMemoryGb: 8 })).toBe('lite');
  });
});
