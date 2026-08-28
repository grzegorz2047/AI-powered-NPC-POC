export const ROOSEVELT_VISUAL_TARGET = {
  source: 'generated mockup-guided noir isometric asset pass',
  principles: [
    'world should fill most of the investigation viewport at initial load',
    'walls should read as full-height cutaway architecture rather than low borders',
    'Room 307, elevators, reception, CCTV and laundry should be visually recognizable without labels',
    'characters and props must stay legible at the default camera zoom',
    'camera supports free pan/zoom and F to follow the detective',
  ],
  initialZoom: 0.86,
  cameraPadding: { x: 150, y: 120 },
  wallDisplay: { width: 128, height: 176 },
} as const;
