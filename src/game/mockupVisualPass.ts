import Phaser from 'phaser';
import type { WorldMapId } from './worldManifest';

type RooseveltMapId = Exclude<WorldMapId, 'prototype-room-307'>;
type DecoratedScene = Phaser.Scene & { __mockupVisualPassApplied?: boolean };

const CHARACTER_TEXTURES = new Set(['mockup-kamil', 'npc-nina', 'mockup-irena', 'mockup-marek']);

const MODULE_SCALE: Record<string, { scale: number; dy?: number }> = {
  'mockup-door307': { scale: 1.16, dy: -42 },
  'mockup-elevator': { scale: 1.10, dy: -14 },
  'mockup-stairs': { scale: 1.09, dy: -10 },
  'mockup-reception': { scale: 1.08, dy: -4 },
  'mockup-laundry': { scale: 1.06, dy: -4 },
  'prop-cctv': { scale: 1.14, dy: -6 },
};

export function applyMockupVisualPass(scene: Phaser.Scene, mapId: RooseveltMapId) {
  const decorated = scene as DecoratedScene;
  if (decorated.__mockupVisualPassApplied) return true;

  const initialImages = scene.children.list.filter((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image);
  const sceneReady = initialImages.some((image) =>
    image.texture.key === 'wall-hotel-nw' ||
    image.texture.key === 'wall-hotel-ne' ||
    image.texture.key === 'wall-service-nw' ||
    image.texture.key === 'wall-service-ne',
  );
  if (!sceneReady) return false;

  scaleCharacters(scene, initialImages);
  scaleArchitecture(initialImages);

  if (mapId !== 'roosevelt-basement') addHotelWallRhythm(scene, initialImages);
  addLandmarkPlants(scene, initialImages, mapId);

  decorated.__mockupVisualPassApplied = true;
  return true;
}

function scaleCharacters(scene: Phaser.Scene, images: Phaser.GameObjects.Image[]) {
  const detective = scene.children.getByName('detective');
  if (detective instanceof Phaser.GameObjects.Container) detective.setScale(1.14);

  for (const image of images) {
    if (!CHARACTER_TEXTURES.has(image.texture.key)) continue;
    image.setDisplaySize(Math.max(image.displayWidth, 92), Math.max(image.displayHeight, 148));
  }
}

function scaleArchitecture(images: Phaser.GameObjects.Image[]) {
  for (const image of images) {
    const target = MODULE_SCALE[image.texture.key];
    if (!target) continue;
    image.setDisplaySize(image.displayWidth * target.scale, image.displayHeight * target.scale);
    if (target.dy) image.y += target.dy;
  }
}

function addHotelWallRhythm(scene: Phaser.Scene, images: Phaser.GameObjects.Image[]) {
  const walls = images
    .filter((image) => image.texture.key === 'wall-hotel-nw' || image.texture.key === 'wall-hotel-ne')
    .sort((a, b) => a.y - b.y || a.x - b.x);

  for (let index = 0; index < walls.length; index += 1) {
    const wall = walls[index];
    const orientation = wall.texture.key.endsWith('-nw') ? -1 : 1;

    if (index % 6 === 1) {
      const x = wall.x + orientation * 17;
      const y = wall.y - 58;
      scene.add.ellipse(x, y + 5, 92, 66, 0xe6ad58, 0.10)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(wall.depth + 0.35);
      scene.add.image(x, y, 'prop-wall-lamp')
        .setDisplaySize(34, 62)
        .setDepth(wall.depth + 0.55);
      continue;
    }

    if (index % 9 === 4) {
      scene.add.image(wall.x + orientation * 13, wall.y - 55, 'prop-painting')
        .setDisplaySize(58, 47)
        .setRotation(orientation * 0.045)
        .setDepth(wall.depth + 0.5);
    }
  }
}

function addLandmarkPlants(scene: Phaser.Scene, images: Phaser.GameObjects.Image[], mapId: RooseveltMapId) {
  if (mapId === 'roosevelt-basement') return;

  const addNear = (texture: string, dx: number, dy: number, width = 56, height = 82) => {
    const anchor = images.find((image) => image.texture.key === texture);
    if (!anchor) return;
    scene.add.image(anchor.x + dx, anchor.y + dy, 'prop-plant')
      .setOrigin(0.5, 1)
      .setDisplaySize(width, height)
      .setDepth(anchor.depth + 0.8);
  };

  if (mapId === 'roosevelt-floor-3') {
    addNear('mockup-door307', 82, 8, 54, 80);
    addNear('mockup-elevator', -82, 4, 52, 78);
  } else {
    addNear('mockup-reception', 176, 0, 62, 92);
    addNear('mockup-elevator', -76, 2, 52, 78);
  }
}
