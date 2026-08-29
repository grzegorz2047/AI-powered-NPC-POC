import { useEffect, useMemo, useState } from 'react';
import { chromeBuiltInAvailability } from '../ai/chromeBuiltinProvider';
import { detectBrowserAiCapabilities } from '../ai/capabilities';
import { initializeBrowserQwen, initializeChromeBuiltIn, selectRulesFallback, testAndSelectByok } from '../ai/npcRuntime';
import { byokConfigurationAvailability, localQwenAvailability } from '../ai/providerAvailability';
import { formatRuntimeMs } from '../ai/runtimeDiagnostics';
import type { ProviderAvailability } from '../ai/types';
import { useGameInputBlocker } from '../game/useGameInputBlocker';
import { useAiSettingsStore } from '../state/aiSettingsStore';

export function AiSettingsPanel() {
  const open = useAiSettingsStore((state) => state.panelOpen);
  const setOpen = useAiSettingsStore((state) => state.setPanelOpen);
  const provider = useAiSettingsStore((state) => state.provider);
  const browserProfile = useAiSettingsStore((state) => state.browserProfile);
  const setBrowserProfile = useAiSettingsStore((state) => state.setBrowserProfile);
  const browserAcceleration = useAiSettingsStore((state) => state.browserAcceleration);
  const setBrowserAcceleration = useAiSettingsStore((state) => state.setBrowserAcceleration);
  const byokBaseUrl = useAiSettingsStore((state) => state.byokBaseUrl);
  const setByokBaseUrl = useAiSettingsStore((state) => state.setByokBaseUrl);
  const byokModel = useAiSettingsStore((state) => state.byokModel);
  const setByokModel = useAiSettingsStore((state) => state.setByokModel);
  const byokApiKey = useAiSettingsStore((state) => state.byokApiKey);
  const setByokApiKey = useAiSettingsStore((state) => state.setByokApiKey);
  const runtime = useAiSettingsStore((state) => state.runtime);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [chrome, setChrome] = useState<ProviderAvailability>({ state: 'unknown', label: 'Checking when panel opens…' });
  const capabilities = useMemo(() => detectBrowserAiCapabilities(), [open]);
  useGameInputBlocker('ai-settings', open);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void chromeBuiltInAvailability().then((result) => {
      if (active) setChrome(result);
    });
    return () => { active = false; };
  }, [open]);

  if (!open) return null;

  const byokStatus: ProviderAvailability = provider === 'byok' && runtime.state === 'ready' && runtime.activeBackend === 'remote'
    ? { state: 'available', label: 'Active & tested', detail: runtime.activeModel ?? undefined }
    : byokConfigurationAvailability(byokBaseUrl, byokModel, byokApiKey);
  const localStatus: ProviderAvailability = provider === 'browser-qwen' && runtime.state === 'ready' && ['npu', 'webgpu', 'wasm'].includes(runtime.activeBackend ?? '')
    ? { state: 'available', label: `Active on ${runtime.activeBackend}`, detail: runtime.activeModel ?? undefined }
    : localQwenAvailability(capabilities, browserAcceleration);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop ai-modal" role="dialog" aria-modal="true" aria-label="AI model settings">
      <section className="ai-settings-panel">
        <header className="interview-header">
          <div>
            <span className="eyebrow">NPC RUNTIME / PRIVATE BY DEFAULT</span>
            <h2>AI model & acceleration</h2>
            <p>Choose how witness dialogue is naturalized. The investigation rules remain deterministic.</p>
          </div>
          <button type="button" className="close-button" onClick={() => setOpen(false)}>Close</button>
        </header>

        <div className="ai-provider-grid">
          <article className={`ai-provider-card ${provider === 'byok' ? 'selected-provider' : ''}`}>
            <div className="provider-title-row">
              <h3>Own API key</h3>
              <span className="cost-badge">BYOK</span>
            </div>
            <p>OpenAI-compatible cloud model. The key is kept only in tab memory, sent through the Vercel proxy for each request, and never persisted by the game.</p>
            <div className="capability-row" aria-label="BYOK characteristics">
              <span>Privacy: cloud</span><span>Speed: network</span><span>Cost: provider</span>
            </div>
            <div className={`availability availability-${byokStatus.state}`}>{byokStatus.label}</div>
            {byokStatus.detail && <small>{byokStatus.detail}</small>}
            <label>Endpoint
              <input value={byokBaseUrl} onChange={(event) => setByokBaseUrl(event.target.value)} placeholder="https://openrouter.ai/api/v1" />
            </label>
            <label>Model
              <input value={byokModel} onChange={(event) => setByokModel(event.target.value)} placeholder="provider/model" />
            </label>
            <label>API key
              <input type="password" autoComplete="off" value={byokApiKey} onChange={(event) => setByokApiKey(event.target.value)} placeholder="not saved" />
            </label>
            <button type="button" className="primary-button" disabled={busy} onClick={() => void run(testAndSelectByok)}>Test & use BYOK</button>
            <small>The proxy forwards the key to the chosen provider but does not intentionally log or store it. Public proxy allows common providers; custom hosts require `NPC_LLM_ALLOWED_HOSTS`.</small>
          </article>

          <article className={`ai-provider-card ${provider === 'browser-qwen' ? 'selected-provider' : ''}`}>
            <div className="provider-title-row">
              <h3>Local Qwen</h3>
              <span className="cost-badge">FREE · LOCAL</span>
            </div>
            <p>Runs in the browser through Transformers.js. Dialog does not leave the device.</p>
            <div className="capability-row" aria-label="Local model characteristics">
              <span>Privacy: local</span><span>Speed: hardware</span><span>Cost: free</span>
            </div>
            <div className="capability-row">
              <span className={capabilities.webnn ? 'cap-ok' : 'cap-off'}>WebNN API {capabilities.webnn ? '✓' : '—'}</span>
              <span className={capabilities.webgpu ? 'cap-ok' : 'cap-off'}>WebGPU {capabilities.webgpu ? '✓' : '—'}</span>
              <span className={capabilities.wasm ? 'cap-ok' : 'cap-off'}>CPU/WASM {capabilities.wasm ? '✓' : '—'}</span>
            </div>
            <div className={`availability availability-${localStatus.state}`}>{localStatus.label}</div>
            {localStatus.detail && <small>{localStatus.detail}</small>}
            <label>Model profile
              <select value={browserProfile} onChange={(event) => setBrowserProfile(event.target.value as 'auto' | 'quality' | 'lite')}>
                <option value="auto">Auto</option>
                <option value="quality">Quality · Qwen3-4B</option>
                <option value="lite">Lite · Qwen3-0.6B</option>
              </select>
            </label>
            <label>Accelerator
              <select value={browserAcceleration} onChange={(event) => setBrowserAcceleration(event.target.value as 'auto' | 'npu' | 'webgpu' | 'wasm')}>
                <option value="auto">Auto · NPU → GPU → CPU</option>
                <option value="npu">NPU only · WebNN</option>
                <option value="webgpu">GPU only · WebGPU</option>
                <option value="wasm">CPU only · WASM</option>
              </select>
            </label>
            <button type="button" className="primary-button" disabled={busy || localStatus.state === 'unsupported'} onClick={() => void run(initializeBrowserQwen)}>Download / initialize local model</button>
            <small>WebNN API availability is only a capability hint. `Active backend: NPU` appears only after the model session really initializes with `webnn-npu`. NPU-only never silently falls back. Qwen thinking is disabled for low-latency NPC replies.</small>
          </article>

          <article className={`ai-provider-card ${provider === 'chrome-builtin' ? 'selected-provider' : ''}`}>
            <div className="provider-title-row">
              <h3>Chrome built-in</h3>
              <span className="cost-badge">FREE</span>
            </div>
            <p>Uses Chrome Prompt API / LanguageModel when the browser and device expose it.</p>
            <div className="capability-row" aria-label="Chrome built-in characteristics">
              <span>Privacy: browser</span><span>Speed: device</span><span>Cost: free</span>
            </div>
            <div className={`availability availability-${chrome.state}`}>{chrome.label}</div>
            {chrome.detail && <small>{chrome.detail}</small>}
            <button type="button" className="primary-button" disabled={busy || chrome.state === 'unsupported'} onClick={() => void run(initializeChromeBuiltIn)}>Initialize Chrome model</button>
            <small>Chrome controls its own model download and hardware requirements.</small>
          </article>
        </div>

        <section className="runtime-diagnostics">
          <div>
            <span className="eyebrow">RUNTIME DIAGNOSTICS</span>
            <strong>{runtime.state.toUpperCase()}</strong>
          </div>
          <dl>
            <div><dt>Requested</dt><dd>{runtime.requestedBackend ?? '—'}</dd></div>
            <div><dt>Active backend</dt><dd>{runtime.activeBackend ?? '—'}</dd></div>
            <div><dt>Model</dt><dd>{runtime.activeModel ?? '—'}</dd></div>
            <div><dt>Dtype</dt><dd>{runtime.activeDtype ?? '—'}</dd></div>
            <div><dt>Fallback</dt><dd>{runtime.fallbackUsed ? 'yes' : 'no'}</dd></div>
            <div><dt>Initialization</dt><dd>{formatRuntimeMs(runtime.initMs)}</dd></div>
            <div><dt>Last reply</dt><dd>{formatRuntimeMs(runtime.lastResponseMs)}</dd></div>
          </dl>
          {runtime.progress !== null && <div className="runtime-progress"><span style={{ width: `${runtime.progress}%` }} /></div>}
          <p>{runtime.message}</p>
          {(runtime.lastError || actionError) && <p className="runtime-error">{actionError || runtime.lastError}</p>}
          <button type="button" className="ghost-button" onClick={() => { selectRulesFallback(); setActionError(null); }}>Use deterministic dialogue</button>
        </section>
      </section>
    </div>
  );
}
