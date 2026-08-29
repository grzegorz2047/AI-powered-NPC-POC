import fs from 'node:fs';

const path = 'src/game/RooseveltScene.ts';
let source = fs.readFileSync(path, 'utf8');

function replaceOnce(search, replacement, label) {
  if (typeof search === 'string') {
    const count = source.split(search).length - 1;
    if (count !== 1) throw new Error(`${label}: expected exactly one match, got ${count}`);
    source = source.replace(search, replacement);
    return;
  }
  const matches = source.match(search);
  if (!matches || matches.length !== 1) throw new Error(`${label}: expected exactly one regex match`);
  source = source.replace(search, replacement);
}

replaceOnce(
  "import { readEntityAnchors, requireEntityAnchor } from './mapEntities';",
  "import { drawIsometricDoor, drawIsometricWall, type IsoWallSide } from './isometricArchitecture';\nimport { readEntityAnchors, requireEntityAnchor } from './mapEntities';",
  'isometric architecture import',
);
replaceOnce(
  "import { WORLD_MAPS, type WorldMapId } from './worldManifest';",
  "import { installVisualAuditBridge, type WallAuditSegment } from './visualAudit';\nimport { WORLD_MAPS, type WorldMapId } from './worldManifest';",
  'visual audit import',
);
replaceOnce("  ROOSEVELT_WALL_TEXTURES_BY_MAP,\n", '', 'remove pasted wall texture import');
replaceOnce("type WallTextures = { nw: string; ne: string };\n", '', 'remove wall texture type');
replaceOnce(
  "  private walkabilityGrid: number[][] = [];\n",
  "  private walkabilityGrid: number[][] = [];\n  private wallAuditSegments: WallAuditSegment[] = [];\n",
  'wall audit field',
);
replaceOnce(
  "    this.addArchitecture(visibleFloorTiles, map.getObjectLayer('Zones')?.objects);\n",
  "    this.wallAuditSegments = [];\n    this.addArchitecture(visibleFloorTiles, map.getObjectLayer('Zones')?.objects);\n    installVisualAuditBridge(\n      this,\n      this.worldMapId,\n      this.wallAuditSegments,\n      ROOSEVELT_VISUAL_TARGET.minimumWallHeight,\n      this.walkabilityGrid,\n    );\n",
  'install visual audit bridge',
);
replaceOnce(
  "      bounds.minY = Math.min(bounds.minY, point.y - 130);",
  "      bounds.minY = Math.min(bounds.minY, point.y - ROOSEVELT_VISUAL_TARGET.wallHeight - 58);",
  'world bounds wall height',
);
replaceOnce(
  /  private addInternalPartitions\(wallTextures: WallTextures, isVisible: \(x: number, y: number\) => boolean\) \{[\s\S]*?\n  private addAmbientProps\(\) \{/,
  `  private addWallSegment(tileX: number, tileY: number, side: IsoWallSide, internal = false) {\n    const point = this.tileToWorld(tileX, tileY);\n    const height = internal ? ROOSEVELT_VISUAL_TARGET.internalWallHeight : ROOSEVELT_VISUAL_TARGET.wallHeight;\n    const sideBias = side === 'nw' ? 0 : 1;\n    const cadence = internal ? ROOSEVELT_VISUAL_TARGET.sconceCadence + 1 : ROOSEVELT_VISUAL_TARGET.sconceCadence;\n    const sconce = (tileX + tileY + sideBias) % cadence === 0;\n    const wall = drawIsometricWall(this, {\n      x: point.x,\n      y: point.y,\n      side,\n      height,\n      depth: point.y + 25 + (side === 'ne' ? 0.1 : 0),\n      variant: this.worldMapId,\n      sconce,\n      internal,\n    });\n    this.wallAuditSegments.push({ tileX, tileY, internal, sconce, geometry: wall.geometry });\n  }\n\n  private addInternalPartitions(isVisible: (x: number, y: number) => boolean) {\n    const partitionAreaIds = new Set<string>(ROOSEVELT_PARTITION_AREA_IDS[this.worldMapId]);\n\n    for (const area of ROOSEVELT_VISUAL_AREAS[this.worldMapId]) {\n      if (!partitionAreaIds.has(area.id)) continue;\n\n      const topOpeningX = area.x + Math.floor(area.width / 2);\n      for (let x = area.x; x < area.x + area.width; x += 1) {\n        if (x === topOpeningX || !isVisible(x, area.y - 1)) continue;\n        if (!shouldRenderWallBetween(this.walkabilityGrid, x, area.y, x, area.y - 1)) continue;\n        this.addWallSegment(x, area.y, 'ne', true);\n      }\n\n      const leftOpeningY = area.y + Math.floor(area.height / 2);\n      for (let y = area.y; y < area.y + area.height; y += 1) {\n        if (y === leftOpeningY || !isVisible(area.x - 1, y)) continue;\n        if (!shouldRenderWallBetween(this.walkabilityGrid, area.x, y, area.x - 1, y)) continue;\n        this.addWallSegment(area.x, y, 'nw', true);\n      }\n    }\n  }\n\n  private addAmbientProps() {`,
  'replace stretched internal wall images',
);
replaceOnce(
  /  private addArchitecture\(visibleFloorTiles: Set<string>, objects: Parameters<typeof readMapZones>\[0\]\) \{[\s\S]*?\n    this\.addInternalPartitions\(wallTextures, isVisible\);/,
  `  private addArchitecture(visibleFloorTiles: Set<string>, objects: Parameters<typeof readMapZones>[0]) {\n    const isVisible = (x: number, y: number) => visibleFloorTiles.has(\`\${x}:\${y}\`);\n\n    for (const tileKey of visibleFloorTiles) {\n      const [x, y] = tileKey.split(':').map(Number);\n      if (!isVisible(x - 1, y)) this.addWallSegment(x, y, 'nw');\n      if (!isVisible(x, y - 1)) this.addWallSegment(x, y, 'ne');\n    }\n\n    this.addInternalPartitions(isVisible);`,
  'replace stretched exterior wall images',
);
replaceOnce(
  "      if (zone.id === 'room-307') {\n        this.propArt('runtime-room307', point.x + 46, point.y + 54, 102, 184, point.y + 120);\n      }",
  "      if (zone.id === 'room-307') {\n        drawIsometricDoor(this, {\n          x: point.x,\n          y: point.y,\n          side: 'ne',\n          height: ROOSEVELT_VISUAL_TARGET.wallHeight,\n          depth: point.y + 25.3,\n          variant: this.worldMapId,\n          label: '307',\n        });\n      }",
  'integrate Room 307 door into wall plane',
);
replaceOnce(
  "    camera.setZoom(ROOSEVELT_VISUAL_TARGET.initialZoom);",
  "    camera.setZoom(ROOSEVELT_VISUAL_TARGET.zoomByMap[this.worldMapId] ?? ROOSEVELT_VISUAL_TARGET.initialZoom);",
  'map-specific camera zoom',
);
replaceOnce(
  "    const body = this.add.image(0, 0, ROOSEVELT_PLAYER_TEXTURE).setOrigin(0.5, 1).setDisplaySize(86, 130);",
  "    const body = this.add.image(0, 0, ROOSEVELT_PLAYER_TEXTURE).setOrigin(0.5, 1).setDisplaySize(\n      ROOSEVELT_VISUAL_TARGET.characterDisplay.playerWidth,\n      ROOSEVELT_VISUAL_TARGET.characterDisplay.playerHeight,\n    );",
  'player scale',
);
replaceOnce(
  "      .setDisplaySize(82, 130)\n",
  "      .setDisplaySize(ROOSEVELT_VISUAL_TARGET.characterDisplay.witnessWidth, ROOSEVELT_VISUAL_TARGET.characterDisplay.witnessHeight)\n",
  'witness scale',
);
replaceOnce(
  "    const elevator = this.propArt('runtime-elevator', point.x, point.y + 54, 124, 240, point.y + 104, 0.98);",
  "    this.add.ellipse(point.x, point.y - 34, 170, 186, 0xd29b45, 0.055)\n      .setBlendMode(Phaser.BlendModes.ADD)\n      .setDepth(point.y + 102);\n    const elevator = this.propArt('runtime-elevator', point.x, point.y + 58, 142, 264, point.y + 104, 0.98);",
  'elevator architectural presence',
);

fs.writeFileSync(path, source);
console.log('Applied full isometric game visual pass to RooseveltScene.ts');
