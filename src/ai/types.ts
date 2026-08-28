import type { AllowedNpcPrompt } from '../domain/npcPolicy';

export type NpcProviderId = 'byok' | 'browser-qwen' | 'chrome-builtin';
export type NpcRuntimeMode = NpcProviderId | 'rules';
export type BrowserQwenProfile = 'auto' | 'quality' | 'lite';
export type BrowserAcceleration = 'auto' | 'npu' | 'webgpu' | 'wasm';
export type BrowserBackend = Exclude<BrowserAcceleration, 'auto'>;

export type BrowserAiCapabilities = {
  webnn: boolean;
  webgpu: boolean;
  wasm: boolean;
  deviceMemoryGb: number | null;
};

export type ProviderAvailability = {
  state: 'available' | 'downloadable' | 'unsupported' | 'unknown';
  label: string;
  detail?: string;
};

export type RuntimeDiagnostics = {
  state: 'idle' | 'checking' | 'loading' | 'ready' | 'fallback' | 'error';
  requestedBackend: BrowserAcceleration | 'remote' | 'chrome' | 'rules' | null;
  activeBackend: BrowserBackend | 'remote' | 'chrome' | 'rules' | null;
  activeModel: string | null;
  fallbackUsed: boolean;
  progress: number | null;
  message: string;
  lastError: string | null;
};

export type NpcReply = {
  answer: string;
  backend: RuntimeDiagnostics['activeBackend'];
  model: string | null;
};

export interface NpcModelProvider {
  readonly id: NpcProviderId;
  availability(): Promise<ProviderAvailability>;
  initialize(): Promise<RuntimeDiagnostics>;
  generate(prompt: AllowedNpcPrompt): Promise<NpcReply>;
  dispose(): Promise<void>;
}
