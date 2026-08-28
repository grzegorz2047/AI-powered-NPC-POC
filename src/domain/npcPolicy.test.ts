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
      pressure: 'confront',
    });
    expect(result.allowedFacts).toEqual(['Marek denies killing Rylski']);
    expect(result.answer).not.toMatch(/I only meant to stop him/i);
  });

  it('still blocks Marek after three contradictions while his resistance is high', () => {
    const result = evaluateNpcPolicy({
      witnessId: 'marek',
      question: 'Explain the heron weapon.',
      evidenceIds: ['brass-heron'],
      resistance: 82,
      contradictions: 3,
      pressure: 'confront',
    });
    expect(result.allowedFacts).not.toContain('Marek admits the fatal blow and staging the scene');
    expect(result.resistanceDelta).toBeLessThan(0);
  });

  it('allows confession after distinct contradiction pressure lowered resistance', () => {
    const result = evaluateNpcPolicy({
      witnessId: 'marek',
      question: 'Explain the heron weapon.',
      evidenceIds: ['brass-heron'],
      resistance: 50,
      contradictions: 3,
      pressure: 'confront',
    });
    expect(result.allowedFacts).toContain('Marek admits the fatal blow and staging the scene');
  });

  it('makes Irena reveal only a partial observation before empathy lowers her resistance', () => {
    const guarded = evaluateNpcPolicy({
      witnessId: 'irena',
      question: 'Did you see someone carrying something wrapped in green cloth?',
      evidenceIds: ['green-fiber'],
      resistance: 70,
      contradictions: 0,
      pressure: 'empathy',
    });
    expect(guarded.allowedFacts).not.toContain('Irena saw Wolski carrying a wrapped heavy object from room 307');
    expect(guarded.resistanceDelta).toBe(-16);

    const reassured = evaluateNpcPolicy({
      witnessId: 'irena',
      question: 'Who was carrying the green cloth?',
      evidenceIds: ['green-fiber'],
      resistance: 54,
      contradictions: 0,
      pressure: 'empathy',
    });
    expect(reassured.allowedFacts).toContain('Irena saw Wolski carrying a wrapped heavy object from room 307');
  });

  it('makes confrontation counterproductive with frightened Irena', () => {
    const result = evaluateNpcPolicy({
      witnessId: 'irena',
      question: 'What did you hear near 307?',
      evidenceIds: [],
      resistance: 70,
      contradictions: 0,
      pressure: 'confront',
    });
    expect(result.resistanceDelta).toBeGreaterThan(0);
    expect(result.allowedFacts).not.toContain('One voice sounded like Wolski');
  });
});
