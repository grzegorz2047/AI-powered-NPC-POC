import { useMemo, useState } from 'react';
import { clues, witnesses } from '../data/caseData';
import {
  ACCUSATION_METHODS,
  ACCUSATION_MOTIVES,
  accusationReadiness,
  evaluateAccusation,
} from '../domain/accusation';
import { useGameInputBlocker } from '../game/useGameInputBlocker';
import { useInvestigationStore } from '../state/investigationStore';

export function AccusationPanel() {
  const found = useInvestigationStore((state) => state.discoveredClueIds);
  const transcripts = useInvestigationStore((state) => state.transcripts);
  const [open, setOpen] = useState(false);
  const [suspect, setSuspect] = useState('');
  const [motive, setMotive] = useState('');
  const [method, setMethod] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState('');
  useGameInputBlocker('accusation', open);

  const witnessIds = useMemo(() => witnesses.map((witness) => witness.id), []);
  const readiness = accusationReadiness(found, transcripts, witnessIds);
  const available = useMemo(() => clues.filter((clue) => found.includes(clue.id)), [found]);

  if (!open) {
    let readinessLabel = 'Ready to build accusation';
    if (readiness.missingEvidenceCount > 0) {
      readinessLabel = `Find ${readiness.missingEvidenceCount} more clue(s)`;
    } else if (readiness.missingWitnessIds.length > 0) {
      readinessLabel = `Question ${readiness.missingWitnessIds.length} more witness(es)`;
    }

    return (
      <button
        type="button"
        className="accuse-button"
        disabled={!readiness.ready}
        title={readinessLabel}
        aria-label={readiness.ready ? 'Build accusation' : `Case file: ${readinessLabel}`}
        onClick={() => setOpen(true)}
      >
        Case file
      </button>
    );
  }

  function toggleEvidence(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function judge() {
    const verdict = evaluateAccusation({
      suspectId: suspect,
      motiveId: motive,
      methodId: method,
      selectedEvidenceIds: selected,
      discoveredClueIds: found,
    });

    setResult(verdict.correct
      ? 'Case closed. Wolski had access, a financial motive, the murder weapon and a corrected CCTV timeline tying the evidence into one chain.'
      : 'The accusation does not yet survive scrutiny. Re-check perpetrator, motive, method, access, the ledger, weapon and corrected CCTV timeline.');
  }

  return (
    <div className="accusation-drawer" role="dialog" aria-label="Build accusation">
      <div className="panel-heading"><span>CASE FILE / ACCUSATION</span><button type="button" onClick={() => setOpen(false)}>Close</button></div>
      <label>
        Suspect
        <select value={suspect} onChange={(event) => setSuspect(event.target.value)}>
          <option value="">Choose...</option>
          {witnesses.map((witness) => <option key={witness.id} value={witness.id}>{witness.name}</option>)}
        </select>
      </label>
      <label>
        Motive
        <select value={motive} onChange={(event) => setMotive(event.target.value)}>
          <option value="">Choose...</option>
          {ACCUSATION_MOTIVES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label>
        Method
        <select value={method} onChange={(event) => setMethod(event.target.value)}>
          <option value="">Choose...</option>
          {ACCUSATION_METHODS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <p className="small-copy">Present at least four pieces of evidence. Finding a fact is not enough: the evidence you select must support the case you are making.</p>
      <div className="accusation-evidence">
        {available.map((clue) => (
          <button
            type="button"
            key={clue.id}
            className={selected.includes(clue.id) ? 'selected' : ''}
            aria-pressed={selected.includes(clue.id)}
            onClick={() => toggleEvidence(clue.id)}
          >
            {clue.title}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="primary-button"
        onClick={judge}
        disabled={!suspect || !motive || !method || selected.length < 4}
      >
        Present case
      </button>
      {result && <p className="result-copy" role="status">{result}</p>}
    </div>
  );
}
