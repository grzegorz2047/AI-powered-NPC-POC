export type WalkabilityGrid = number[][];

export function isWalkableCell(grid: WalkabilityGrid, x: number, y: number) {
  return grid[y]?.[x] === 1;
}

/**
 * Visual walls and the navigation collider use the same edge policy:
 * a wall may be drawn only if it does not separate two navigable cells.
 * A* still owns movement collision; this guard prevents the art from lying
 * about where the player can actually walk.
 */
export function shouldRenderWallBetween(
  grid: WalkabilityGrid,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  return !(isWalkableCell(grid, ax, ay) && isWalkableCell(grid, bx, by));
}
