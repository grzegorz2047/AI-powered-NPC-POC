import { clueById, witnessById } from '../data/caseData';
import { questionsUnlockedByClue } from '../domain/progression';
import { useInvestigationStore } from '../state/investigationStore';
import './evidenceLeads.css';

export function EvidenceBoard() {
  const clueIds = useInvestigationStore((state) => state.discoveredClueIds);
  const selectWitness = useInvestigationStore((state) => state.selectWitness);
  const latestClueId = clueIds.at(-1);

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
          const leads = questionsUnlockedByClue(id, clueIds);
          return (
            <article key={id} className="evidence-card">
              <div className={`strength strength-${clue.strength}`}>{clue.strength}</div>
              <h3>{clue.title}</h3>
              <p>{clue.description}</p>
              {leads.length > 0 && (
                <div className="evidence-leads">
                  <span className={`lead-badge ${id === latestClueId ? '' : 'lead-badge-unlocked'}`}>
                    {id === latestClueId ? 'NEW LEAD' : 'UNLOCKED'}
                  </span>
                  {leads.map((lead) => {
                    const witness = witnessById[lead.witnessId];
                    return (
                      <button
                        type="button"
                        key={lead.id}
                        className="evidence-lead-button"
                        onClick={() => selectWitness(lead.witnessId)}
                      >
                        {witness?.name ?? lead.witnessId}: {lead.text}
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
}
