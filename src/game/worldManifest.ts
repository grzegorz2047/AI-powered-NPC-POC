export const WORLD_MAPS = {
  'prototype-room-307': {
    id: 'prototype-room-307',
    title: 'Prototype / Room 307',
    mapUrl: '/maps/hotel-nocturne.json',
    source: 'Temporary synthetic vertical-slice map',
    production: false,
    clueIds: ['whisky-glass', 'keycard-log', 'cctv-note', 'green-fiber', 'burnt-ledger', 'brass-heron', 'cctv-still'],
    witnessIds: ['kamil', 'nina', 'irena', 'marek'],
    navigation: [],
  },
  'roosevelt-lobby': {
    id: 'roosevelt-lobby',
    title: 'Lobby / First Floor',
    mapUrl: '/maps/roosevelt-lobby.json',
    source: 'Roosevelt Hotel first floor plan (1925)',
    production: true,
    clueIds: [],
    witnessIds: ['kamil', 'nina', 'marek'],
    navigation: [
      { label: 'Elevator to third floor / Room 307', targetMap: 'roosevelt-floor-3', targetSpawn: 'elevator-from-lobby' },
      { label: 'Service elevator to basement', targetMap: 'roosevelt-basement', targetSpawn: 'service-elevator-from-lobby' },
    ],
  },
  'roosevelt-floor-3': {
    id: 'roosevelt-floor-3',
    title: 'Third Floor / Room 307',
    mapUrl: '/maps/roosevelt-floor-3-visual.json',
    source: 'Roosevelt Hotel third floor plan (1925), visual orientation derived deterministically from canonical topology',
    production: true,
    clueIds: ['whisky-glass', 'keycard-log', 'cctv-note', 'green-fiber', 'cctv-still'],
    witnessIds: ['irena'],
    navigation: [
      { label: 'Elevator to lobby', targetMap: 'roosevelt-lobby', targetSpawn: 'elevator-from-floor-3' },
      { label: 'Service elevator to basement', targetMap: 'roosevelt-basement', targetSpawn: 'service-elevator-from-floor-3' },
    ],
  },
  'roosevelt-basement': {
    id: 'roosevelt-basement',
    title: 'Basement / Service',
    mapUrl: '/maps/roosevelt-basement.json',
    source: 'Roosevelt Hotel first/lower basement plans (1925)',
    production: true,
    clueIds: ['burnt-ledger', 'brass-heron'],
    witnessIds: [],
    navigation: [
      { label: 'Service elevator to third floor', targetMap: 'roosevelt-floor-3', targetSpawn: 'service-elevator-from-basement' },
      { label: 'Service elevator to lobby', targetMap: 'roosevelt-lobby', targetSpawn: 'service-elevator-from-basement' },
    ],
  },
} as const;

export type WorldMapId = keyof typeof WORLD_MAPS;
export const DEFAULT_WORLD_MAP: WorldMapId = 'roosevelt-lobby';

export function isWorldMapId(value: unknown): value is WorldMapId {
  return typeof value === 'string' && value in WORLD_MAPS;
}
