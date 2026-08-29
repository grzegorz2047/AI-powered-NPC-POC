import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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

function collectRenderedFloor(mapId: RooseveltMapId, map: TiledMap) {
  const floor = tileLayer(map, 'Floor');
  const visible = new Set<string>();

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (hasTile(floor, map.width, map.height, x, y)) visible.add(`${x}:${y}`);
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

  it.each(MAP_IDS)('%s never renders an internal wall across a walkable edge', (mapId) => {
    const map = readMap(mapId);
    const walkable = tileLayer(map, 'Walkable');
    const visible = collectRenderedFloor(mapId, map);
    const partitionAreaIds = new Set<string>(ROOSEVELT_PARTITION_AREA_IDS[mapId]);
    const isVisible = (x: number, y: number) => visible.has(`${x}:${y}`);
    const isWalkable = (x: number, y: number) => hasTile(walkable, map.width, map.height, x, y);

    for (const area of ROOSEVELT_VISUAL_AREAS[mapId]) {
      if (!partitionAreaIds.has(area.id)) continue;

      const topOpeningX = area.x + Math.floor(area.width / 2);
      for (let x = area.x; x < area.x + area.width; x += 1) {
        if (x === topOpeningX || !isVisible(x, area.y - 1)) continue;
        expect(
          isWalkable(x, area.y) && isWalkable(x, area.y - 1),
          `${mapId}/${area.id}: top wall crosses walkable edge at ${x}:${area.y}`,
        ).toBe(false);
      }

      const leftOpeningY = area.y + Math.floor(area.height / 2);
      for (let y = area.y; y < area.y + area.height; y += 1) {
        if (y === leftOpeningY || !isVisible(area.x - 1, y)) continue;
        expect(
          isWalkable(area.x, y) && isWalkable(area.x - 1, y),
          `${mapId}/${area.id}: left wall crosses walkable edge at ${area.x}:${y}`,
        ).toBe(false);
      }
    }
  });
});
