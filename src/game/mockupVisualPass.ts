import Phaser from 'phaser';
import type { WorldMapId } from './worldManifest';

type RooseveltMapId = Exclude<WorldMapId, 'prototype-room-307'>;
type DecoratedScene = Phaser.Scene & { __mockupVisualPassApplied?: boolean };

const CHARACTER_TEXTURES = new Set(['mockup-kamil', 'npc-nina', 'mockup-irena', 'mockup-marek']);

const MODULE_SCALE: Record<string, { scale: number; dy?: number }> = {
  'mockup-door307': { scale: 1.24 },
  'mockup-elevator': { scale: 1.22 },
  'mockup-stairs': { scale: 1.18, dy: -12 },
  'mockup-reception': { scale: 1.10, dy: -5 },
  'mockup-laundry': { scale: 1.08, dy: -5 },
  'prop-cctv': { scale: 1.18 },
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
  integrateArchitecturalLandmarks(scene, initialImages, mapId);
  addGuestRoomDoors(scene, initialImages, mapId);
  addMockupSetPieces(scene, mapId);

  if (mapId !== 'roosevelt-basement') addHotelWallRhythm(scene, initialImages);
  addLandmarkPlants(scene, initialImages, mapId);
  addCameraControls(scene);

  decorated.__mockupVisualPassApplied = true;
  return true;
}

