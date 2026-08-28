import { allowedNpcSystemPrompt, type AllowedNpcPrompt } from '../domain/npcPolicy';
import { detectBrowserAiCapabilities, recommendQwenProfile, resolveBackendCandidates, transformersDevice } from './capabilities';
import type { BrowserAcceleration, BrowserBackend, BrowserQwenProfile, NpcModelProvider, NpcReply, ProviderAvailability, RuntimeDiagnostics } from './types';

const MODELS = {
  quality: {
    repository: 'onnx-community/Qwen3-4B-Instruct-2507-ONNX',
    label: 'Qwen3-4B-Instruct-2507',
    dtype: { npu: 'q4', webgpu: 'q4f16', wasm: 'q4' },
  },
  lite: {
    repository: 'onnx-community/Qwen3-0.6B-ONNX',
    label: 'Qwen3-0.6B Lite',
    dtype: { npu: 'q4', webgpu: 'q4f16', wasm: 'q4' },
  },
} as const;

type ChatMessage = { role: 'system' | 'user'; content: string };
type TextGenerator = {
  (input: ChatMessage[], options: Record<string, unknown>): Promise<unknown>;
  dispose?: () => Promise<void> | void;
};

type ProviderEvents = {
  onProgress?: (progress: number | null, message: string) => void;
  onBackendAttempt?: (backend: BrowserBackend, model: string) => void;
};

export class BrowserQwenProvider implements NpcModelProvider {
  readonly id = 'browser-qwen' as const;
  private generator: TextGenerator | null = null;
  private activeBackend: BrowserBackend | null = null;
  private activeModel: string | null = null;
  private fallbackUsed = false;

  constructor(
    private readonly profile: BrowserQwenProfile,
    private readonly acceleration: BrowserAcceleration,
    private readonly events: ProviderEvents = {},
  ) {}

  async availability(): Promise<ProviderAvailability> {
    const capabilities = detectBrowserAiCapabilities();
    try {
      const candidates = resolveBackendCandidates(this.acceleration, capabilities);
      const profile = recommendQwenProfile(this.profile, capabilities);
      return {
        state: 'downloadable',
        label: 'Local model can be initialized',
        detail: `${MODELS[profile].label}; candidates: ${candidates.join(' → ')}`,
      };
    } catch (error) {
      return { state: 'unsupported', label: 'No compatible local backend', detail: errorMessage(error) };
    }
  }

  async initialize(): Promise<RuntimeDiagnostics> {
    await this.dispose();
    const capabilities = detectBrowserAiCapabilities();
    const resolvedProfile = recommendQwenProfile(this.profile, capabilities);
    const model = MODELS[resolvedProfile];
    const candidates = resolveBackendCandidates(this.acceleration, capabilities);
    const failures: string[] = [];
    const transformers = await import('@huggingface/transformers');

    for (const [index, backend] of candidates.entries()) {
      this.events.onBackendAttempt?.(backend, model.label);
      this.events.onProgress?.(0, `Initializing ${model.label} on ${backendLabel(backend)}…`);
      try {
        const device = transformersDevice(backend);
        const created = await transformers.pipeline('text-generation', model.repository, {
          device,
          dtype: model.dtype[backend],
          progress_callback: (event) => {
            const progress = readProgress(event);
            this.events.onProgress?.(progress, progressMessage(event, model.label));
          },
        });
        this.generator = created as unknown as TextGenerator;
        this.activeBackend = backend;
        this.activeModel = model.label;
        this.fallbackUsed = index > 0;
        this.events.onProgress?.(100, `${model.label} ready on ${backendLabel(backend)}.`);
        return {
          state: 'ready',
          requestedBackend: this.acceleration,
          activeBackend: backend,
          activeModel: model.label,
          fallbackUsed: this.fallbackUsed,
          progress: 100,
          message: `${model.label} ready on ${backendLabel(backend)}${this.fallbackUsed ? ' (fallback)' : ''}.`,
          lastError: failures.length ? failures.join(' | ') : null,
        };
      } catch (error) {
        const failure = `${backend}: ${errorMessage(error)}`;
        failures.push(failure);
        this.events.onProgress?.(null, `Backend ${backendLabel(backend)} failed: ${errorMessage(error)}`);
        if (this.acceleration !== 'auto') throw new Error(failure);
      }
    }

    throw new Error(failures.join(' | ') || 'No local backend could initialize the model.');
  }

  async generate(prompt: AllowedNpcPrompt): Promise<NpcReply> {
    if (!this.generator || !this.activeBackend || !this.activeModel) {
      throw new Error('Local Qwen is not initialized. Open AI settings and initialize it explicitly.');
    }
    const output = await this.generator(
      [
        { role: 'system', content: allowedNpcSystemPrompt(prompt) },
        { role: 'user', content: prompt.question },
      ],
      {
        max_new_tokens: 96,
        do_sample: true,
        temperature: 0.65,
        top_p: 0.9,
        repetition_penalty: 1.05,
      },
    );
    return {
      answer: extractGeneratedText(output) || prompt.fallbackAnswer,
      backend: this.activeBackend,
      model: this.activeModel,
    };
  }

  async dispose() {
    const generator = this.generator;
    this.generator = null;
    this.activeBackend = null;
    this.activeModel = null;
    this.fallbackUsed = false;
    await generator?.dispose?.();
  }
}

function backendLabel(backend: BrowserBackend) {
  if (backend === 'npu') return 'WebNN / NPU';
  if (backend === 'webgpu') return 'WebGPU';
  return 'WASM / CPU';
}

function readProgress(event: unknown): number | null {
  if (!event || typeof event !== 'object') return null;
  const value = (event as Record<string, unknown>).progress;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, normalized));
}

function progressMessage(event: unknown, model: string) {
  if (!event || typeof event !== 'object') return `Loading ${model}…`;
  const record = event as Record<string, unknown>;
  const file = typeof record.file === 'string' ? record.file : null;
  const status = typeof record.status === 'string' ? record.status : null;
  return [status, file].filter(Boolean).join(' · ') || `Loading ${model}…`;
}

function extractGeneratedText(output: unknown): string | null {
  if (!Array.isArray(output) || !output.length) return null;
  const first = output[0];
  if (!first || typeof first !== 'object') return null;
  const generated = (first as Record<string, unknown>).generated_text;
  if (typeof generated === 'string') return generated.trim();
  if (!Array.isArray(generated) || !generated.length) return null;
  const last = generated[generated.length - 1];
  if (!last || typeof last !== 'object') return null;
  const content = (last as Record<string, unknown>).content;
  return typeof content === 'string' ? content.trim() : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
