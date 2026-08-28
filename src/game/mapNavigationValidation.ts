import type { MapEntityAnchor, MapEntityKind } from './mapEntities';
import { findTilePath, type TilePoint } from './tilePathfinding';

export type RequiredMapTarget = {
  kind: Extract<MapEntityKind, 'clue' | 'witness'>;
  entityId: string;
};

export type MapNavigationIssue = {
  kind: 'not-walkable' | 'unreachable';
  target: RequiredMapTarget;
  message: string;
};

function isWalkable(grid: number[][], point: TilePoint) {
  return grid[point.y]?.[point.x] === 1;
}

export function validateRequiredNavigation(
  grid: number[][],
  player: MapEntityAnchor,
  targets: Array<{ requirement: RequiredMapTarget; anchor: MapEntityAnchor }>,
): MapNavigationIssue[] {
  const issues: MapNavigationIssue[] = [];
  const start = { x: player.tileX, y: player.tileY };

  for (const { requirement, anchor } of targets) {
    const destination = { x: anchor.tileX, y: anchor.tileY };
    if (!isWalkable(grid, destination)) {
      issues.push({
        kind: 'not-walkable',
        target: requirement,
        message: `${requirement.kind} ${requirement.entityId} is not on a Walkable tile`,
      });
      continue;
    }

    if (destination.x === start.x && destination.y === start.y) continue;

    if (!findTilePath(grid, start, destination).length) {
      issues.push({
        kind: 'unreachable',
        target: requirement,
        message: `${requirement.kind} ${requirement.entityId} is unreachable from the player spawn`,
      });
    }
  }

  return issues;
}
