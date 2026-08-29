import Phaser from 'phaser';
import type { WorldMapId } from './worldManifest';

type RooseveltMapId = Exclude<WorldMapId, 'prototype-room-307'>;
type DecoratedScene = Phaser.Scene & { __mockupMapCompositionApplied?: boolean };

export function applyMockupMapComposition(scene: Phaser.Scene, mapId: RooseveltMapId) {
  const decorated = scene as DecoratedScene;
  if (decorated.__mockupMapCompositionApplied) return true;

  const hasLandmark = scene.children.list.some((child) =>
    child instanceof Phaser.GameObjects.Image && (
      child.texture.key === 'mockup-reception' ||
      child.texture.key === 'mockup-laundry' ||
      child.texture.key === 'mockup-door307'
    ),
  );
  if (!hasLandmark) return false;

  if (mapId === 'roosevelt-floor-3') stageFloor3(scene);
  if (mapId === 'roosevelt-lobby') stageLobby(scene);
  if (mapId === 'roosevelt-basement') stageBasement(scene);

  decorated.__mockupMapCompositionApplied = true;
  return true;
}

function findImage(scene: Phaser.Scene, texture: string) {
  return scene.children.list.find((child): child is Phaser.GameObjects.Image =>
    child instanceof Phaser.GameObjects.Image && child.texture.key === texture);
}

function addWarmGlow(scene: Phaser.Scene, x: number, y: number, width: number, height: number, depth: number, alpha = 0.12) {
  scene.add.ellipse(x, y, width, height, 0xf0b25a, alpha)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(depth);
}

function stageFloor3(scene: Phaser.Scene) {
  const door = findImage(scene, 'mockup-door307');
  if (!door) return;

  const suiteX = door.x + 156;
  const suiteY = door.y - 86;
  const suiteDepth = door.depth - 24;

  // Room 307 owns this part of the cutaway. Hide generic wall/decor modules that used to
  // cross the authored room and made the bed/furniture read as a technical grid.
  for (const child of scene.children.list) {
    if (!(child instanceof Phaser.GameObjects.Image)) continue;
    if (child === door) continue;
    const isGenericRoomLayer =
      child.texture.key === 'wall-hotel-nw' ||
      child.texture.key === 'wall-hotel-ne' ||
      child.texture.key === 'prop-window' ||
      child.texture.key === 'prop-painting' ||
      child.texture.key === 'prop-plant';
    if (!isGenericRoomLayer) continue;

    const insideSuite = Math.abs(child.x - suiteX) < 300 && Math.abs(child.y - suiteY) < 205;
    if (insideSuite) child.setVisible(false);
  }

  addWarmGlow(scene, suiteX + 36, suiteY - 34, 560, 350, suiteDepth - 0.4, 0.065);
  scene.add.image(suiteX, suiteY, 'mockup-room307-suite')
    .setDisplaySize(690, 472)
    .setDepth(suiteDepth);

  // Composition follows the supplied mockup: one large readable room with only a sliver
  // of corridor visible under the HUD, rather than the entire floor plan at once.
  scene.cameras.main.setZoom(1.1);
  scene.cameras.main.centerOn(suiteX + 6, suiteY + 36);
}

function addLoungeChair(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.ellipse(x, y, 68, 38, 0x3f2530, 1)
    .setStrokeStyle(2, 0x8f6649, 0.78)
    .setDepth(depth);
  scene.add.ellipse(x, y - 29, 64, 62, 0x4d2a38, 1)
    .setStrokeStyle(2, 0xa07150, 0.7)
    .setDepth(depth - 0.1);
  scene.add.rectangle(x - 32, y - 2, 12, 40, 0x2a191f, 1).setDepth(depth + 0.1);
  scene.add.rectangle(x + 32, y - 2, 12, 40, 0x2a191f, 1).setDepth(depth + 0.1);
}

function addCoffeeTable(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.ellipse(x, y, 86, 38, 0x302019, 1)
    .setStrokeStyle(2, 0xa17a4b, 0.78)
    .setDepth(depth);
  scene.add.rectangle(x, y + 26, 9, 52, 0x20130f, 1).setDepth(depth - 0.1);
  scene.add.ellipse(x + 12, y - 6, 16, 24, 0x856f52, 0.94).setDepth(depth + 0.2);
}

