import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clues, witnesses } from '../data/caseData';
import { readEntityAnchors, type MapEntityAnchor } from './mapEntities';
import { readMapTransitions } from './mapTransitions';
import { createWalkabilityMatrix, findTilePath } from './tilePathfinding';
import { WORLD_MAPS, type WorldMapId } from './worldManifest';

type TileLayer = { name?: string; type?: string; data?: number[] };
type ObjectLayer = { name?: string; type?: string; objects?: unknown[] };
type TiledMap = { width: number; height: number; layers: Array<TileLayer | ObjectLayer> };

type ParsedWorldMap = {
  id: WorldMapId;
  grid: number[][];
  anchors: Map<string, MapEntityAnchor>;
  transitions: ReturnType<typeof readMapTransitions>;
};

const productionMapIds = (Object.keys(WORLD_MAPS) as WorldMapId[]).filter((id) => WORLD_MAPS[id].production);

function readProductionMap(id: WorldMapId): ParsedWorldMap {
  const url = new URL(`../../public${WORLD_MAPS[id].mapUrl}`, import.meta.url);
  const map = JSON.parse(readFileSync(url, 'utf8')) as TiledMap;
  const walkable = map.layers.find((layer) => layer.type === 'tilelayer' && layer.name === 'Walkable') as TileLayer | undefined;
  const entities = map.layers.find((layer) => layer.type === 'objectgroup' && layer.name === 'Entities') as ObjectLayer | undefined;
  const transitions = map.layers.find((layer) => layer.type === 'objectgroup' && layer.name === 'Transitions') as ObjectLayer | undefined;

  expect(walkable?.data, `${id} Walkable layer`).toBeDefined();
  expect(entities?.objects, `${id} Entities layer`).toBeDefined();
  expect(transitions?.objects, `${id} Transitions layer`).toBeDefined();

  const values = walkable!.data!;
  const grid = createWalkabilityMatrix(map.width, map.height, (x, y) => values[y * map.width + x] > 0);
  return {
    id,
    grid,
    anchors: readEntityAnchors(entities!.objects as Parameters<typeof readEntityAnchors>[0]),
    transitions: readMapTransitions(transitions!.objects as Parameters<typeof readMapTransitions>[0]),
  };
}

function pathExists(grid: number[][], from: MapEntityAnchor, x: number, y: number) {
  if (from.tileX === x && from.tileY === y) return true;
  return findTilePath(grid, { x: from.tileX, y: from.tileY }, { x, y }).length > 0;
}

describe('Roosevelt multi-map world contract', () => {
  const maps = productionMapIds.map(readProductionMap);

  it('has all three production maps checked into public/maps', () => {
    expect(productionMapIds.sort()).toEqual(['roosevelt-basement', 'roosevelt-floor-3', 'roosevelt-lobby']);
    expect(maps).toHaveLength(3);
  });

  it('keeps semantic map membership in worldManifest aligned with Tiled entity anchors', () => {
    for (const map of maps) {
      const actualClues = [...map.anchors.values()].filter((anchor) => anchor.kind === 'clue').map((anchor) => anchor.entityId).sort();
      const actualWitnesses = [...map.anchors.values()].filter((anchor) => anchor.kind === 'witness').map((anchor) => anchor.entityId).sort();
      expect(actualClues, `${map.id} clueIds`).toEqual([...(WORLD_MAPS[map.id].clueIds as readonly string[])].sort());
      expect(actualWitnesses, `${map.id} witnessIds`).toEqual([...(WORLD_MAPS[map.id].witnessIds as readonly string[])].sort());
    }
  });

  it('keeps keyboard navigation in worldManifest aligned with Tiled transition targets', () => {
    for (const map of maps) {
      const tiledTargets = map.transitions
        .map((transition) => `${transition.targetMap}:${transition.targetSpawn}`)
        .sort();
      const accessibleTargets = WORLD_MAPS[map.id].navigation
        .map((transition) => `${transition.targetMap}:${transition.targetSpawn}`)
        .sort();
      expect(accessibleTargets, `${map.id} accessible navigation`).toEqual(tiledTargets);
    }
  });

  it('places every canonical clue and witness exactly once across the real-hotel world', () => {
    const clueCounts = new Map(clues.map((clue) => [clue.id, 0]));
    const witnessCounts = new Map(witnesses.map((witness) => [witness.id, 0]));

    for (const map of maps) {
      for (const anchor of map.anchors.values()) {
        if (anchor.kind === 'clue') {
          expect(clueCounts.has(anchor.entityId), `unknown clue ${anchor.entityId} in ${map.id}`).toBe(true);
          clueCounts.set(anchor.entityId, (clueCounts.get(anchor.entityId) ?? 0) + 1);
        }
        if (anchor.kind === 'witness') {
          expect(witnessCounts.has(anchor.entityId), `unknown witness ${anchor.entityId} in ${map.id}`).toBe(true);
          witnessCounts.set(anchor.entityId, (witnessCounts.get(anchor.entityId) ?? 0) + 1);
        }
      }
    }

    expect(Object.fromEntries(clueCounts)).toEqual(Object.fromEntries(clues.map((clue) => [clue.id, 1])));
    expect(Object.fromEntries(witnessCounts)).toEqual(Object.fromEntries(witnesses.map((witness) => [witness.id, 1])));
  });

  it('makes every transition target an existing player spawn on the target map', () => {
    const byId = new Map(maps.map((map) => [map.id, map]));
    for (const map of maps) {
      for (const transition of map.transitions) {
        const target = byId.get(transition.targetMap);
        expect(target, `${map.id}:${transition.id} target map`).toBeDefined();
        expect(
          target!.anchors.has(`player:${transition.targetSpawn}`),
          `${map.id}:${transition.id} -> ${transition.targetMap}:${transition.targetSpawn}`,
        ).toBe(true);
      }
    }
  });

  it('keeps every local clue, witness and exit reachable from every spawn on that map', () => {
    for (const map of maps) {
      const spawns = [...map.anchors.values()].filter((anchor) => anchor.kind === 'player');
      const interactions = [...map.anchors.values()].filter((anchor) => anchor.kind === 'clue' || anchor.kind === 'witness');
      expect(spawns.length, `${map.id} player spawns`).toBeGreaterThan(0);

      for (const spawn of spawns) {
        for (const target of interactions) {
          expect(
            pathExists(map.grid, spawn, target.tileX, target.tileY),
            `${map.id}:${spawn.entityId} -> ${target.kind}:${target.entityId}`,
          ).toBe(true);
        }
        for (const transition of map.transitions) {
          expect(
            pathExists(map.grid, spawn, transition.tileX, transition.tileY),
            `${map.id}:${spawn.entityId} -> transition:${transition.id}`,
          ).toBe(true);
        }
      }
    }
  });
});
