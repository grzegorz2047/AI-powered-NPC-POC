import { describe, expect, it } from 'vitest';
import { readMapTransitions } from './mapTransitions';

describe('Tiled map transitions', () => {
  it('accepts a transition only when its target map is declared in the world manifest', () => {
    const transitions = readMapTransitions([
      { type: 'transition', properties: [
        { name: 'transitionId', value: 'floor3-to-lobby' },
        { name: 'label', value: 'Elevator to lobby' },
        { name: 'tileX', value: 8 },
        { name: 'tileY', value: 12 },
        { name: 'targetMap', value: 'roosevelt-lobby' },
        { name: 'targetSpawn', value: 'elevator-from-floor-3' },
      ] },
    ]);

    expect(transitions).toEqual([expect.objectContaining({
      id: 'floor3-to-lobby',
      targetMap: 'roosevelt-lobby',
      targetSpawn: 'elevator-from-floor-3',
    })]);
  });

  it('drops malformed or unknown-map transitions', () => {
    const transitions = readMapTransitions([
      { type: 'transition', properties: [
        { name: 'transitionId', value: 'bad' },
        { name: 'label', value: 'Bad elevator' },
        { name: 'tileX', value: 1 },
        { name: 'tileY', value: 1 },
        { name: 'targetMap', value: 'invented-floor' },
        { name: 'targetSpawn', value: 'x' },
      ] },
      { type: 'decoration', properties: [] },
    ]);

    expect(transitions).toEqual([]);
  });
});
