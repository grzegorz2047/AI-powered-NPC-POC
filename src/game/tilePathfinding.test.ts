import { describe, expect, it } from 'vitest';
import { createWalkabilityMatrix, findTilePath } from './tilePathfinding';

describe('tile pathfinding', () => {
  it('routes around blocked tiles instead of crossing them', () => {
    const grid = createWalkabilityMatrix(5, 3, (x, y) => !(x === 2 && y < 2));
    const path = findTilePath(grid, { x: 0, y: 0 }, { x: 4, y: 0 });

    expect(path.at(0)).toEqual({ x: 0, y: 0 });
    expect(path.at(-1)).toEqual({ x: 4, y: 0 });
    expect(path.some((point) => point.x === 2 && point.y < 2)).toBe(false);
    expect(path.some((point) => point.x === 2 && point.y === 2)).toBe(true);
  });

  it('returns an empty path when the target is unreachable', () => {
    const grid = [
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
    ];
    expect(findTilePath(grid, { x: 0, y: 0 }, { x: 2, y: 0 })).toEqual([]);
  });
});
