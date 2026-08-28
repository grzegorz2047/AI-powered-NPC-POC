import { clueById } from '../data/caseData';
import { useInvestigationStore } from '../state/investigationStore';

export function EvidenceBoard() {
  const clueIds = useInvestigationStore((state) => state.discoveredClueIds);

  return (
    <aside className="evidence-board">
      <div className="panel-heading">
        <span>EVIDENCE</span>
        <b>{clueIds.length}/7</b>
      </div>
      <div className="evidence-list">
        {clueIds.length === 0 && <p className="empty-copy">No evidence logged yet. Inspect the highlighted objects.</p>}
        {clueIds.map((id) => {
          const clue = clueById[id];
          if (!clue) return null;
          return (
            <article key={id} className="evidence-card">
              <div className={`strength strength-${clue.strength}`}>{clue.strength}</div>
              <h3>{clue.title}</h3>
              <p>{clue.description}</p>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
