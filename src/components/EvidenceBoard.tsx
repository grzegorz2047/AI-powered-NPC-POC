import { clueById, witnessById } from '../data/caseData';
import { questionsUnlockedByClue } from '../domain/progression';
import { WORLD_MAPS } from '../game/worldManifest';
import { useInvestigationStore } from '../state/investigationStore';
import { useWorldStore } from '../state/worldStore';
import './evidenceLeads.css';

export function EvidenceBoard() {
  const clueIds = useInvestigationStore((state) => state.discoveredClueIds);
  const selectWitness = useInvestigationStore((state) => state.selectWitness);
  const currentMapId = useWorldStore((state) => state.currentMapId);
  const localWitnessIds = WORLD_MAPS[currentMapId].witnessIds as readonly string[];
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
                    const witnessIsHere = localWitnessIds.includes(lead.witnessId);
                    return (
                      <button
                        type="button"
                        key={lead.id}
                        className="evidence-lead-button"
                        disabled={!witnessIsHere}
                        title={witnessIsHere ? undefined : 'Find this witness on another hotel level.'}
                        onClick={() => witnessIsHere && selectWitness(lead.witnessId)}
                      >
                        {witness?.name ?? lead.witnessId}: {lead.text}
                        {!witnessIsHere && <small> · witness is elsewhere in the hotel</small>}
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
