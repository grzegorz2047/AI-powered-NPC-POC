import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clues, witnesses } from '../data/caseData';
import { readEntityAnchors, requireEntityAnchor } from './mapEntities';
import { validateRequiredNavigation } from './mapNavigationValidation';

type TileLayer = { name?: string; type?: string; width?: number; height?: number; data?: number[] };
type ObjectLayer = { name?: string; type?: string; objects?: unknown[] };
type TiledMap = { width: number; height: number; layers: Array<TileLayer | ObjectLayer> };

function chunk<T>(values: T[], width: number): T[][] {
  return Array.from({ length: Math.ceil(values.length / width) }, (_, index) =>
    values.slice(index * width, (index + 1) * width),
  );
}

describe('checked-in hotel Tiled map contract', () => {
  it('keeps every required clue and witness reachable from detective spawn', () => {
    const url = new URL('../../public/maps/hotel-nocturne.json', import.meta.url);
    const map = JSON.parse(readFileSync(url, 'utf8')) as TiledMap;
    const walkable = map.layers.find((layer) => layer.type === 'tilelayer' && layer.name === 'Walkable') as TileLayer | undefined;
    const entities = map.layers.find((layer) => layer.type === 'objectgroup' && layer.name === 'Entities') as ObjectLayer | undefined;

    expect(walkable?.data, 'Walkable tile layer').toBeDefined();
    expect(entities?.objects, 'Entities object layer').toBeDefined();

    const grid = chunk(walkable!.data!, map.width).map((row) => row.map((gid) => (gid > 0 ? 1 : 0)));
    const anchors = readEntityAnchors(entities!.objects as Parameters<typeof readEntityAnchors>[0]);
    const player = requireEntityAnchor(anchors, 'player', 'detective');
    const targets = [
      ...clues.map((clue) => ({
        requirement: { kind: 'clue' as const, entityId: clue.id },
        anchor: requireEntityAnchor(anchors, 'clue', clue.id),
      })),
      ...witnesses.map((witness) => ({
        requirement: { kind: 'witness' as const, entityId: witness.id },
        anchor: requireEntityAnchor(anchors, 'witness', witness.id),
      })),
    ];

    expect(validateRequiredNavigation(grid, player, targets)).toEqual([]);
  });
});
