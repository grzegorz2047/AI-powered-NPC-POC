import { FormEvent, useMemo, useState } from 'react';
import { askNpc } from '../ai/npcRuntime';
import { witnessById } from '../data/caseData';
import { availableQuestions } from '../domain/progression';
import { useAiSettingsStore } from '../state/aiSettingsStore';
import { useInvestigationStore } from '../state/investigationStore';

function resistanceLabel(value: number) {
  if (value <= 30) return 'open';
  if (value <= 55) return 'guarded';
  if (value <= 75) return 'closed';
  return 'very difficult';
}

export function InterviewPanel() {
  const witnessId = useInvestigationStore((state) => state.selectedWitnessId);
  const selectWitness = useInvestigationStore((state) => state.selectWitness);
  const clueIds = useInvestigationStore((state) => state.discoveredClueIds);
  const transcripts = useInvestigationStore((state) => state.transcripts);
  const progress = useInvestigationStore((state) => state.witnessProgress);
  const addExchange = useInvestigationStore((state) => state.addInterviewExchange);
  const activeBackend = useAiSettingsStore((state) => state.runtime.activeBackend);
  const provider = useAiSettingsStore((state) => state.provider);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);

  const witness = witnessId ? witnessById[witnessId] : undefined;
  const questions = useMemo(() => witnessId ? availableQuestions(witnessId, clueIds) : [], [witnessId, clueIds]);

  if (!witnessId || !witness) return null;

  const activeWitnessId = witnessId;
  const transcript = transcripts[activeWitnessId] ?? [];
  const witnessProgress = progress[activeWitnessId] ?? { resistance: witness.resistance, contradictions: 0 };

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const payload = await askNpc({
        witnessId: activeWitnessId,
        question: trimmed,
        evidenceIds: clueIds,
        resistance: witnessProgress.resistance,
        contradictions: witnessProgress.contradictions,
      });
      addExchange(
        activeWitnessId,
        trimmed,
        payload.answer,
        payload.resistanceDelta,
        payload.contradictionDelta,
      );
      setQuestion('');
    } catch {
      addExchange(activeWitnessId, trimmed, 'The witness stares at you and says nothing.');
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Interview with ${witness.name}`}>
      <section className="interview-panel">
        <header className="interview-header">
          <div>
            <span className="eyebrow">WITNESS / {resistanceLabel(witnessProgress.resistance)} · AI {activeBackend ?? provider}</span>
            <h2>{witness.name}</h2>
            <p>{witness.role}</p>
          </div>
          <button type="button" className="close-button" onClick={() => selectWitness(null)}>Close</button>
        </header>

        <div className="transcript">
          {transcript.length === 0 && <p className="empty-copy">Ask a suggested question or type your own.</p>}
          {transcript.map((line) => (
            <div key={line.id} className={`line line-${line.speaker}`}>
              <b>{line.speaker === 'detective' ? 'You' : witness.name.split(' ')[0]}</b>
              <span>{line.text}</span>
            </div>
          ))}
        </div>

        <div className="question-suggestions">
          {questions.map((item) => (
            <button key={item.id} type="button" onClick={() => void ask(item.text)} disabled={busy}>
              {item.text}
            </button>
          ))}
        </div>

        <form className="ask-form" onSubmit={submit}>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask anything about the case..."
            maxLength={420}
          />
          <button type="submit" disabled={busy || !question.trim()}>{busy ? 'Thinking...' : 'Ask'}</button>
        </form>
      </section>
    </div>
  );
}
