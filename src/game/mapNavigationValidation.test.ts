import { describe, expect, it } from 'vitest';
import { validateRequiredNavigation } from './mapNavigationValidation';

describe('map navigation validation', () => {
  const player = { entityId: 'detective', kind: 'player' as const, tileX: 0, tileY: 0 };

  it('accepts targets connected through a valid walkable route', () => {
    const grid = [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ];

    expect(validateRequiredNavigation(grid, player, [
      {
        requirement: { kind: 'clue', entityId: 'keycard-log' },
        anchor: { entityId: 'keycard-log', kind: 'clue', tileX: 2, tileY: 2 },
      },
    ])).toEqual([]);
  });

  it('reports an isolated required witness', () => {
    const grid = [
      [1, 1, 0],
      [0, 0, 0],
      [0, 1, 1],
    ];

    expect(validateRequiredNavigation(grid, player, [
      {
        requirement: { kind: 'witness', entityId: 'marek' },
        anchor: { entityId: 'marek', kind: 'witness', tileX: 2, tileY: 2 },
      },
    ])).toEqual([expect.objectContaining({ kind: 'unreachable' })]);
  });

  it('reports a required anchor outside Walkable', () => {
    const grid = [[1, 0]];
    expect(validateRequiredNavigation(grid, player, [
      {
        requirement: { kind: 'clue', entityId: 'green-fiber' },
        anchor: { entityId: 'green-fiber', kind: 'clue', tileX: 1, tileY: 0 },
      },
    ])).toEqual([expect.objectContaining({ kind: 'not-walkable' })]);
  });
});
