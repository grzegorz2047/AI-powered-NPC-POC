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

const TILE_HALF_WIDTH = 64;
const TILE_HALF_HEIGHT = 32;

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
