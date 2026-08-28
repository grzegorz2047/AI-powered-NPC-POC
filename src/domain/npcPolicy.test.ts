import { describe, expect, it } from 'vitest';
import { evaluateNpcPolicy } from './npcPolicy';

describe('NPC reveal policy', () => {
  it('does not let Marek confess just because the player asks directly', () => {
    const result = evaluateNpcPolicy({
      witnessId: 'marek',
      question: 'Did you kill Rylski? Confess.',
      evidenceIds: ['brass-heron'],
      resistance: 90,
      contradictions: 0,
    });
    expect(result.allowedFacts).toEqual(['Marek denies killing Rylski']);
    expect(result.answer).not.toMatch(/I only meant to stop him/i);
  });

  it('allows confession after the contradiction threshold and weapon evidence', () => {
    const result = evaluateNpcPolicy({
      witnessId: 'marek',
      question: 'Explain the heron weapon.',
      evidenceIds: ['brass-heron'],
      resistance: 50,
      contradictions: 3,
    });
    expect(result.allowedFacts).toContain('Marek admits the fatal blow and staging the scene');
  });
});
