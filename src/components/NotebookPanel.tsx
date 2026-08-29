import { clueById } from '../data/caseData';
import { useGameInputBlocker } from '../game/useGameInputBlocker';
import { useInvestigationStore } from '../state/investigationStore';
import './notebookPanel.css';

export function NotebookPanel() {
  const [open, setOpen] = useInvestigationStore((state) => [state.notebookOpen ?? false, state.setNotebookOpen] as const);
  const clueIds = useInvestigationStore((state) => state.discoveredClueIds);
  const thought = useInvestigationStore((state) => state.detectiveThought);

  useGameInputBlocker('notebook', Boolean(open));

  return (
    <>
      <button type="button" className="ghost-button" onClick={() => setOpen?.(!open)}>
        Notebook
      </button>
      {open && (
        <aside className="notebook-drawer" role="dialog" aria-label="Detective notebook">
          <div className="panel-heading">
            <span>Notebook</span>
            <button type="button" onClick={() => setOpen?.(false)}>Close</button>
          </div>
          <div className="notebook-copy">
            <span className="notebook-label">Current thought</span>
            <p>{thought}</p>
          </div>
          <div className="notebook-notes">
            <span className="notebook-label">Evidence notes</span>
            {clueIds.length === 0 ? (
              <p className="small-copy">No evidence logged yet.</p>
            ) : (
              <ul>
                {clueIds.map((id) => {
                  const clue = clueById[id];
                  return clue ? <li key={id}><strong>{clue.title}</strong><span>{clue.description}</span></li> : null;
                })}
              </ul>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
