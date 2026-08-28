import { AccusationPanel } from './components/AccusationPanel';
import { DetectiveThought } from './components/DetectiveThought';
import { EvidenceBoard } from './components/EvidenceBoard';
import { InterviewPanel } from './components/InterviewPanel';
import { PhaserGame } from './game/PhaserGame';
import { useInvestigationStore } from './state/investigationStore';

export default function App() {
  const resetCase = useInvestigationStore((state) => state.resetCase);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">CASE 01 / AI-POWERED NPC POC</span>
          <h1>Hotel Nocturne: Room 307</h1>
        </div>
        <div className="topbar-actions">
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
    </main>
  );
}