function scaleCharacters(scene: Phaser.Scene, images: Phaser.GameObjects.Image[]) {
  const detective = scene.children.getByName('detective');
  if (detective instanceof Phaser.GameObjects.Container) detective.setScale(1.2);

  for (const image of images) {
    if (!CHARACTER_TEXTURES.has(image.texture.key)) continue;
    image.setDisplaySize(Math.max(image.displayWidth, 98), Math.max(image.displayHeight, 156));
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

function integrateArchitecturalLandmarks(scene: Phaser.Scene, images: Phaser.GameObjects.Image[], mapId: RooseveltMapId) {
  const walls = images.filter((image) =>
    mapId === 'roosevelt-basement'
      ? image.texture.key === 'wall-service-nw' || image.texture.key === 'wall-service-ne'
      : image.texture.key === 'wall-hotel-nw' || image.texture.key === 'wall-hotel-ne',
  );
  const usedWalls = new Set<Phaser.GameObjects.Image>();

  const snapIntoWall = (texture: string) => {
    for (const module of images.filter((image) => image.texture.key === texture)) {
      const wall = nearestWall(module, walls, usedWalls);
      if (!wall) continue;
      usedWalls.add(wall);
      wall.setVisible(false);
      module.x = wall.x;
      module.y = wall.y + wall.displayHeight * (1 - wall.originY) - 2;
      module.setDepth(wall.depth + 2);
    }
  };

  snapIntoWall('mockup-door307');
  snapIntoWall('mockup-elevator');

  for (const elevator of images.filter((image) => image.texture.key === 'mockup-elevator')) {
    addElevatorDetails(scene, elevator, mapId);
  }

  for (const monitor of images.filter((image) => image.texture.key === 'prop-cctv')) {
    const wall = nearestWall(monitor, walls);
    if (!wall) continue;

    if (mapId === 'roosevelt-floor-3') {
      monitor.setVisible(false);
      const orientation = wall.texture.key.endsWith('-nw') ? -1 : 1;
      scene.add.image(wall.x + orientation * 64, wall.y + wall.displayHeight * (1 - wall.originY) + 52, 'prop-cctv-console')
        .setOrigin(0.5, 1)
        .setDisplaySize(158, 140)
        .setDepth(wall.depth + 3);
      scene.add.image(wall.x + orientation * 20, wall.y - 64, 'prop-wall-clock')
        .setDisplaySize(54, 54)
        .setDepth(wall.depth + 2.7);
      continue;
    }

    const orientation = wall.texture.key.endsWith('-nw') ? -1 : 1;
    monitor.x = wall.x + orientation * 50;
    monitor.y = wall.y + wall.displayHeight * (1 - wall.originY) + 24;
    monitor.setDepth(wall.depth + 2.5);
  }
}

function addElevatorDetails(scene: Phaser.Scene, elevator: Phaser.GameObjects.Image, mapId: RooseveltMapId) {
  const floorLabel = mapId === 'roosevelt-floor-3' ? '3' : mapId === 'roosevelt-basement' ? 'B1' : '1';
  const top = elevator.y - elevator.displayHeight + 24;

  scene.add.text(elevator.x, top, floorLabel, {
    fontFamily: 'Georgia, serif',
    fontSize: floorLabel.length > 1 ? '12px' : '15px',
    fontStyle: 'bold',
    color: '#e0bb70',
    backgroundColor: '#17140fef',
    padding: { x: 7, y: 4 },
  }).setOrigin(0.5).setDepth(elevator.depth + 4);

  scene.add.rectangle(elevator.x + elevator.displayWidth * 0.48, elevator.y - elevator.displayHeight * 0.42, 12, 30, 0x161716, 0.98)
    .setStrokeStyle(1.5, 0x9c7940, 0.9)
    .setDepth(elevator.depth + 3.5);
  scene.add.circle(elevator.x + elevator.displayWidth * 0.48, elevator.y - elevator.displayHeight * 0.42, 2.5, 0xd3a75f, 1)
    .setDepth(elevator.depth + 3.7);
}

function addGuestRoomDoors(scene: Phaser.Scene, images: Phaser.GameObjects.Image[], mapId: RooseveltMapId) {
  if (mapId !== 'roosevelt-floor-3') return;

  const walls = images
    .filter((image) => image.visible && (image.texture.key === 'wall-hotel-nw' || image.texture.key === 'wall-hotel-ne'))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  if (walls.length < 4) return;

  const topBand = walls.slice(0, Math.max(4, Math.ceil(walls.length * 0.38)));
  const leftHalf = topBand.filter((wall) => wall.x < scene.scale.width * 0.5);
  const rightHalf = topBand.filter((wall) => wall.x >= scene.scale.width * 0.5);
  const choices = [
    { wall: leftHalf[Math.floor(leftHalf.length * 0.55)] ?? topBand[Math.floor(topBand.length * 0.3)], texture: 'prop-room-door-305' },
    { wall: rightHalf[Math.floor(rightHalf.length * 0.45)] ?? topBand[Math.floor(topBand.length * 0.7)], texture: 'prop-room-door-309' },
  ];

  for (const { wall, texture } of choices) {
    if (!wall?.visible) continue;
    wall.setVisible(false);
    scene.add.image(wall.x, wall.y + wall.displayHeight * (1 - wall.originY) - 2, texture)
      .setOrigin(0.5, 1)
      .setDisplaySize(90, 162)
      .setDepth(wall.depth + 2);
  }
}

function addMockupSetPieces(scene: Phaser.Scene, mapId: RooseveltMapId) {
  if (mapId === 'roosevelt-floor-3') {
    const door305 = scene.children.list.find((child): child is Phaser.GameObjects.Image =>
      child instanceof Phaser.GameObjects.Image && child.texture.key === 'prop-room-door-305');
    if (door305) {
      scene.add.image(door305.x - 86, door305.y + 5, 'prop-luggage-cart')
        .setOrigin(0.5, 1)
        .setDisplaySize(96, 134)
        .setDepth(door305.depth + 1.4);
    }

    const door307 = scene.children.list.find((child): child is Phaser.GameObjects.Image =>
      child instanceof Phaser.GameObjects.Image && child.texture.key === 'mockup-door307');
    if (door307) {
      const lampX = door307.x + 68;
      const lampY = door307.y - 104;
      scene.add.ellipse(lampX, lampY + 6, 96, 72, 0xe7ad58, 0.12)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(door307.depth + 0.5);
      scene.add.image(lampX, lampY, 'prop-wall-lamp')
        .setDisplaySize(36, 66)
        .setDepth(door307.depth + 0.8);
    }
  }

  if (mapId === 'roosevelt-lobby') {
    const reception = scene.children.list.find((child): child is Phaser.GameObjects.Image =>
      child instanceof Phaser.GameObjects.Image && child.texture.key === 'mockup-reception');
    if (reception) {
      scene.add.image(reception.x + 176, reception.y - 8, 'prop-luggage-cart')
        .setOrigin(0.5, 1)
        .setDisplaySize(90, 126)
        .setDepth(reception.depth + 1.2);
    }
  }
}

function nearestWall(
  source: Phaser.GameObjects.Image,
  walls: Phaser.GameObjects.Image[],
  excluded: Set<Phaser.GameObjects.Image> = new Set(),
) {
  let best: Phaser.GameObjects.Image | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const wall of walls) {
    if (excluded.has(wall)) continue;
    const distance = Phaser.Math.Distance.Squared(source.x, source.y, wall.x, wall.y);
    if (distance >= bestDistance) continue;
    bestDistance = distance;
    best = wall;
  }
  return best;
}

function addHotelWallRhythm(scene: Phaser.Scene, images: Phaser.GameObjects.Image[]) {
  const walls = images
    .filter((image) => image.visible && (image.texture.key === 'wall-hotel-nw' || image.texture.key === 'wall-hotel-ne'))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  for (let index = 0; index < walls.length; index += 1) {
    const wall = walls[index];
    const orientation = wall.texture.key.endsWith('-nw') ? -1 : 1;

    if (index % 5 === 1) {
      const x = wall.x + orientation * 17;
      const y = wall.y - 58;
      scene.add.ellipse(x, y + 5, 96, 70, 0xe6ad58, 0.11)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(wall.depth + 0.35);
      scene.add.image(x, y, 'prop-wall-lamp')
        .setDisplaySize(34, 62)
        .setDepth(wall.depth + 0.55);
      continue;
    }

    if (index % 8 === 4) {
      scene.add.image(wall.x + orientation * 13, wall.y - 55, 'prop-painting')
        .setDisplaySize(60, 49)
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
    addNear('mockup-door307', 82, 8, 56, 84);
    addNear('mockup-elevator', -84, 4, 54, 80);
  } else {
    addNear('mockup-reception', 176, 0, 64, 94);
    addNear('mockup-elevator', -78, 2, 54, 80);
  }
}

function addCameraControls(scene: Phaser.Scene) {
  const makeButton = (label: string, y: number, onPress: () => void) => {
    const background = scene.add.rectangle(46, y, 36, 36, 0x0a0e14, 0.94)
      .setStrokeStyle(1.3, 0x4c5662, 0.95)
      .setScrollFactor(0)
      .setDepth(33000)
      .setInteractive({ useHandCursor: true });
    const text = scene.add.text(46, y - 1, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: label === '◎' ? '20px' : '24px',
      color: '#d9d2c3',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(33001);

    background.on('pointerover', () => { background.setStrokeStyle(1.5, 0xc09a57, 1); text.setColor('#f0d79d'); });
    background.on('pointerout', () => { background.setStrokeStyle(1.3, 0x4c5662, 0.95); text.setColor('#d9d2c3'); });
    background.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      onPress();
    });
  };

  makeButton('+', 496, () => {
    const camera = scene.cameras.main;
    camera.setZoom(Phaser.Math.Clamp(camera.zoom + 0.12, 0.5, 1.5));
  });
  makeButton('−', 540, () => {
    const camera = scene.cameras.main;
    camera.setZoom(Phaser.Math.Clamp(camera.zoom - 0.12, 0.5, 1.5));
  });
  makeButton('◎', 584, () => {
    const detective = scene.children.getByName('detective');
    if (detective instanceof Phaser.GameObjects.Container) scene.cameras.main.centerOn(detective.x, detective.y);
  });
}
