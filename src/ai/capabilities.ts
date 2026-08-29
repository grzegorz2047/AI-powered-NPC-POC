import type { BrowserAcceleration, BrowserAiCapabilities, BrowserBackend, BrowserQwenProfile } from './types';

type NavigatorWithAi = Navigator & {
  ml?: { createContext?: (...args: unknown[]) => unknown };
  gpu?: unknown;
  deviceMemory?: number;
};

export function detectBrowserAiCapabilities(): BrowserAiCapabilities {
  if (typeof navigator === 'undefined') {
    return { webnn: false, webgpu: false, wasm: typeof WebAssembly !== 'undefined', deviceMemoryGb: null };
  }
  const nav = navigator as NavigatorWithAi;
  return {
    webnn: typeof nav.ml?.createContext === 'function',
    webgpu: Boolean(nav.gpu),
    wasm: typeof WebAssembly !== 'undefined',
    deviceMemoryGb: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
  };
}

export function resolveBackendCandidates(acceleration: BrowserAcceleration, capabilities: BrowserAiCapabilities): BrowserBackend[] {
  const available = (backend: BrowserBackend) => {
    if (backend === 'npu') return capabilities.webnn;
    if (backend === 'webgpu') return capabilities.webgpu;
    return capabilities.wasm;
  };
  const order: BrowserBackend[] = acceleration === 'auto' ? ['npu', 'webgpu', 'wasm'] : [acceleration];
  const candidates = order.filter(available);
  if (!candidates.length) {
    if (acceleration === 'npu') throw new Error('WebNN/NPU is not available in this browser.');
    if (acceleration === 'webgpu') throw new Error('WebGPU is not available in this browser.');
    if (acceleration === 'wasm') throw new Error('WebAssembly is not available in this browser.');
    throw new Error('No local AI backend is available.');
  }
  return candidates;
}

export function recommendQwenProfile(profile: BrowserQwenProfile, capabilities: BrowserAiCapabilities): Exclude<BrowserQwenProfile, 'auto'> {
  if (profile !== 'auto') return profile;
  const memory = capabilities.deviceMemoryGb ?? 0;
  return memory >= 12 && (capabilities.webnn || capabilities.webgpu) ? 'quality' : 'lite';
}

export function transformersDevice(backend: BrowserBackend): 'webnn-npu' | 'webgpu' | 'wasm' {
  if (backend === 'npu') return 'webnn-npu';
  return backend;
}
