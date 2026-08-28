import { useMemo, useState } from 'react';
import { clues, witnesses } from '../data/caseData';
import { useGameInputBlocker } from '../game/useGameInputBlocker';
import { useInvestigationStore } from '../state/investigationStore';

export function AccusationPanel() {
  const found = useInvestigationStore((state) => state.discoveredClueIds);
  const [open, setOpen] = useState(false);
  const [suspect, setSuspect] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState('');
  useGameInputBlocker('accusation', open);

  const canAccuse = found.length >= 4;
  const available = useMemo(() => clues.filter((clue) => found.includes(clue.id)), [found]);

  if (!open) {
    return (
      <button type="button" className="accuse-button" disabled={!canAccuse} onClick={() => setOpen(true)}>
        {canAccuse ? 'Build accusation' : `Find ${4 - found.length} more clue(s)`}
      </button>
    );
  }

  function toggleEvidence(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-3));
  }

  function judge() {
    const mustHave = ['keycard-log', 'burnt-ledger'];
    const strongLink = selected.includes('brass-heron') || (selected.includes('cctv-note') && found.includes('cctv-still'));
    const correct = suspect === 'marek' && mustHave.every((id) => found.includes(id)) && strongLink && selected.length === 3;
    setResult(correct
      ? 'Case closed. The timeline, motive and physical evidence form a coherent chain against Marek Wolski.'
      : 'The accusation does not yet survive scrutiny. Re-check motive, access and the corrected timeline.');
  }

  return (
    <div className="accusation-drawer">
      <div className="panel-heading"><span>ACCUSATION</span><button type="button" onClick={() => setOpen(false)}>Close</button></div>
      <label>
        Suspect
        <select value={suspect} onChange={(event) => setSuspect(event.target.value)}>
          <option value="">Choose...</option>
          {witnesses.map((witness) => <option key={witness.id} value={witness.id}>{witness.name}</option>)}
        </select>
      </label>
      <p className="small-copy">Choose exactly three pieces of evidence.</p>
      <div className="accusation-evidence">
        {available.map((clue) => (
          <button
            type="button"
            key={clue.id}
            className={selected.includes(clue.id) ? 'selected' : ''}
            onClick={() => toggleEvidence(clue.id)}
          >
            {clue.title}
          </button>
        ))}
      </div>
      <button type="button" className="primary-button" onClick={judge} disabled={!suspect || selected.length !== 3}>Present case</button>
      {result && <p className="result-copy">{result}</p>}
    </div>
  );
}
