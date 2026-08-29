import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { shouldRenderWallBetween } from './wallCollider';
import { ROOSEVELT_PARTITION_AREA_IDS, ROOSEVELT_VISUAL_AREAS } from './visualTarget';

const MAP_IDS = ['roosevelt-lobby', 'roosevelt-floor-3', 'roosevelt-basement'] as const;
type RooseveltMapId = (typeof MAP_IDS)[number];

type TileLayer = {
  name?: string;
  type?: string;
  width?: number;
  height?: number;
  data?: number[];
};

type TiledMap = {
  width: number;
  height: number;
  layers: TileLayer[];
};

function readMap(mapId: RooseveltMapId): TiledMap {
  const url = new URL(`../../public/maps/${mapId}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8')) as TiledMap;
}

function tileLayer(map: TiledMap, name: string) {
  const layer = map.layers.find((candidate) => candidate.type === 'tilelayer' && candidate.name === name);
  if (!layer?.data) throw new Error(`${name} tile layer is missing`);
  return layer.data;
}

function hasTile(data: number[], width: number, height: number, x: number, y: number) {
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  return (data[y * width + x] ?? 0) > 0;
}

function walkabilityGrid(map: TiledMap, walkable: number[]) {
  return Array.from({ length: map.height }, (_, y) =>
    Array.from({ length: map.width }, (_, x) => (hasTile(walkable, map.width, map.height, x, y) ? 1 : 0)),
  );
}

function collectRenderedFloor(mapId: RooseveltMapId, map: TiledMap) {
  const floor = tileLayer(map, 'Floor');
  const walkable = tileLayer(map, 'Walkable');
  const visible = new Set<string>();

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      // RooseveltScene intentionally guarantees that every navigation cell gets a visible floor tile.
      if (
        hasTile(floor, map.width, map.height, x, y)
        || hasTile(walkable, map.width, map.height, x, y)
      ) visible.add(`${x}:${y}`);
    }
  }

  for (const area of ROOSEVELT_VISUAL_AREAS[mapId]) {
    for (let y = area.y; y < area.y + area.height; y += 1) {
      for (let x = area.x; x < area.x + area.width; x += 1) {
        if (x >= 0 && y >= 0 && x < map.width && y < map.height) visible.add(`${x}:${y}`);
      }
    }
  }

  return visible;
}

describe('Roosevelt wall/collider contract', () => {
  it.each(MAP_IDS)('%s keeps every navigable tile on rendered floor', (mapId) => {
    const map = readMap(mapId);
    const walkable = tileLayer(map, 'Walkable');
    const visible = collectRenderedFloor(mapId, map);

    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        if (!hasTile(walkable, map.width, map.height, x, y)) continue;
        expect(visible.has(`${x}:${y}`), `${mapId}: walkable ${x}:${y} has no rendered floor`).toBe(true);
      }
    }
  });

  it.each(MAP_IDS)('%s treats every walkable crossing as an opening, never a visual wall', (mapId) => {
    const map = readMap(mapId);
    const walkable = tileLayer(map, 'Walkable');
    const grid = walkabilityGrid(map, walkable);
    const visible = collectRenderedFloor(mapId, map);
    const partitionAreaIds = new Set<string>(ROOSEVELT_PARTITION_AREA_IDS[mapId]);
    const isVisible = (x: number, y: number) => visible.has(`${x}:${y}`);
    let skippedWalkableCrossings = 0;

    for (const area of ROOSEVELT_VISUAL_AREAS[mapId]) {
      if (!partitionAreaIds.has(area.id)) continue;

      const topOpeningX = area.x + Math.floor(area.width / 2);
      for (let x = area.x; x < area.x + area.width; x += 1) {
        if (x === topOpeningX || !isVisible(x, area.y - 1)) continue;
        if (!shouldRenderWallBetween(grid, x, area.y, x, area.y - 1)) {
          skippedWalkableCrossings += 1;
          continue;
        }
        expect(
          grid[area.y]?.[x] === 1 && grid[area.y - 1]?.[x] === 1,
          `${mapId}/${area.id}: rendered top wall crosses walkable edge at ${x}:${area.y}`,
        ).toBe(false);
      }

      const leftOpeningY = area.y + Math.floor(area.height / 2);
      for (let y = area.y; y < area.y + area.height; y += 1) {
        if (y === leftOpeningY || !isVisible(area.x - 1, y)) continue;
        if (!shouldRenderWallBetween(grid, area.x, y, area.x - 1, y)) {
          skippedWalkableCrossings += 1;
          continue;
        }
        expect(
          grid[y]?.[area.x] === 1 && grid[y]?.[area.x - 1] === 1,
          `${mapId}/${area.id}: rendered left wall crosses walkable edge at ${area.x}:${y}`,
        ).toBe(false);
      }
    }

    expect(skippedWalkableCrossings, `${mapId}: collision-aware wall openings should be exercised`).toBeGreaterThan(0);
  });
});
