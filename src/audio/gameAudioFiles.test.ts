import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME_AUDIO } from './gameAudio';

describe('checked-in Phaser audio assets', () => {
  it('keeps every manifest WAV present and structurally valid', () => {
    for (const asset of Object.values(GAME_AUDIO)) {
      const relative = asset.url.replace(/^\//, '');
      const file = readFileSync(new URL(`../../public/${relative}`, import.meta.url));
      expect(file.length, `${asset.url} payload`).toBeGreaterThan(44);
      expect(file.subarray(0, 4).toString('ascii'), `${asset.url} RIFF header`).toBe('RIFF');
      expect(file.subarray(8, 12).toString('ascii'), `${asset.url} WAVE header`).toBe('WAVE');
    }
  });
});
