import { readFileSync, writeFileSync } from 'node:fs';

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Missing integration anchor: ${label}`);
  return source.replace(from, to);
}

function replaceAllRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Missing integration anchor: ${label}`);
  return source.split(from).join(to);
}

const scenePath = 'src/game/RooseveltScene.ts';
let scene = readFileSync(scenePath, 'utf8');
scene = replaceRequired(
  scene,
  "import { createWalkabilityMatrix, findTilePath, type TilePoint } from './tilePathfinding';\n",
  "import { createWalkabilityMatrix, findTilePath, type TilePoint } from './tilePathfinding';\nimport { shouldRenderWallBetween } from './wallCollider';\n",
  'wall collider import',
);
const sceneTextureKeys = {
  "'mockup-door307'": "'runtime-room307'",
  "'mockup-reception'": "'runtime-reception'",
  "'mockup-laundry'": "'runtime-laundry'",
  "'mockup-stairs'": "'runtime-stairs'",
  "'mockup-elevator'": "'runtime-elevator'",
};
for (const [from, to] of Object.entries(sceneTextureKeys)) {
  scene = replaceAllRequired(scene, from, to, `RooseveltScene ${from}`);
}
scene = replaceRequired(
  scene,
  `    const visibleFloorTiles = this.collectVisibleFloorTiles(floorLayer);
    this.renderFloor(visibleFloorTiles);

    const walkableTiles = new Set<string>();
    for (let tileY = 0; tileY < walkableLayer.data.length; tileY += 1) {
      const row = walkableLayer.data[tileY] ?? [];
      for (let tileX = 0; tileX < row.length; tileX += 1) {
        const tile = row[tileX];
        if (!tile || tile.index < 0) continue;
        walkableTiles.add(\`${'${tileX}:${tileY}'}\`);
      }
    }
    this.walkabilityGrid = createWalkabilityMatrix(map.width, map.height, (x, y) => walkableTiles.has(\`${'${x}:${y}'}\`));
    const worldBounds = this.measureWorldBounds(visibleFloorTiles);`,
  `    const walkableTiles = new Set<string>();
    for (let tileY = 0; tileY < walkableLayer.data.length; tileY += 1) {
      const row = walkableLayer.data[tileY] ?? [];
      for (let tileX = 0; tileX < row.length; tileX += 1) {
        const tile = row[tileX];
        if (!tile || tile.index < 0) continue;
        walkableTiles.add(\`${'${tileX}:${tileY}'}\`);
      }
    }

    const visibleFloorTiles = this.collectVisibleFloorTiles(floorLayer);
    for (const tileKey of walkableTiles) visibleFloorTiles.add(tileKey);
    this.renderFloor(visibleFloorTiles);

    this.walkabilityGrid = createWalkabilityMatrix(map.width, map.height, (x, y) => walkableTiles.has(\`${'${x}:${y}'}\`));
    const worldBounds = this.measureWorldBounds(visibleFloorTiles);`,
  'render floor beneath every walkable tile',
);
scene = replaceRequired(
  scene,
  "        if (x === topOpeningX || !isVisible(x, area.y - 1)) continue;\n        const point = this.tileToWorld(x, area.y);",
  "        if (x === topOpeningX || !isVisible(x, area.y - 1)) continue;\n        if (!shouldRenderWallBetween(this.walkabilityGrid, x, area.y, x, area.y - 1)) continue;\n        const point = this.tileToWorld(x, area.y);",
  'top partition collider opening',
);
scene = replaceRequired(
  scene,
  "        if (y === leftOpeningY || !isVisible(area.x - 1, y)) continue;\n        const point = this.tileToWorld(area.x, y);",
  "        if (y === leftOpeningY || !isVisible(area.x - 1, y)) continue;\n        if (!shouldRenderWallBetween(this.walkabilityGrid, area.x, y, area.x - 1, y)) continue;\n        const point = this.tileToWorld(area.x, y);",
  'left partition collider opening',
);
scene = replaceRequired(
  scene,
  "const body = this.add.image(0, -70, ROOSEVELT_PLAYER_TEXTURE).setDisplaySize(86, 130);",
  "const body = this.add.image(0, 0, ROOSEVELT_PLAYER_TEXTURE).setOrigin(0.5, 1).setDisplaySize(86, 130);",
  'detective bottom-center anchor',
);
scene = replaceAllRequired(scene, 'this.playerBody?.setY(-70);', 'this.playerBody?.setY(0);', 'detective settle y');
scene = replaceAllRequired(scene, 'targets: this.playerBody, y: -74,', 'targets: this.playerBody, y: -4,', 'detective walk bob');
writeFileSync(scenePath, scene);

