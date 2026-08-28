export const ROOSEVELT_VISUAL_TARGET = {
  source: 'generated mockup-guided noir isometric asset pass',
  principles: [
    'world should fill most of the investigation viewport at initial load',
    'visible room floor is broader than the navigation-only Walkable mask',
    'walls should read as full-height cutaway architecture rather than low borders',
    'internal room partitions should remain legible without turning the map into a closed maze',
    'Room 307, elevators, reception, CCTV and laundry should be visually recognizable without labels',
    'characters and props must stay legible at the default camera zoom',
    'camera supports free pan/zoom and F to follow the detective',
  ],
  initialZoom: 0.86,
  cameraPadding: { x: 150, y: 120 },
  cameraBiasByMap: {
    'roosevelt-lobby': { x: 0, y: 8 },
    'roosevelt-floor-3': { x: 0, y: 46 },
    'roosevelt-basement': { x: 0, y: 22 },
  },
  wallDisplay: { width: 128, height: 176 },
  internalWallDisplay: { width: 128, height: 154 },
} as const;

export type RooseveltVisualArea = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// These footprints are rendering-only reconstructions of rooms/public spaces visible
// around the navigation corridors. They deliberately do not change Walkable/pathfinding.
export const ROOSEVELT_VISUAL_AREAS = {
  'roosevelt-lobby': [
    { id: 'lounge-wing', x: 1, y: 9, width: 7, height: 7 },
    { id: 'main-office', x: 4, y: 9, width: 5, height: 5 },
    { id: 'main-lobby', x: 6, y: 9, width: 9, height: 8 },
    { id: 'palm-room', x: 13, y: 9, width: 6, height: 7 },
    { id: 'main-kitchen', x: 7, y: 4, width: 6, height: 6 },
    { id: 'main-dining', x: 12, y: 4, width: 7, height: 6 },
  ],
  'roosevelt-floor-3': [
    { id: 'west-guest-rooms', x: 1, y: 2, width: 7, height: 6 },
    { id: 'central-service-core', x: 6, y: 6, width: 7, height: 6 },
    { id: 'east-guest-rooms', x: 12, y: 2, width: 7, height: 6 },
    { id: 'west-lower-rooms', x: 1, y: 11, width: 7, height: 6 },
    { id: 'room-307-suite', x: 13, y: 11, width: 6, height: 7 },
  ],
  'roosevelt-basement': [
    { id: 'service-west', x: 2, y: 2, width: 8, height: 8 },
    { id: 'incinerator', x: 5, y: 4, width: 5, height: 4 },
    { id: 'fan-room', x: 9, y: 3, width: 6, height: 5 },
    { id: 'utility-core', x: 12, y: 2, width: 7, height: 5 },
    { id: 'laundry', x: 13, y: 6, width: 9, height: 6 },
  ],
} as const satisfies Record<string, readonly RooseveltVisualArea[]>;

export const ROOSEVELT_PARTITION_AREA_IDS = {
  'roosevelt-lobby': ['lounge-wing', 'main-office', 'main-kitchen', 'main-dining'],
  'roosevelt-floor-3': ['west-guest-rooms', 'central-service-core', 'east-guest-rooms', 'west-lower-rooms', 'room-307-suite'],
  'roosevelt-basement': ['service-west', 'incinerator', 'fan-room', 'utility-core', 'laundry'],
} as const satisfies Record<string, readonly string[]>;
