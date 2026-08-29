import Phaser from 'phaser';

export type IsoWallSide = 'nw' | 'ne';
export type IsoPoint = { x: number; y: number };

export type IsometricWallGeometry = {
  side: IsoWallSide;
  height: number;
  baseStart: IsoPoint;
  baseEnd: IsoPoint;
  topStart: IsoPoint;
  topEnd: IsoPoint;
  polygon: readonly IsoPoint[];
};

type ArchitectureVariant = 'roosevelt-lobby' | 'roosevelt-floor-3' | 'roosevelt-basement';

type DrawWallOptions = {
  x: number;
  y: number;
  side: IsoWallSide;
  height: number;
  depth: number;
  variant: ArchitectureVariant;
  sconce?: boolean;
  internal?: boolean;
};

type DrawDoorOptions = DrawWallOptions & {
  label: string;
};

const TILE_HALF_WIDTH = 64;
const TILE_HALF_HEIGHT = 32;

const PALETTES = {
  'roosevelt-lobby': {
    upperNW: 0x20293a,
    upperNE: 0x273248,
    woodNW: 0x241813,
    woodNE: 0x2d1e17,
    brass: 0xb4944e,
    brassDim: 0x806936,
    crown: 0xc5ab68,
  },
  'roosevelt-floor-3': {
    upperNW: 0x20283a,
    upperNE: 0x29344b,
    woodNW: 0x241715,
    woodNE: 0x2d1d19,
    brass: 0xb79654,
    brassDim: 0x80693d,
    crown: 0xc9ae70,
  },
  'roosevelt-basement': {
    upperNW: 0x1d2728,
    upperNE: 0x273234,
    woodNW: 0x191816,
    woodNE: 0x22201c,
    brass: 0x927b48,
    brassDim: 0x655631,
    crown: 0xa8935d,
  },
} as const;

function interpolate(a: IsoPoint, b: IsoPoint, t: number): IsoPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function shifted(point: IsoPoint, dy: number): IsoPoint {
  return { x: point.x, y: point.y + dy };
}

function path(graphics: Phaser.GameObjects.Graphics, points: readonly IsoPoint[], fill: number, alpha = 1) {
  graphics.fillStyle(fill, alpha);
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) graphics.lineTo(points[index].x, points[index].y);
  graphics.closePath();
  graphics.fillPath();
}

function strokePath(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly IsoPoint[],
  color: number,
  alpha: number,
  width: number,
) {
  graphics.lineStyle(width, color, alpha);
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) graphics.lineTo(points[index].x, points[index].y);
  graphics.strokePath();
}

export function isometricWallGeometry(x: number, y: number, side: IsoWallSide, height: number): IsometricWallGeometry {
  const baseStart = { x, y };
  const baseEnd = side === 'nw'
    ? { x: x - TILE_HALF_WIDTH, y: y + TILE_HALF_HEIGHT }
    : { x: x + TILE_HALF_WIDTH, y: y + TILE_HALF_HEIGHT };
  const topStart = { x: baseStart.x, y: baseStart.y - height };
  const topEnd = { x: baseEnd.x, y: baseEnd.y - height };
  return {
    side,
    height,
    baseStart,
    baseEnd,
    topStart,
    topEnd,
    polygon: [topStart, topEnd, baseEnd, baseStart],
  };
}

export function isPerspectiveCorrectWall(geometry: IsometricWallGeometry) {
  const baseDx = geometry.baseEnd.x - geometry.baseStart.x;
  const baseDy = geometry.baseEnd.y - geometry.baseStart.y;
  const verticalStart = geometry.topStart.x === geometry.baseStart.x;
  const verticalEnd = geometry.topEnd.x === geometry.baseEnd.x;
  const expectedDx = geometry.side === 'nw' ? -TILE_HALF_WIDTH : TILE_HALF_WIDTH;
  return verticalStart
    && verticalEnd
    && baseDx === expectedDx
    && baseDy === TILE_HALF_HEIGHT
    && geometry.topStart.y === geometry.baseStart.y - geometry.height
    && geometry.topEnd.y === geometry.baseEnd.y - geometry.height;
}

