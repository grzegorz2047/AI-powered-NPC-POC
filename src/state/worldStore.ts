import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WORLD_MAP, type WorldMapId } from '../game/worldManifest';

type WorldState = {
  currentMapId: WorldMapId;
  spawnId: string;
  navigate: (mapId: WorldMapId, spawnId: string) => void;
  resetWorld: () => void;
};

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
    },
  ),
);
