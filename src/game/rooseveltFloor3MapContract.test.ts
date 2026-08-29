import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readEntityAnchors, requireEntityAnchor } from './mapEntities';
import { validateRequiredNavigation } from './mapNavigationValidation';
import { readMapTransitions } from './mapTransitions';

type TileLayer = { name?: string; type?: string; data?: number[] };
type ObjectLayer = { name?: string; type?: string; objects?: unknown[] };
type MapProperty = { name?: string; value?: unknown };
type TiledMap = { width: number; height: number; layers: Array<TileLayer | ObjectLayer>; properties?: MapProperty[] };

function property(map: TiledMap, name: string) {
  return map.properties?.find((item) => item.name === name)?.value;
}

function chunk(values: number[], width: number): number[][] {
  return Array.from({ length: Math.ceil(values.length / width) }, (_, index) =>
    values.slice(index * width, (index + 1) * width),
  );
}

describe('Roosevelt third-floor Tiled contract', () => {
  const url = new URL('../../public/maps/roosevelt-floor-3.json', import.meta.url);
  const map = JSON.parse(readFileSync(url, 'utf8')) as TiledMap;

  it('records the real 1925 Roosevelt source instead of treating the skeleton as invented geometry', () => {
    expect(property(map, 'sourcePlan')).toBe('Roosevelt Hotel third floor plan (1925)');
    expect(property(map, 'sourceUrl')).toMatch(/Roosevelt_Hotel_third_floor_plan/);
    expect(property(map, 'license')).toMatch(/Public domain/i);
    expect(property(map, 'reconstruction')).toMatch(/topology-skeleton/i);
  });

  it('keeps every floor-3 clue, Irena and both elevator routes reachable', () => {
    const walkable = map.layers.find((layer) => layer.type === 'tilelayer' && layer.name === 'Walkable') as TileLayer;
    const entities = map.layers.find((layer) => layer.type === 'objectgroup' && layer.name === 'Entities') as ObjectLayer;
    const transitions = map.layers.find((layer) => layer.type === 'objectgroup' && layer.name === 'Transitions') as ObjectLayer;
    const grid = chunk(walkable.data!, map.width).map((row) => row.map((gid) => (gid > 0 ? 1 : 0)));
    const anchors = readEntityAnchors(entities.objects as Parameters<typeof readEntityAnchors>[0]);
    const player = requireEntityAnchor(anchors, 'player', 'detective');

    const localTargets = [
      ['clue', 'whisky-glass'],
      ['clue', 'keycard-log'],
      ['clue', 'cctv-note'],
      ['clue', 'green-fiber'],
      ['clue', 'cctv-still'],
      ['witness', 'irena'],
    ] as const;

    expect(validateRequiredNavigation(grid, player, localTargets.map(([kind, entityId]) => ({
      requirement: { kind, entityId },
      anchor: requireEntityAnchor(anchors, kind, entityId),
    })))).toEqual([]);

    const parsedTransitions = readMapTransitions(transitions.objects as Parameters<typeof readMapTransitions>[0]);
    expect(parsedTransitions.map((item) => item.targetMap).sort()).toEqual(['roosevelt-basement', 'roosevelt-lobby']);
    for (const transition of parsedTransitions) {
      expect(grid[transition.tileY]?.[transition.tileX], `${transition.id} walkable`).toBe(1);
    }
  });

  it('contains explicit Room 307, elevator-lobby and service-hall zone metadata', () => {
    const zones = map.layers.find((layer) => layer.type === 'objectgroup' && layer.name === 'Zones') as ObjectLayer;
    const serialized = JSON.stringify(zones.objects);
    expect(serialized).toContain('room-307');
    expect(serialized).toContain('ROOM 307');
    expect(serialized).toContain('elevator-lobby');
    expect(serialized).toContain('service-hall');
  });
});
