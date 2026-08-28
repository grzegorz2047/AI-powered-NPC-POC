import { useEffect } from 'react';
import { useInvestigationStore } from '../state/investigationStore';

export function DetectiveThought() {
  const thought = useInvestigationStore((state) => state.detectiveThought);
  const muted = useInvestigationStore((state) => state.muted);
  const toggleMute = useInvestigationStore((state) => state.toggleMute);

  useEffect(() => {
    if (muted || !thought || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(thought);
    utterance.lang = 'en-GB';
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [thought, muted]);

  return (
    <div className="detective-thought" aria-live="polite">
      <span className="thought-kicker">DETECTIVE</span>
      <p>{thought}</p>
      <button type="button" className="ghost-button" onClick={toggleMute}>
        {muted ? 'Narrator off' : 'Narrator on'}
      </button>
    </div>
  );
}
