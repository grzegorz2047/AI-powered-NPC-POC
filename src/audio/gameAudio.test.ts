import { describe, expect, it } from 'vitest';
import { audioForNewClue, totalContradictions } from './gameAudio';

describe('game audio contract', () => {
  it('plays a keycard click before the generic evidence sting for M-01', () => {
    expect(audioForNewClue('keycard-log')).toEqual(['cardClick', 'evidence']);
  });

  it('uses only the evidence sting for other clues', () => {
    expect(audioForNewClue('green-fiber')).toEqual(['evidence']);
  });

  it('counts distinct contradiction ids across witnesses', () => {
    expect(totalContradictions({
      marek: { contradictionIds: ['card', 'camera'] },
      nina: { contradictionIds: ['card-owner'] },
    })).toBe(3);
  });
});
