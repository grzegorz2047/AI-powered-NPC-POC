import { describe, expect, it } from 'vitest';
import { chooseNarrationVoice, resolveNarrationLocale, type NarrationVoice } from './narration';

const voices: NarrationVoice[] = [
  { name: 'English UK', lang: 'en-GB' },
  { name: 'Polish', lang: 'pl-PL' },
  { name: 'Polish alt', lang: 'pl' },
];

describe('detective narration voice selection', () => {
  it('normalizes Polish app locale to pl-PL', () => {
    expect(resolveNarrationLocale('pl')).toBe('pl-PL');
    expect(resolveNarrationLocale('pl-PL')).toBe('pl-PL');
  });

  it('prefers an exact locale voice and falls back to the same language', () => {
    expect(chooseNarrationVoice(voices, 'pl-PL')?.name).toBe('Polish');
    expect(chooseNarrationVoice([{ name: 'Polish alt', lang: 'pl' }], 'pl-PL')?.name).toBe('Polish alt');
  });

  it('returns null when no matching language exists so the browser can use its system fallback', () => {
    expect(chooseNarrationVoice([{ name: 'English UK', lang: 'en-GB' }], 'pl-PL')).toBeNull();
  });

  it('uses browser language only when the document has no language', () => {
    expect(resolveNarrationLocale('', 'pl_PL')).toBe('pl-PL');
    expect(resolveNarrationLocale('', 'en-US')).toBe('en-GB');
  });
});
