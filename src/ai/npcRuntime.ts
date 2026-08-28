import { buildAllowedNpcPrompt, evaluateNpcPolicy, type NpcPolicyRequest } from '../domain/npcPolicy';
import { useAiSettingsStore } from '../state/aiSettingsStore';
import { BrowserQwenProvider } from './browserQwenProvider';
import { ChromeBuiltinProvider } from './chromeBuiltinProvider';
import type { NpcReply, RuntimeDiagnostics } from './types';

export type RuntimeNpcAnswer = NpcReply & {
  resistanceDelta: number;
  contradictionDelta: number;
};

let browserProvider: BrowserQwenProvider | null = null;
let chromeProvider: ChromeBuiltinProvider | null = null;

export async function initializeBrowserQwen() {
  const settings = useAiSettingsStore.getState();
  await browserProvider?.dispose();
  const provider = new BrowserQwenProvider(settings.browserProfile, settings.browserAcceleration, {
    onBackendAttempt: (backend, model) => useAiSettingsStore.getState().setRuntime({
      state: 'loading',
      requestedBackend: settings.browserAcceleration,
      activeBackend: null,
      activeModel: model,
      fallbackUsed: false,
      message: `Trying ${backend}…`,
      lastError: null,
    }),
    onProgress: (progress, message) => useAiSettingsStore.getState().setRuntime({ progress, message }),
  });
  browserProvider = provider;
  settings.setRuntime({
    state: 'loading',
    requestedBackend: settings.browserAcceleration,
    activeBackend: null,
    activeModel: null,
    fallbackUsed: false,
    progress: 0,
    message: 'Preparing local Qwen…',
    lastError: null,
  });
  try {
    const diagnostics = await provider.initialize();
    useAiSettingsStore.getState().setRuntime(diagnostics);
    useAiSettingsStore.getState().setProvider('browser-qwen');
    return diagnostics;
  } catch (error) {
    const message = errorMessage(error);
    useAiSettingsStore.getState().setRuntime({ state: 'error', progress: null, message: 'Local model failed to initialize.', lastError: message });
    throw error;
  }
}

export async function initializeChromeBuiltIn() {
  await chromeProvider?.dispose();
  chromeProvider = new ChromeBuiltinProvider();
  useAiSettingsStore.getState().setRuntime({ state: 'loading', requestedBackend: 'chrome', message: 'Preparing Chrome built-in model…', progress: null, lastError: null });
  try {
    const diagnostics = await chromeProvider.initialize();
    useAiSettingsStore.getState().setRuntime(diagnostics);
    useAiSettingsStore.getState().setProvider('chrome-builtin');
    return diagnostics;
  } catch (error) {
    const message = errorMessage(error);
    useAiSettingsStore.getState().setRuntime({ state: 'error', message: 'Chrome model failed to initialize.', lastError: message });
    throw error;
  }
}

export function selectRulesFallback(message = 'Deterministic dialogue is active.') {
  useAiSettingsStore.getState().setProvider('rules');
  useAiSettingsStore.getState().setRuntime({
    state: 'ready',
    requestedBackend: 'rules',
    activeBackend: 'rules',
    activeModel: null,
    fallbackUsed: false,
    progress: 100,
    message,
    lastError: null,
  });
}

export function selectByok() {
  const state = useAiSettingsStore.getState();
  if (!state.byokBaseUrl.trim() || !state.byokModel.trim() || !state.byokApiKey.trim()) {
    throw new Error('BYOK requires endpoint, model and API key. The key is kept only in memory.');
  }
  state.setProvider('byok');
  state.setRuntime({
    state: 'ready',
    requestedBackend: 'remote',
    activeBackend: 'remote',
    activeModel: state.byokModel.trim(),
    fallbackUsed: false,
    progress: 100,
    message: 'BYOK provider selected. The API key is stored only in this tab memory.',
    lastError: null,
  });
}

export async function testAndSelectByok() {
  selectByok();
  useAiSettingsStore.getState().setRuntime({ state: 'checking', message: 'Testing BYOK connection…', progress: null, lastError: null });
  try {
    const reply = await askByok({
      witnessId: 'kamil',
      question: 'Where were you working tonight?',
      evidenceIds: [],
      resistance: 25,
      contradictions: 0,
    });
    useAiSettingsStore.getState().setRuntime({
      state: 'ready',
      requestedBackend: 'remote',
      activeBackend: 'remote',
      activeModel: reply.model,
      fallbackUsed: false,
      progress: 100,
      message: 'BYOK connection works.',
      lastError: null,
    });
    return reply;
  } catch (error) {
    const message = errorMessage(error);
    useAiSettingsStore.getState().setProvider('rules');
    useAiSettingsStore.getState().setRuntime({ state: 'error', activeBackend: 'rules', fallbackUsed: true, message: 'BYOK test failed.', lastError: message });
    throw error;
  }
}

export async function askNpc(request: NpcPolicyRequest): Promise<RuntimeNpcAnswer> {
  const policy = evaluateNpcPolicy(request);
  const prompt = buildAllowedNpcPrompt(request, policy);
  const settings = useAiSettingsStore.getState();

  try {
    let reply: NpcReply;
    if (settings.provider === 'browser-qwen') {
      if (!browserProvider) throw new Error('Local Qwen is not initialized in this page. Open AI settings and initialize it again.');
      reply = await browserProvider.generate(prompt);
    } else if (settings.provider === 'chrome-builtin') {
      if (!chromeProvider) throw new Error('Chrome built-in model is not initialized in this page.');
      reply = await chromeProvider.generate(prompt);
    } else if (settings.provider === 'byok') {
      reply = await askByok(request);
    } else {
      reply = { answer: policy.answer, backend: 'rules', model: null };
    }

    return { ...reply, resistanceDelta: policy.resistanceDelta, contradictionDelta: policy.contradictionDelta };
  } catch (error) {
    const message = errorMessage(error);
    useAiSettingsStore.getState().setRuntime({
      state: 'fallback',
      activeBackend: 'rules',
      fallbackUsed: true,
      message: `AI unavailable; deterministic dialogue used. ${message}`,
      lastError: message,
    });
    return {
      answer: policy.answer,
      backend: 'rules',
      model: null,
      resistanceDelta: policy.resistanceDelta,
      contradictionDelta: policy.contradictionDelta,
    };
  }
}

async function askByok(request: NpcPolicyRequest): Promise<NpcReply> {
  const state = useAiSettingsStore.getState();
  if (!state.byokApiKey.trim()) throw new Error('BYOK API key is not present in memory. Re-enter it after a reload.');
  const response = await fetch('/api/npc', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...request,
      llm: {
        baseUrl: state.byokBaseUrl,
        model: state.byokModel,
        apiKey: state.byokApiKey,
      },
    }),
  });
  const payload = await response.json() as { answer?: string; error?: string; model?: string };
  if (!response.ok) throw new Error(payload.error || `BYOK request failed with ${response.status}.`);
  return { answer: payload.answer || evaluateNpcPolicy(request).answer, backend: 'remote', model: payload.model || state.byokModel };
}

export async function disposeAiProviders() {
  await Promise.allSettled([browserProvider?.dispose(), chromeProvider?.dispose()]);
  browserProvider = null;
  chromeProvider = null;
}

export function runtimeProviderStatus(): RuntimeDiagnostics {
  return useAiSettingsStore.getState().runtime;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
