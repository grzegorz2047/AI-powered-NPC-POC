import { lazy, Suspense, useState } from 'react';
import { AccessibleScenePanel } from './components/AccessibleScenePanel';
import { AccusationPanel } from './components/AccusationPanel';
import { AiSettingsPanel } from './components/AiSettingsPanel';
import { DetectiveThought } from './components/DetectiveThought';
import { EvidenceBoard } from './components/EvidenceBoard';
import { InterviewPanel } from './components/InterviewPanel';
import { useAiSettingsStore } from './state/aiSettingsStore';
import { useInvestigationStore } from './state/investigationStore';
import { useWorldStore } from './state/worldStore';

const PhaserGame = lazy(() => import('./game/PhaserGame').then((module) => ({ default: module.PhaserGame })));

export default function App() {
  const resetCase = useInvestigationStore((state) => state.resetCase);
  const resetWorld = useWorldStore((state) => state.resetWorld);
  const discoveredClueIds = useInvestigationStore((state) => state.discoveredClueIds);
  const setAiOpen = useAiSettingsStore((state) => state.setPanelOpen);
  const provider = useAiSettingsStore((state) => state.provider);
  const activeBackend = useAiSettingsStore((state) => state.runtime.activeBackend);
  const [started, setStarted] = useState(false);

  function resetInvestigation() {
    resetCase();
    resetWorld();
  }

  if (!started) {
    return (
      <main className="main-menu-shell">
        <section className="main-menu-card">
          <span className="eyebrow">CASE 01 / HOTEL NOCTURNE</span>
          <h1>Room 307</h1>
          <p className="main-menu-lead">
            A journalist is dead. Seven clues, four witnesses and one story that does not fit together.
            Search the hotel, confront contradictions and decide who is lying.
          </p>

          <div className="main-menu-actions">
            <button type="button" className="menu-primary" onClick={() => setStarted(true)}>
              {discoveredClueIds.length ? 'Continue investigation' : 'Start investigation'}
            </button>
            <button type="button" className="menu-secondary" onClick={() => setAiOpen(true)}>
              AI model & acceleration
              <small>{activeBackend ?? provider}</small>
            </button>
          </div>

          <div className="menu-runtime-note">
            <strong>No AI required.</strong>
            <span>Use deterministic dialogue, your own API, a local NPU/GPU/CPU model, or Chrome built-in AI.</span>
          </div>
        </section>
        <AiSettingsPanel />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">CASE 01 / AI-POWERED NPC POC</span>
          <h1>Hotel Nocturne: Room 307</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" className="ghost-button" onClick={() => setStarted(false)}>Main menu</button>
          <button type="button" className="ghost-button ai-menu-button" onClick={() => setAiOpen(true)}>
            AI: {activeBackend ?? provider}
          </button>
          <AccessibleScenePanel />
          <AccusationPanel />
          <button type="button" className="ghost-button" onClick={resetInvestigation}>Reset case</button>
        </div>
      </header>

      <section className="workspace">
        <div className="scene-column">
          <Suspense fallback={<div className="game-host game-loading">Loading investigation scene…</div>}>
            <PhaserGame />
          </Suspense>
          <DetectiveThought />
        </div>
        <EvidenceBoard />
      </section>

      <InterviewPanel />
      <AiSettingsPanel />
    </main>
  );
}
