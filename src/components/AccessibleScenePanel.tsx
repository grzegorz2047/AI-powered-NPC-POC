import { useEffect, useState } from 'react';
import { clues, witnesses } from '../data/caseData';
import { useGameInputBlocker } from '../game/useGameInputBlocker';
import { WORLD_MAPS } from '../game/worldManifest';
import { useInvestigationStore } from '../state/investigationStore';
import { useWorldStore } from '../state/worldStore';

export function AccessibleScenePanel() {
  const [open, setOpen] = useState(false);
  const discovered = useInvestigationStore((state) => state.discoveredClueIds);
  const discoverClue = useInvestigationStore((state) => state.discoverClue);
  const selectWitness = useInvestigationStore((state) => state.selectWitness);
  const currentMapId = useWorldStore((state) => state.currentMapId);
  const currentMap = WORLD_MAPS[currentMapId];
  const localClues = clues.filter((clue) => (currentMap.clueIds as readonly string[]).includes(clue.id));
  const localWitnesses = witnesses.filter((witness) => (currentMap.witnessIds as readonly string[]).includes(witness.id));
  const localDiscovered = localClues.filter((clue) => discovered.includes(clue.id)).length;
  useGameInputBlocker('scene-list', open);

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
            {currentMap.title}. Keyboard alternative to the canvas. Only people and hotspots physically present on this hotel level are listed here.
          </p>

          <section className="access-section" aria-labelledby="access-clues-heading">
            <div className="access-section-title">
              <h3 id="access-clues-heading">Clues on this level</h3>
              <span>{localDiscovered}/{localClues.length}</span>
            </div>
            <div className="access-item-list">
              {localClues.length === 0 && <p className="small-copy">No investigation hotspots on this level.</p>}
              {localClues.map((clue) => {
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
              <h3 id="access-witnesses-heading">Witnesses on this level</h3>
              <span>{localWitnesses.length}</span>
            </div>
            <div className="access-item-list">
              {localWitnesses.length === 0 && <p className="small-copy">No witness is currently on this level.</p>}
              {localWitnesses.map((witness) => (
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