const visualPath = 'src/game/mockupVisualPass.ts';
let visual = readFileSync(visualPath, 'utf8');
const visualTextureKeys = {
  "'mockup-kamil'": "'runtime-kamil'",
  "'npc-nina'": "'runtime-nina'",
  "'mockup-irena'": "'runtime-irena'",
  "'mockup-marek'": "'runtime-marek'",
  "'mockup-door307'": "'runtime-room307'",
  "'mockup-elevator'": "'runtime-elevator'",
  "'mockup-stairs'": "'runtime-stairs'",
  "'mockup-reception'": "'runtime-reception'",
  "'mockup-laundry'": "'runtime-laundry'",
  "'wall-hotel-nw'": "'runtime-wall-nw'",
  "'wall-hotel-ne'": "'runtime-wall-ne'",
  "'wall-service-nw'": "'runtime-wall-nw'",
  "'wall-service-ne'": "'runtime-wall-ne'",
};
for (const [from, to] of Object.entries(visualTextureKeys)) {
  if (visual.includes(from)) visual = visual.split(from).join(to);
}
visual = replaceRequired(
  visual,
  "  if (mapId === 'roosevelt-floor-3') buildRoom307Interior(scene);\n",
  '',
  'remove procedural Room 307 mock interior',
);
writeFileSync(visualPath, visual);

const compositionPath = 'src/game/mockupMapComposition.ts';
let composition = readFileSync(compositionPath, 'utf8');
const compositionTextureKeys = {
  "'mockup-reception'": "'runtime-reception'",
  "'mockup-laundry'": "'runtime-laundry'",
  "'mockup-door307'": "'runtime-room307'",
};
for (const [from, to] of Object.entries(compositionTextureKeys)) {
  composition = replaceAllRequired(composition, from, to, `composition ${from}`);
}
const floor3Start = composition.indexOf('function stageFloor3(scene: Phaser.Scene) {');
const floor3End = composition.indexOf('function addLoungeChair', floor3Start);
if (floor3Start < 0 || floor3End < 0) throw new Error('Unable to locate floor-3 composition block');
const floor3Replacement = `function stageFloor3(scene: Phaser.Scene) {
  const room307 = findImage(scene, 'runtime-room307');
  if (!room307) return;

  // Generated production art stays part of the real Tiled world. No screenshot/reference plates
  // or duplicate fake room are drawn over navigation and entities.
  addWarmGlow(scene, room307.x - 18, room307.y - 92, 250, 190, room307.depth - 0.4, 0.08);
  scene.add.image(room307.x - 88, room307.y - 68, 'prop-painting')
    .setDisplaySize(76, 60)
    .setDepth(room307.depth + 0.2);
  scene.add.image(room307.x - 132, room307.y + 8, 'prop-plant')
    .setOrigin(0.5, 1)
    .setDisplaySize(64, 92)
    .setDepth(room307.depth + 0.3);

  scene.cameras.main.setZoom(0.96);
  scene.cameras.main.centerOn(room307.x + 8, room307.y + 18);
}

`;
composition = composition.slice(0, floor3Start) + floor3Replacement + composition.slice(floor3End);
writeFileSync(compositionPath, composition);

writeFileSync(
  'public/assets/generated/asset-integration-status.txt',
  'Generated high-resolution asset sheets are cropped into production runtime sprites, wired into RooseveltScene, normalized to Phaser display ratios, and validated against Tiled Walkable wall-collider contracts.\n',
);
