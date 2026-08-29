import { describe, expect, it } from 'vitest';
import { mapAnchorKey, readEntityAnchors, requireEntityAnchor } from './mapEntities';

describe('Tiled entity anchors', () => {
  it('reads clue, witness and player positions from object properties', () => {
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
      { type: 'player', properties: [
        { name: 'entityId', value: 'detective' },
        { name: 'tileX', value: 2 },
        { name: 'tileY', value: 6 },
      ] },
    ]);

    expect(anchors.get(mapAnchorKey('clue', 'keycard-log'))).toMatchObject({ tileX: 2, tileY: 2 });
    expect(anchors.get(mapAnchorKey('witness', 'nina'))).toMatchObject({ tileX: 2, tileY: 6 });
    expect(anchors.get(mapAnchorKey('player', 'detective'))).toMatchObject({ tileX: 2, tileY: 6 });
  });

  it('ignores malformed or decorative Tiled objects', () => {
    const anchors = readEntityAnchors([
      { type: 'decoration', properties: [{ name: 'entityId', value: 'lamp' }] },
      { type: 'clue', properties: [{ name: 'entityId', value: 'missing-position' }] },
    ]);
    expect(anchors.size).toBe(0);
  });

  it('rejects duplicate gameplay anchors instead of silently overwriting them', () => {
    const duplicate = { type: 'witness', properties: [
      { name: 'entityId', value: 'nina' },
      { name: 'tileX', value: 2 },
      { name: 'tileY', value: 6 },
    ] };
    expect(() => readEntityAnchors([duplicate, duplicate])).toThrow(/duplicate witness anchor: nina/i);
  });

  it('fails closed when the map omits a required gameplay anchor', () => {
    expect(() => requireEntityAnchor(new Map(), 'witness', 'marek')).toThrow(/missing required witness anchor: marek/i);
  });
});