function stageLobby(scene: Phaser.Scene) {
  const reception = findImage(scene, 'mockup-reception');
  if (!reception) return;

  const depth = reception.depth;
  const cx = reception.x + 120;
  const cy = reception.y - 64;

  scene.add.polygon(cx + 28, cy + 50, [0, -92, 184, -4, 0, 96, -184, -4], 0x34202a, 0.92)
    .setStrokeStyle(2, 0xa57f4d, 0.62)
    .setDepth(depth - 64);
  scene.add.polygon(cx + 28, cy + 50, [0, -66, 130, -2, 0, 70, -130, -2], 0x4d2934, 0.86)
    .setStrokeStyle(1.5, 0xc09a60, 0.42)
    .setDepth(depth - 63.8);

  addLoungeChair(scene, cx + 112, cy + 20, depth - 16);
  addLoungeChair(scene, cx + 188, cy + 70, depth - 14);
  addCoffeeTable(scene, cx + 142, cy + 78, depth - 12);

  scene.add.image(cx + 232, cy + 40, 'prop-plant')
    .setOrigin(0.5, 1)
    .setDisplaySize(70, 100)
    .setDepth(depth - 11);
  scene.add.image(cx + 12, cy - 118, 'prop-painting')
    .setDisplaySize(82, 66)
    .setDepth(depth - 35);

  addWarmGlow(scene, reception.x - 74, reception.y - 124, 150, 110, depth - 18, 0.14);
  scene.add.image(reception.x - 74, reception.y - 132, 'prop-wall-lamp')
    .setDisplaySize(42, 76)
    .setDepth(depth - 16);

  scene.cameras.main.setZoom(0.98);
  scene.cameras.main.centerOn(reception.x + 104, reception.y - 76);
}

function addServiceTable(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.rectangle(x, y, 126, 44, 0x303435, 1)
    .setStrokeStyle(2, 0x77715f, 0.72)
    .setDepth(depth);
  scene.add.rectangle(x - 48, y + 35, 9, 66, 0x1d2021, 1).setDepth(depth - 0.1);
  scene.add.rectangle(x + 48, y + 35, 9, 66, 0x1d2021, 1).setDepth(depth - 0.1);
  scene.add.rectangle(x - 28, y - 14, 44, 18, 0xc9c4b7, 0.9).setDepth(depth + 0.1);
  scene.add.rectangle(x + 24, y - 12, 38, 15, 0xd8d4c9, 0.88).setDepth(depth + 0.1);
}

function addCautionSign(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.polygon(x, y, [0, -42, 28, 34, -28, 34], 0xd3a42c, 1)
    .setStrokeStyle(2, 0x5a4514, 0.95)
    .setDepth(depth);
  scene.add.text(x, y + 1, '!', {
    fontFamily: 'Arial, sans-serif',
    fontSize: '24px',
    fontStyle: 'bold',
    color: '#4d3510',
  }).setOrigin(0.5).setDepth(depth + 0.1);
}

function stageBasement(scene: Phaser.Scene) {
  const laundry = findImage(scene, 'mockup-laundry');
  if (!laundry) return;

  const depth = laundry.depth;
  const cx = laundry.x;
  const cy = laundry.y - 54;

  scene.add.polygon(cx + 10, cy + 64, [0, -90, 190, -2, 0, 98, -190, -2], 0x1d2925, 0.8)
    .setStrokeStyle(2, 0x5e6657, 0.6)
    .setDepth(depth - 58);

  addServiceTable(scene, cx - 166, cy + 42, depth - 12);
  addCautionSign(scene, cx - 58, cy + 124, depth - 7);
  scene.add.image(cx + 172, cy + 112, 'prop-cart')
    .setOrigin(0.5, 1)
    .setDisplaySize(96, 92)
    .setDepth(depth - 6);

  scene.add.rectangle(cx + 190, cy - 6, 68, 116, 0x20272b, 1)
    .setStrokeStyle(2, 0x657078, 0.68)
    .setDepth(depth - 18);
  scene.add.line(cx + 190, cy - 6, -22, -35, 22, -35, 0x8c966f, 0.7).setDepth(depth - 17.8);
  scene.add.line(cx + 190, cy - 6, -22, 0, 22, 0, 0x8c966f, 0.58).setDepth(depth - 17.8);
  scene.add.line(cx + 190, cy - 6, -22, 35, 22, 35, 0x8c966f, 0.46).setDepth(depth - 17.8);

  addWarmGlow(scene, cx - 12, cy - 132, 210, 112, depth - 30, 0.08);
  scene.add.rectangle(cx - 12, cy - 156, 92, 12, 0xc6ad6e, 0.9)
    .setStrokeStyle(1, 0xf0d293, 0.55)
    .setDepth(depth - 28);

  scene.cameras.main.setZoom(0.98);
  scene.cameras.main.centerOn(cx, cy + 20);
}
