import { describe, expect, it } from 'vitest';
import { accusationReadiness, evaluateAccusation } from './accusation';

const witnessIds = ['kamil', 'nina', 'irena', 'marek'];

describe('accusation readiness', () => {
  it('requires every witness to be questioned even when enough evidence exists', () => {
    const readiness = accusationReadiness(
      ['keycard-log', 'burnt-ledger', 'brass-heron', 'cctv-still'],
      {
        kamil: [{ speaker: 'witness' }],
        nina: [{ speaker: 'witness' }],
        irena: [{ speaker: 'witness' }],
      },
      witnessIds,
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.missingWitnessIds).toEqual(['marek']);
    expect(readiness.missingEvidenceCount).toBe(0);
  });

  it('becomes ready only after enough evidence and all witnesses', () => {
    const transcripts = Object.fromEntries(witnessIds.map((id) => [id, [{ speaker: 'witness' }]]));
    expect(accusationReadiness(['a', 'b', 'c'], transcripts, witnessIds).ready).toBe(false);
    expect(accusationReadiness(['a', 'b', 'c', 'd'], transcripts, witnessIds).ready).toBe(true);
  });
});

describe('accusation evaluation', () => {
  const canonicalEvidence = ['keycard-log', 'burnt-ledger', 'brass-heron', 'cctv-still'];
  const discovered = [...canonicalEvidence, 'cctv-note'];

  it('accepts the canonical perpetrator, motive, method and evidence chain', () => {
    expect(evaluateAccusation({
      suspectId: 'marek',
      motiveId: 'financial-exposure',
      methodId: 'blunt-hotel-object',
      selectedEvidenceIds: canonicalEvidence,
      discoveredClueIds: discovered,
    }).correct).toBe(true);
  });

  it('rejects an accusation that found key evidence but did not actually present it', () => {
    expect(evaluateAccusation({
      suspectId: 'marek',
      motiveId: 'financial-exposure',
      methodId: 'blunt-hotel-object',
      selectedEvidenceIds: ['whisky-glass', 'green-fiber', 'brass-heron', 'cctv-still'],
      discoveredClueIds: discovered,
    }).correct).toBe(false);
  });

  it('requires the CCTV service note to justify the corrected still timeline', () => {
    expect(evaluateAccusation({
      suspectId: 'marek',
      motiveId: 'financial-exposure',
      methodId: 'blunt-hotel-object',
      selectedEvidenceIds: canonicalEvidence,
      discoveredClueIds: canonicalEvidence,
    }).correct).toBe(false);
  });
});
