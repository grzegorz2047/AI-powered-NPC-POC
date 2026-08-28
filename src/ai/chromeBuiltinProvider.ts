import { allowedPromptToText, type AllowedNpcPrompt } from '../domain/npcPolicy';
import type { NpcModelProvider, NpcReply, ProviderAvailability, RuntimeDiagnostics } from './types';

type ChromeLanguageModelSession = {
  prompt(input: string): Promise<string>;
  destroy?: () => void;
};

type ChromeLanguageModelApi = {
  availability(options?: Record<string, never>): Promise<string>;
  create(options?: Record<string, never>): Promise<ChromeLanguageModelSession>;
};

function getLanguageModelApi(): ChromeLanguageModelApi | null {
  const scope = globalThis as typeof globalThis & { LanguageModel?: ChromeLanguageModelApi };
  return scope.LanguageModel ?? null;
}

export class ChromeBuiltinProvider implements NpcModelProvider {
  readonly id = 'chrome-builtin' as const;
  private session: ChromeLanguageModelSession | null = null;

  async availability(): Promise<ProviderAvailability> {
    const api = getLanguageModelApi();
    if (!api) return { state: 'unsupported', label: 'Chrome Prompt API is not available' };
    try {
      const value = await api.availability({});
      if (value === 'available') return { state: 'available', label: 'Chrome built-in model is ready' };
      if (value === 'downloadable' || value === 'downloading') {
        return { state: 'downloadable', label: `Chrome model: ${value}` };
      }
      return { state: 'unsupported', label: `Chrome model: ${value}` };
    } catch (error) {
      return { state: 'unknown', label: 'Could not query Chrome model', detail: error instanceof Error ? error.message : String(error) };
    }
  }

  async initialize(): Promise<RuntimeDiagnostics> {
    const api = getLanguageModelApi();
    if (!api) throw new Error('Chrome Prompt API is not available in this browser.');
    this.session?.destroy?.();
    this.session = await api.create({});
    return {
      state: 'ready',
      requestedBackend: 'chrome',
      activeBackend: 'chrome',
      activeModel: 'Chrome built-in LanguageModel',
      fallbackUsed: false,
      progress: 100,
      message: 'Chrome built-in model is ready.',
      lastError: null,
    };
  }

  async generate(prompt: AllowedNpcPrompt): Promise<NpcReply> {
    if (!this.session) throw new Error('Chrome model is not initialized.');
    const answer = (await this.session.prompt(allowedPromptToText(prompt))).trim();
    return {
      answer: answer || prompt.fallbackAnswer,
      backend: 'chrome',
      model: 'Chrome built-in LanguageModel',
    };
  }

  async dispose() {
    this.session?.destroy?.();
    this.session = null;
  }
}

export async function chromeBuiltInAvailability() {
  return new ChromeBuiltinProvider().availability();
}
