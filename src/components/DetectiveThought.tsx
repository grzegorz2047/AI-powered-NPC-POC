import { useEffect } from 'react';
import { chooseNarrationVoice, resolveNarrationLocale } from '../audio/narration';
import { useInvestigationStore } from '../state/investigationStore';

export function DetectiveThought() {
  const thought = useInvestigationStore((state) => state.detectiveThought);
  const muted = useInvestigationStore((state) => state.muted);
  const toggleMute = useInvestigationStore((state) => state.toggleMute);

  useEffect(() => {
    if (muted || !thought || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;

    const synthesis = window.speechSynthesis;
    synthesis.cancel();

    const locale = resolveNarrationLocale(document.documentElement.lang, navigator.language);
    const utterance = new SpeechSynthesisUtterance(thought);
    utterance.lang = locale;
    utterance.rate = 0.94;

    const voice = chooseNarrationVoice(synthesis.getVoices(), locale);
    if (voice) {
      utterance.voice = synthesis.getVoices().find((item) => item.name === voice.name && item.lang === voice.lang) ?? null;
      utterance.lang = voice.lang;
    }

    synthesis.speak(utterance);
    return () => synthesis.cancel();
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
