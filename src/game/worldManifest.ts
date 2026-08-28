export const WORLD_MAPS = {
  'roosevelt-lobby': {
    id: 'roosevelt-lobby',
    title: 'Lobby / First Floor',
    mapUrl: '/maps/roosevelt-lobby.json',
    source: 'Roosevelt Hotel first floor plan (1925)',
  },
  'roosevelt-floor-3': {
    id: 'roosevelt-floor-3',
    title: 'Third Floor / Room 307',
    mapUrl: '/maps/roosevelt-floor-3.json',
    source: 'Roosevelt Hotel third floor plan (1925)',
  },
  'roosevelt-basement': {
    id: 'roosevelt-basement',
    title: 'Basement / Service',
    mapUrl: '/maps/roosevelt-basement.json',
    source: 'Roosevelt Hotel first basement floor plan (1925)',
  },
} as const;

export type WorldMapId = keyof typeof WORLD_MAPS;

export function isWorldMapId(value: unknown): value is WorldMapId {
  return typeof value === 'string' && value in WORLD_MAPS;
}
