import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WORLD_MAP, isWorldMapId, type WorldMapId } from '../game/worldManifest';

type WorldState = {
  currentMapId: WorldMapId;
  spawnId: string;
  navigate: (mapId: WorldMapId, spawnId: string) => void;
  resetWorld: () => void;
};

export type PersistedWorldLocation = {
  currentMapId?: unknown;
  spawnId?: unknown;
};

export function resolvePersistedWorldLocation(value: unknown): Pick<WorldState, 'currentMapId' | 'spawnId'> {
  const persisted = value && typeof value === 'object' ? value as PersistedWorldLocation : {};
  const currentMapId = isWorldMapId(persisted.currentMapId) && persisted.currentMapId !== 'prototype-room-307'
    ? persisted.currentMapId
    : DEFAULT_WORLD_MAP;
  const spawnId = currentMapId === DEFAULT_WORLD_MAP && persisted.currentMapId === 'prototype-room-307'
    ? 'detective'
    : typeof persisted.spawnId === 'string' && persisted.spawnId.length > 0
      ? persisted.spawnId
      : 'detective';

  return { currentMapId, spawnId };
}

export const useWorldStore = create<WorldState>()(
  persist(
    (set) => ({
      currentMapId: DEFAULT_WORLD_MAP,
      spawnId: 'detective',
      navigate: (currentMapId, spawnId) => set({ currentMapId, spawnId }),
      resetWorld: () => set({ currentMapId: DEFAULT_WORLD_MAP, spawnId: 'detective' }),
    }),
    {
      name: 'hotel-nocturne-world-location',
      partialize: (state) => ({ currentMapId: state.currentMapId, spawnId: state.spawnId }),
      merge: (persisted, current) => ({ ...current, ...resolvePersistedWorldLocation(persisted) }),
    },
  ),
);
