import { AccusationPanel } from './components/AccusationPanel';
import { AiSettingsPanel } from './components/AiSettingsPanel';
import { DetectiveThought } from './components/DetectiveThought';
import { EvidenceBoard } from './components/EvidenceBoard';
import { InterviewPanel } from './components/InterviewPanel';
import { PhaserGame } from './game/PhaserGame';
import { useAiSettingsStore } from './state/aiSettingsStore';
import { useInvestigationStore } from './state/investigationStore';

export default function App() {
  const resetCase = useInvestigationStore((state) => state.resetCase);
  const setAiOpen = useAiSettingsStore((state) => state.setPanelOpen);
  const provider = useAiSettingsStore((state) => state.provider);
  const activeBackend = useAiSettingsStore((state) => state.runtime.activeBackend);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">CASE 01 / AI-POWERED NPC POC</span>
          <h1>Hotel Nocturne: Room 307</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" className="ghost-button ai-menu-button" onClick={() => setAiOpen(true)}>
            AI: {activeBackend ?? provider}
          </button>
          <AccusationPanel />
          <button type="button" className="ghost-button" onClick={resetCase}>Reset case</button>
        </div>
      </header>

      <section className="workspace">
        <div className="scene-column">
          <PhaserGame />
          <DetectiveThought />
        </div>
        <EvidenceBoard />
      </section>

      <InterviewPanel />
      <AiSettingsPanel />
    </main>
  );
}
