import { describe, expect, it } from 'vitest';
import { mapAnchorKey, readEntityAnchors } from './mapEntities';

describe('Tiled entity anchors', () => {
  it('reads clue and witness positions from object properties', () => {
    const anchors = readEntityAnchors([
      { type: 'clue', properties: [
        { name: 'entityId', value: 'keycard-log' },
        { name: 'tileX', value: 2 },
        { name: 'tileY', value: 2 },
      ] },
      { type: 'witness', properties: [
        { name: 'entityId', value: 'nina' },
        { name: 'tileX', value: 2 },
        { name: 'tileY', value: 6 },
      ] },
    ]);

    expect(anchors.get(mapAnchorKey('clue', 'keycard-log'))).toMatchObject({ tileX: 2, tileY: 2 });
    expect(anchors.get(mapAnchorKey('witness', 'nina'))).toMatchObject({ tileX: 2, tileY: 6 });
  });

  it('ignores malformed or decorative Tiled objects', () => {
    const anchors = readEntityAnchors([
      { type: 'decoration', properties: [{ name: 'entityId', value: 'lamp' }] },
      { type: 'clue', properties: [{ name: 'entityId', value: 'missing-position' }] },
    ]);
    expect(anchors.size).toBe(0);
  });
});
