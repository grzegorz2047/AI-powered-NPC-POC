import Phaser from 'phaser';
import { isPerspectiveCorrectWall, type IsometricWallGeometry } from './isometricArchitecture';

export type WallAuditSegment = {
  tileX: number;
  tileY: number;
  internal: boolean;
  sconce: boolean;
  geometry: IsometricWallGeometry;
};

export type VisualAuditReport = {
  mapId: string;
  errors: string[];
  metrics: {
    wallCount: number;
    perspectiveCorrectCount: number;
    sconceCount: number;
    minimumWallHeight: number;
    duplicateWallCount: number;
    walkableCollisionConflicts: number;
  };
};

type VisualAuditBridge = {
  report: VisualAuditReport;
  setOverlay: (visible: boolean) => void;
};

type AuditWindow = Window & {
  __NOCTURNE_VISUAL_AUDIT__?: VisualAuditBridge;
};

function adjacentTile(segment: WallAuditSegment) {
  if (segment.geometry.side === 'nw') return { x: segment.tileX - 1, y: segment.tileY };
  return { x: segment.tileX, y: segment.tileY - 1 };
}

function isWalkable(grid: number[][], x: number, y: number) {
  return grid[y]?.[x] === 1;
}

export function buildVisualAuditReport(
  mapId: string,
  segments: readonly WallAuditSegment[],
  requiredMinimumHeight: number,
  walkabilityGrid: number[][],
): VisualAuditReport {
  const errors: string[] = [];
  const keys = new Set<string>();
  let perspectiveCorrectCount = 0;
  let duplicateWallCount = 0;
  let walkableCollisionConflicts = 0;
  let minimumWallHeight = Number.POSITIVE_INFINITY;

  for (const segment of segments) {
    const key = `${segment.tileX}:${segment.tileY}:${segment.geometry.side}`;
    if (keys.has(key)) {
      duplicateWallCount += 1;
      errors.push(`duplicate wall ${key}`);
    }
    keys.add(key);

    if (isPerspectiveCorrectWall(segment.geometry)) perspectiveCorrectCount += 1;
    else errors.push(`wall ${key} is not projected on the 2:1 floor diamond`);

    minimumWallHeight = Math.min(minimumWallHeight, segment.geometry.height);
    if (segment.geometry.height < requiredMinimumHeight) {
      errors.push(`wall ${key} is too short (${segment.geometry.height}px)`);
    }

    const neighbor = adjacentTile(segment);
    if (isWalkable(walkabilityGrid, segment.tileX, segment.tileY) && isWalkable(walkabilityGrid, neighbor.x, neighbor.y)) {
      walkableCollisionConflicts += 1;
      errors.push(`wall ${key} crosses two walkable tiles`);
    }
  }

  return {
    mapId,
    errors,
    metrics: {
      wallCount: segments.length,
      perspectiveCorrectCount,
      sconceCount: segments.filter((segment) => segment.sconce).length,
      minimumWallHeight: Number.isFinite(minimumWallHeight) ? minimumWallHeight : 0,
      duplicateWallCount,
      walkableCollisionConflicts,
    },
  };
}

function drawPolygonOutline(
  graphics: Phaser.GameObjects.Graphics,
  geometry: IsometricWallGeometry,
  color: number,
  alpha: number,
) {
  const points = geometry.polygon;
  graphics.lineStyle(2, color, alpha);
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) graphics.lineTo(points[index].x, points[index].y);
  graphics.closePath();
  graphics.strokePath();
  graphics.lineStyle(3, geometry.side === 'nw' ? 0x48d8ff : 0xffd65a, 0.92);
  graphics.lineBetween(geometry.baseStart.x, geometry.baseStart.y, geometry.baseEnd.x, geometry.baseEnd.y);
}

export function installVisualAuditBridge(
  scene: Phaser.Scene,
  mapId: string,
  segments: readonly WallAuditSegment[],
  requiredMinimumHeight: number,
  walkabilityGrid: number[][],
) {
  const report = buildVisualAuditReport(mapId, segments, requiredMinimumHeight, walkabilityGrid);
  const overlay = scene.add.graphics().setDepth(29000).setVisible(false).setName('visual-audit-wall-overlay');

  for (const segment of segments) {
    const adjacent = adjacentTile(segment);
    const collisionConflict = isWalkable(walkabilityGrid, segment.tileX, segment.tileY)
      && isWalkable(walkabilityGrid, adjacent.x, adjacent.y);
    const valid = isPerspectiveCorrectWall(segment.geometry)
      && segment.geometry.height >= requiredMinimumHeight
      && !collisionConflict;
    drawPolygonOutline(overlay, segment.geometry, valid ? 0x53ef8b : 0xff4d62, valid ? 0.58 : 1);
  }

  const summary = scene.add.text(22, 92, '', {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: report.errors.length ? '#ff7785' : '#7dffad',
    backgroundColor: '#050607ee',
    padding: { x: 8, y: 7 },
    lineSpacing: 3,
  }).setScrollFactor(0).setDepth(29001).setVisible(false).setName('visual-audit-summary');

  const metrics = report.metrics;
  summary.setText([
    `VISUAL GEOMETRY AUDIT / ${mapId}`,
    `walls=${metrics.wallCount} perspective=${metrics.perspectiveCorrectCount}/${metrics.wallCount}`,
    `sconces=${metrics.sconceCount} min-height=${metrics.minimumWallHeight}px`,
    `duplicates=${metrics.duplicateWallCount} collision-conflicts=${metrics.walkableCollisionConflicts}`,
    ...(report.errors.length ? report.errors.slice(0, 8).map((error) => `ERROR ${error}`) : ['OK structural wall geometry']),
  ]);

  const setOverlay = (visible: boolean) => {
    overlay.setVisible(visible);
    summary.setVisible(visible);
  };

  const target = window as AuditWindow;
  target.__NOCTURNE_VISUAL_AUDIT__ = { report, setOverlay };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    if (target.__NOCTURNE_VISUAL_AUDIT__?.report.mapId === mapId) delete target.__NOCTURNE_VISUAL_AUDIT__;
  });

  return { report, setOverlay };
}
