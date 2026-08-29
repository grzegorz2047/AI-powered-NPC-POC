import * as EasyStar from 'easystarjs';

export type TilePoint = { x: number; y: number };

export function createWalkabilityMatrix(
  width: number,
  height: number,
  isWalkable: (x: number, y: number) => boolean,
): number[][] {
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => (isWalkable(x, y) ? 1 : 0)),
  );
}

export function findTilePath(grid: number[][], from: TilePoint, to: TilePoint): TilePoint[] {
  if (!grid.length || !grid[0]?.length) return [];

  const solver = new EasyStar.js();
  solver.setGrid(grid);
  solver.setAcceptableTiles([1]);
  solver.enableSync();

  let resolved: TilePoint[] | null = null;
  solver.findPath(from.x, from.y, to.x, to.y, (path) => {
    resolved = path;
  });
  solver.calculate();

  return resolved ?? [];
}