export function drawIsometricWall(scene: Phaser.Scene, options: DrawWallOptions) {
  const palette = PALETTES[options.variant];
  const geometry = isometricWallGeometry(options.x, options.y, options.side, options.height);
  const graphics = scene.add.graphics().setDepth(options.depth).setName(`iso-wall-${options.side}`);
  const upperColor = options.side === 'nw' ? palette.upperNW : palette.upperNE;
  const woodColor = options.side === 'nw' ? palette.woodNW : palette.woodNE;
  const wainscotHeight = Math.min(options.internal ? 56 : 64, options.height * 0.4);

  path(graphics, geometry.polygon.map((point) => ({ x: point.x + 5, y: point.y + 7 })), 0x000000, 0.34);
  path(graphics, geometry.polygon, upperColor, options.internal ? 0.97 : 1);

  const wainscotTopStart = shifted(geometry.baseStart, -wainscotHeight);
  const wainscotTopEnd = shifted(geometry.baseEnd, -wainscotHeight);
  path(graphics, [wainscotTopStart, wainscotTopEnd, geometry.baseEnd, geometry.baseStart], woodColor, 1);

  const panelTopStart = shifted(interpolate(geometry.baseStart, geometry.baseEnd, 0.13), -options.height + 28);
  const panelTopEnd = shifted(interpolate(geometry.baseStart, geometry.baseEnd, 0.87), -options.height + 28);
  const panelBottomStart = shifted(interpolate(geometry.baseStart, geometry.baseEnd, 0.13), -wainscotHeight - 18);
  const panelBottomEnd = shifted(interpolate(geometry.baseStart, geometry.baseEnd, 0.87), -wainscotHeight - 18);
  strokePath(graphics, [panelTopStart, panelTopEnd, panelBottomEnd, panelBottomStart, panelTopStart], palette.brassDim, 0.42, 1.2);

  strokePath(graphics, [wainscotTopStart, wainscotTopEnd], palette.brass, 0.88, 4);
  strokePath(graphics, [geometry.topStart, geometry.topEnd], palette.crown, 0.75, 4);
  strokePath(graphics, [geometry.baseStart, geometry.baseEnd], 0x0c0b0a, 0.8, 3);
  strokePath(graphics, [geometry.topEnd, geometry.baseEnd], palette.brassDim, 0.3, 1);

  let glow: Phaser.GameObjects.Ellipse | undefined;
  if (options.sconce) {
    const middle = interpolate(geometry.baseStart, geometry.baseEnd, 0.52);
    const sconceY = middle.y - options.height * 0.62;
    glow = scene.add.ellipse(middle.x, sconceY, 96, 78, 0xf2b85d, 0.085)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(options.depth + 0.01)
      .setName('wall-sconce-glow');
    graphics.fillStyle(0xc2a05d, 1);
    graphics.fillRect(middle.x - 2.5, sconceY - 5, 5, 14);
    graphics.fillStyle(0xf5d48b, 1);
    graphics.fillCircle(middle.x, sconceY - 8, 5.5);
    graphics.lineStyle(1.5, 0xf7dc9a, 0.72);
    graphics.strokeCircle(middle.x, sconceY - 8, 8);
  }

  return { geometry, graphics, glow };
}

export function drawIsometricDoor(scene: Phaser.Scene, options: DrawDoorOptions) {
  const palette = PALETTES[options.variant];
  const wall = drawIsometricWall(scene, { ...options, sconce: false });
  const { geometry } = wall;
  const baseLeft = interpolate(geometry.baseStart, geometry.baseEnd, 0.16);
  const baseRight = interpolate(geometry.baseStart, geometry.baseEnd, 0.84);
  const doorHeight = Math.min(options.height - 25, 126);
  const topLeft = shifted(baseLeft, -doorHeight);
  const topRight = shifted(baseRight, -doorHeight);
  const door = scene.add.graphics().setDepth(options.depth + 0.03).setName('iso-door-module');

  path(door, [topLeft, topRight, baseRight, baseLeft], options.side === 'nw' ? 0x19100e : 0x211512, 1);
  strokePath(door, [topLeft, topRight, baseRight, baseLeft, topLeft], palette.brass, 0.92, 3.5);

  const insetLeft = interpolate(baseLeft, baseRight, 0.13);
  const insetRight = interpolate(baseLeft, baseRight, 0.87);
  const insetTopLeft = shifted(insetLeft, -doorHeight + 18);
  const insetTopRight = shifted(insetRight, -doorHeight + 18);
  const insetBottomLeft = shifted(insetLeft, -20);
  const insetBottomRight = shifted(insetRight, -20);
  strokePath(door, [insetTopLeft, insetTopRight, insetBottomRight, insetBottomLeft, insetTopLeft], palette.brassDim, 0.7, 1.3);

  const plaquePoint = shifted(interpolate(baseLeft, baseRight, 0.5), -doorHeight * 0.62);
  const plaque = scene.add.rectangle(plaquePoint.x, plaquePoint.y, 34, 22, 0x211914, 0.96)
    .setStrokeStyle(2, palette.brass, 0.95)
    .setDepth(options.depth + 0.04)
    .setName('iso-door-plaque');
  const label = scene.add.text(plaquePoint.x, plaquePoint.y, options.label, {
    fontFamily: 'Georgia, serif',
    fontSize: '12px',
    fontStyle: 'bold',
    color: '#e6c77b',
  }).setOrigin(0.5).setDepth(options.depth + 0.05).setName('iso-door-label');

  const lampPoint = shifted(interpolate(geometry.baseStart, geometry.baseEnd, 0.92), -options.height * 0.62);
  const glow = scene.add.ellipse(lampPoint.x, lampPoint.y, 76, 64, 0xf2b85d, 0.1)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(options.depth + 0.01)
    .setName('wall-sconce-glow');
  door.fillStyle(0xf1cf83, 1);
  door.fillCircle(lampPoint.x, lampPoint.y, 5);

  return { ...wall, door, plaque, label, doorGlow: glow };
}
