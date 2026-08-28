import { useEffect, useState } from 'react';
import { clues, witnesses } from '../data/caseData';
import { useInvestigationStore } from '../state/investigationStore';

export function AccessibleScenePanel() {
  const [open, setOpen] = useState(false);
  const discovered = useInvestigationStore((state) => state.discoveredClueIds);
  const discoverClue = useInvestigationStore((state) => state.discoverClue);
  const selectWitness = useInvestigationStore((state) => state.selectWitness);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="ghost-button"
        aria-expanded={open}
        aria-controls="scene-access-panel"
        onClick={() => setOpen((value) => !value)}
      >
        Scene list
      </button>

      {open && (
        <aside id="scene-access-panel" className="scene-access-drawer" role="dialog" aria-label="Accessible investigation scene">
          <div className="panel-heading">
            <span>ACCESSIBLE SCENE</span>
            <button type="button" onClick={() => setOpen(false)}>Close</button>
          </div>
          <p className="access-intro">
            Keyboard alternative to the canvas. Inspecting a clue here performs the same investigation action as clicking its hotspot.
          </p>

          <section className="access-section" aria-labelledby="access-clues-heading">
            <div className="access-section-title">
              <h3 id="access-clues-heading">Clues</h3>
              <span>{discovered.length}/{clues.length}</span>
            </div>
            <div className="access-item-list">
              {clues.map((clue) => {
                const found = discovered.includes(clue.id);
                return (
                  <button
                    type="button"
                    key={clue.id}
                    className={`access-item ${found ? 'access-item-found' : ''}`}
                    aria-label={`${found ? 'Review logged evidence' : 'Inspect clue'}: ${clue.title}. ${clue.tooltip}`}
                    onClick={() => discoverClue(clue.id)}
                  >
                    <span className="access-status">{found ? 'Logged evidence' : 'Inspect hotspot'}</span>
                    <strong>{clue.title}</strong>
                    <small>{clue.tooltip}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="access-section" aria-labelledby="access-witnesses-heading">
            <div className="access-section-title">
              <h3 id="access-witnesses-heading">Witnesses</h3>
              <span>{witnesses.length}</span>
            </div>
            <div className="access-item-list">
              {witnesses.map((witness) => (
                <button
                  type="button"
                  key={witness.id}
                  className="access-item access-witness"
                  onClick={() => {
                    selectWitness(witness.id);
                    setOpen(false);
                  }}
                >
                  <span className="access-status">Interview</span>
                  <strong>{witness.name}</strong>
                  <small>{witness.role}</small>
                </button>
              ))}
            </div>
          </section>
        </aside>
      )}
    </>
  );
}
