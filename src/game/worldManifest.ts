export const WORLD_MAPS = {
  'prototype-room-307': {
    id: 'prototype-room-307',
    title: 'Prototype / Room 307',
    mapUrl: '/maps/hotel-nocturne.json',
    source: 'Temporary synthetic vertical-slice map',
    production: false,
  },
  'roosevelt-lobby': {
    id: 'roosevelt-lobby',
    title: 'Lobby / First Floor',
    mapUrl: '/maps/roosevelt-lobby.json',
    source: 'Roosevelt Hotel first floor plan (1925)',
    production: true,
  },
  'roosevelt-floor-3': {
    id: 'roosevelt-floor-3',
    title: 'Third Floor / Room 307',
    mapUrl: '/maps/roosevelt-floor-3.json',
    source: 'Roosevelt Hotel third floor plan (1925)',
    production: true,
  },
  'roosevelt-basement': {
    id: 'roosevelt-basement',
    title: 'Basement / Service',
    mapUrl: '/maps/roosevelt-basement.json',
    source: 'Roosevelt Hotel first/lower basement plans (1925)',
    production: true,
  },
} as const;

export type WorldMapId = keyof typeof WORLD_MAPS;
export const DEFAULT_WORLD_MAP: WorldMapId = 'prototype-room-307';

export function isWorldMapId(value: unknown): value is WorldMapId {
  return typeof value === 'string' && value in WORLD_MAPS;
}
