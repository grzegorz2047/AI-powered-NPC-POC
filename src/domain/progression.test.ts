import { describe, expect, it } from 'vitest';
import { availableQuestions, questionsUnlockedByClue } from './progression';

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
