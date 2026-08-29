import { describe, expect, it } from 'vitest';
import { applyWitnessEffects, availableQuestions, questionsUnlockedByClue } from './progression';

describe('investigation question progression', () => {
  it('unlocks evidence-gated questions only after the required clue exists', () => {
    expect(availableQuestions('nina', []).map((item) => item.id)).not.toContain('nina-card');
    expect(availableQuestions('nina', ['keycard-log']).map((item) => item.id)).toContain('nina-card');
  });

  it('attributes a multi-clue lead to the clue that completed its requirements', () => {
    expect(questionsUnlockedByClue('cctv-note', ['cctv-note']).map((item) => item.id)).not.toContain('marek-camera');
    expect(questionsUnlockedByClue('cctv-still', ['cctv-note', 'cctv-still']).map((item) => item.id)).toContain('marek-camera');
    expect(questionsUnlockedByClue('cctv-note', ['cctv-still', 'cctv-note']).map((item) => item.id)).toContain('marek-camera');
  });

  it('returns all single-clue leads triggered by the master keycard log', () => {
    expect(questionsUnlockedByClue('keycard-log', ['keycard-log']).map((item) => item.id).sort()).toEqual([
      'marek-card',
      'nina-card',
      'nina-return',
    ]);
  });
});

describe('witness contradiction progress', () => {
  it('counts a contradiction key only once while still applying resistance pressure', () => {
    const first = applyWitnessEffects(
      { resistance: 90, contradictions: 0, contradictionIds: [] },
      { resistanceDelta: -10, contradictionDelta: 1, contradictionId: 'marek-keycard' },
    );
    const repeated = applyWitnessEffects(first, { resistanceDelta: -10, contradictionDelta: 1, contradictionId: 'marek-keycard' });

    expect(first.contradictions).toBe(1);
    expect(repeated.contradictions).toBe(1);
    expect(repeated.resistance).toBe(70);
    expect(repeated.contradictionIds).toEqual(['marek-keycard']);
  });

  it('counts three distinct contradictions independently', () => {
    let progress = { resistance: 90, contradictions: 0, contradictionIds: [] as string[] };
    for (const id of ['marek-keycard', 'marek-corrected-cctv', 'marek-ledger']) {
      progress = applyWitnessEffects(progress, { resistanceDelta: -10, contradictionDelta: 1, contradictionId: id });
    }
    expect(progress.contradictions).toBe(3);
    expect(progress.contradictionIds).toHaveLength(3);
  });
});
