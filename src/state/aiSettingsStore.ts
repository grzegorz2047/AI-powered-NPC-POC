import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BrowserAcceleration, BrowserQwenProfile, NpcRuntimeMode, RuntimeDiagnostics } from '../ai/types';

const initialRuntime: RuntimeDiagnostics = {
  state: 'idle',
  requestedBackend: null,
  activeBackend: null,
  activeModel: null,
  activeDtype: null,
  fallbackUsed: false,
  progress: null,
  initMs: null,
  lastResponseMs: null,
  message: 'Deterministic dialogue is active.',
  lastError: null,
};

type AiSettingsState = {
  panelOpen: boolean;
  provider: NpcRuntimeMode;
  browserProfile: BrowserQwenProfile;
  browserAcceleration: BrowserAcceleration;
  byokBaseUrl: string;
  byokModel: string;
  byokApiKey: string;
  runtime: RuntimeDiagnostics;
  setPanelOpen: (open: boolean) => void;
  setProvider: (provider: NpcRuntimeMode) => void;
  setBrowserProfile: (profile: BrowserQwenProfile) => void;
  setBrowserAcceleration: (acceleration: BrowserAcceleration) => void;
  setByokBaseUrl: (value: string) => void;
  setByokModel: (value: string) => void;
  setByokApiKey: (value: string) => void;
  setRuntime: (runtime: Partial<RuntimeDiagnostics>) => void;
  resetRuntime: () => void;
};

export const useAiSettingsStore = create<AiSettingsState>()(
  persist(
    (set) => ({
      panelOpen: false,
      provider: 'rules',
      browserProfile: 'auto',
      browserAcceleration: 'auto',
      byokBaseUrl: 'https://openrouter.ai/api/v1',
      byokModel: '',
      byokApiKey: '',
      runtime: initialRuntime,
      setPanelOpen: (panelOpen) => set({ panelOpen }),
      setProvider: (provider) => set({ provider }),
      setBrowserProfile: (browserProfile) => set({ browserProfile }),
      setBrowserAcceleration: (browserAcceleration) => set({ browserAcceleration }),
      setByokBaseUrl: (byokBaseUrl) => set({ byokBaseUrl }),
      setByokModel: (byokModel) => set({ byokModel }),
      setByokApiKey: (byokApiKey) => set({ byokApiKey }),
      setRuntime: (patch) => set((state) => ({ runtime: { ...state.runtime, ...patch } })),
      resetRuntime: () => set({ runtime: initialRuntime }),
    }),
    {
      name: 'hotel-nocturne-ai-settings',
      partialize: (state) => ({
        provider: state.provider,
        browserProfile: state.browserProfile,
        browserAcceleration: state.browserAcceleration,
        byokBaseUrl: state.byokBaseUrl,
        byokModel: state.byokModel,
      }),
    },
  ),
);
