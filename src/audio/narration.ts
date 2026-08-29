export type NarrationVoice = Pick<SpeechSynthesisVoice, 'lang' | 'name'>;

export function resolveNarrationLocale(documentLanguage?: string, browserLanguage?: string): string {
  const requested = (documentLanguage || browserLanguage || 'pl-PL').trim();
  const normalized = requested.replace('_', '-');
  const base = normalized.split('-')[0]?.toLowerCase();

  if (base === 'pl') return 'pl-PL';
  if (base === 'en') return 'en-GB';
  return normalized || 'pl-PL';
}

export function chooseNarrationVoice(voices: readonly NarrationVoice[], locale: string): NarrationVoice | null {
  const normalizedLocale = locale.toLowerCase();
  const exact = voices.find((voice) => voice.lang.toLowerCase() === normalizedLocale);
  if (exact) return exact;

  const base = normalizedLocale.split('-')[0];
  return voices.find((voice) => voice.lang.toLowerCase().split('-')[0] === base) ?? null;
}
