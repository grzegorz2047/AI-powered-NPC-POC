import { describe, expect, it } from 'vitest';
import { isometricWallGeometry, isPerspectiveCorrectWall } from './isometricArchitecture';

describe('isometric architecture', () => {
  it.each([
    ['nw', -64, 32],
    ['ne', 64, 32],
  ] as const)('projects %s walls onto the same 2:1 diamond as the floor', (side, dx, dy) => {
    const wall = isometricWallGeometry(640, 320, side, 156);

    expect(wall.baseEnd.x - wall.baseStart.x).toBe(dx);
    expect(wall.baseEnd.y - wall.baseStart.y).toBe(dy);
    expect(wall.topStart.x).toBe(wall.baseStart.x);
    expect(wall.topEnd.x).toBe(wall.baseEnd.x);
    expect(wall.baseStart.y - wall.topStart.y).toBe(156);
    expect(wall.baseEnd.y - wall.topEnd.y).toBe(156);
    expect(isPerspectiveCorrectWall(wall)).toBe(true);
  });

  it('rejects a pasted upright rectangle as an isometric wall', () => {
    const wrong = {
      ...isometricWallGeometry(640, 320, 'ne', 156),
      baseEnd: { x: 768, y: 320 },
    };

    expect(isPerspectiveCorrectWall(wrong)).toBe(false);
  });
});
