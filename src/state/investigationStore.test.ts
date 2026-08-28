import { describe, expect, it } from 'vitest';
import { addUnique, availableQuestions } from '../domain/progression';

describe('investigation progression', () => {
  it('unlocks the master-card question only after finding the log', () => {
    expect(availableQuestions('nina', [])).toHaveLength(0);
    expect(availableQuestions('nina', ['keycard-log']).map((q) => q.id)).toContain('nina-card');
  });

  it('adds a clue only once', () => {
    expect(addUnique(['keycard-log'], 'keycard-log')).toEqual(['keycard-log']);
    expect(addUnique([], 'keycard-log')).toEqual(['keycard-log']);
  });
});
