import { clues, clueById, witnessById } from '../data/caseData';
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
  const discovered = new Set(clueIds);

  return (
    <aside className="evidence-board">
      <div className="panel-heading">
        <span>Evidence &amp; Clues</span>
        <b>{clueIds.length}/7</b>
      </div>
      <div className="evidence-list">
        {clues.map((slot, index) => {
          if (!discovered.has(slot.id)) {
            return (
              <article key={slot.id} className="evidence-card evidence-card-locked" aria-label={`Uncollected evidence ${index + 1}`}>
                <div className="evidence-slot-icon" aria-hidden="true">?</div>
                <div>
                  <h3>Unexamined evidence</h3>
                  <p>Not collected yet.</p>
                </div>
              </article>
            );
          }

          const clue = clueById[slot.id];
          if (!clue) return null;
          const leads = questionsUnlockedByClue(slot.id, clueIds);
          return (
            <article key={slot.id} className="evidence-card evidence-card-found">
              <div className="evidence-slot-icon evidence-slot-found" aria-hidden="true">{index + 1}</div>
              <div className="evidence-card-copy">
                <div className={`strength strength-${clue.strength}`}>{clue.strength}</div>
                <h3>{clue.title}</h3>
                <p>{clue.description}</p>
                {leads.length > 0 && (
                  <div className="evidence-leads">
                    <span className={`lead-badge ${slot.id === latestClueId ? '' : 'lead-badge-unlocked'}`}>
                      {slot.id === latestClueId ? 'NEW LEAD' : 'UNLOCKED'}
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
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
