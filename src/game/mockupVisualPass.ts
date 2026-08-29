import Phaser from 'phaser';
import type { WorldMapId } from './worldManifest';

type RooseveltMapId = Exclude<WorldMapId, 'prototype-room-307'>;
type DecoratedScene = Phaser.Scene & { __mockupVisualPassApplied?: boolean };

const CHARACTER_TEXTURES = new Set(['runtime-kamil', 'runtime-nina', 'runtime-irena', 'runtime-marek']);

const MODULE_SCALE: Record<string, { scale: number; dy?: number }> = {
  'runtime-room307': { scale: 1.28 },
  'runtime-elevator': { scale: 1.24 },
  'runtime-stairs': { scale: 1.2, dy: -14 },
  'runtime-reception': { scale: 1.12, dy: -6 },
  'runtime-laundry': { scale: 1.1, dy: -6 },
  'prop-cctv': { scale: 1.2 },
};

export function applyMockupVisualPass(scene: Phaser.Scene, mapId: RooseveltMapId) {
  const decorated = scene as DecoratedScene;
  if (decorated.__mockupVisualPassApplied) return true;

  const initialImages = scene.children.list.filter((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image);
  const sceneReady = initialImages.some((image) =>
    image.texture.key === 'runtime-wall-nw' ||
    image.texture.key === 'runtime-wall-ne' ||
    image.texture.key === 'runtime-wall-nw' ||
    image.texture.key === 'runtime-wall-ne',
  );
  if (!sceneReady) return false;

  scaleCharacters(scene, initialImages);
  scaleArchitecture(initialImages);
  integrateArchitecturalLandmarks(scene, initialImages, mapId);
  addGuestRoomDoors(scene, initialImages, mapId);
  addMockupSetPieces(scene, mapId);

  if (mapId !== 'roosevelt-basement') addHotelWallRhythm(scene, initialImages);
  addLandmarkPlants(scene, initialImages, mapId);
  applyMockupCameraFraming(scene, mapId);
  hideInternalSceneChrome(scene);
  addMockupNavigationChrome(scene, mapId);
  addCameraControls(scene);

  decorated.__mockupVisualPassApplied = true;
  return true;
}

function scaleCharacters(scene: Phaser.Scene, images: Phaser.GameObjects.Image[]) {
  const detective = scene.children.getByName('detective');
  if (detective instanceof Phaser.GameObjects.Container) detective.setScale(1.28);

  for (const image of images) {
    if (!CHARACTER_TEXTURES.has(image.texture.key)) continue;
    image.setDisplaySize(Math.max(image.displayWidth, 104), Math.max(image.displayHeight, 164));
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
      ? image.texture.key === 'runtime-wall-nw' || image.texture.key === 'runtime-wall-ne'
      : image.texture.key === 'runtime-wall-nw' || image.texture.key === 'runtime-wall-ne',
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

  snapIntoWall('runtime-room307');
  snapIntoWall('runtime-elevator');

  for (const elevator of images.filter((image) => image.texture.key === 'runtime-elevator')) {
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
        .setDisplaySize(166, 146)
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
    .filter((image) => image.visible && (image.texture.key === 'runtime-wall-nw' || image.texture.key === 'runtime-wall-ne'))
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
      .setDisplaySize(92, 166)
      .setDepth(wall.depth + 2);
  }
}

function addMockupSetPieces(scene: Phaser.Scene, mapId: RooseveltMapId) {
  if (mapId === 'roosevelt-floor-3') {
    const door305 = findImage(scene, 'prop-room-door-305');
    if (door305) {
      scene.add.image(door305.x - 86, door305.y + 5, 'prop-luggage-cart')
        .setOrigin(0.5, 1)
        .setDisplaySize(98, 138)
        .setDepth(door305.depth + 1.4);
    }

    const door307 = findImage(scene, 'runtime-room307');
    if (door307) {
      const lampX = door307.x + 68;
      const lampY = door307.y - 104;
      addWarmGlow(scene, lampX, lampY + 8, 104, 78, door307.depth + 0.5, 0.13);
      scene.add.image(lampX, lampY, 'prop-wall-lamp')
        .setDisplaySize(38, 70)
        .setDepth(door307.depth + 0.8);
    }
  }

  if (mapId === 'roosevelt-lobby') {
    const reception = findImage(scene, 'runtime-reception');
    if (reception) {
      scene.add.image(reception.x + 176, reception.y - 8, 'prop-luggage-cart')
        .setOrigin(0.5, 1)
        .setDisplaySize(92, 130)
        .setDepth(reception.depth + 1.2);
    }
  }
}

function buildRoom307Interior(scene: Phaser.Scene) {
  const door = findImage(scene, 'runtime-room307');
  if (!door) return;

  const cx = door.x + 126;
  const cy = door.y - 132;
  const floorDepth = door.depth - 84;
  const wallDepth = door.depth - 66;
  const furnitureDepth = door.depth - 30;

  // A single readable suite replaces the impression of an empty technical grid around Room 307.
  scene.add.polygon(cx + 22, cy + 54, [0, -108, 210, -4, 0, 112, -210, -4], 0x2f1a22, 0.98)
    .setStrokeStyle(2, 0x8e6941, 0.92)
    .setDepth(floorDepth);
  scene.add.polygon(cx + 24, cy + 54, [0, -82, 162, -2, 0, 86, -162, -2], 0x642a36, 0.93)
    .setStrokeStyle(2, 0xb88b54, 0.58)
    .setDepth(floorDepth + 0.4);
  scene.add.polygon(cx + 24, cy + 54, [0, -64, 126, -1, 0, 67, -126, -1], 0x3d2830, 0.7)
    .setStrokeStyle(1, 0xd2aa69, 0.38)
    .setDepth(floorDepth + 0.6);

  // High cutaway back walls framing the suite like the approved mockup.
  for (let index = 0; index < 3; index += 1) {
    scene.add.image(cx - 40 + index * 64, cy - 132 - index * 32, 'runtime-wall-ne')
      .setOrigin(0.5, 0.72)
      .setDisplaySize(128, 208)
      .setDepth(wallDepth + index * 0.03);
  }
  for (let index = 0; index < 3; index += 1) {
    scene.add.image(cx + 152 + index * 64, cy - 196 + index * 32, 'runtime-wall-nw')
      .setOrigin(0.5, 0.72)
      .setDisplaySize(128, 208)
      .setDepth(wallDepth + 0.2 + index * 0.03);
  }

  addBed(scene, cx - 4, cy - 8, furnitureDepth);
  addNightstand(scene, cx - 124, cy - 18, furnitureDepth + 0.4);
  addNightstand(scene, cx + 112, cy - 18, furnitureDepth + 0.5);
  addWardrobe(scene, cx - 178, cy + 12, furnitureDepth + 0.3);
  addArmchair(scene, cx + 190, cy + 6, furnitureDepth + 0.8);
  addRoundTable(scene, cx + 174, cy + 76, furnitureDepth + 1.1);
  addTelevisionConsole(scene, cx + 224, cy + 112, furnitureDepth + 1.2);
  addLuggageBench(scene, cx + 16, cy + 126, furnitureDepth + 1.4);

  scene.add.image(cx + 120, cy - 190, 'prop-window')
    .setDisplaySize(96, 82)
    .setDepth(wallDepth + 2.4);
  scene.add.image(cx - 104, cy - 176, 'prop-painting')
    .setDisplaySize(72, 58)
    .setRotation(-0.035)
    .setDepth(wallDepth + 2.5);

  addRoomLamp(scene, cx - 125, cy - 44, furnitureDepth + 3);
  addRoomLamp(scene, cx + 112, cy - 44, furnitureDepth + 3.1);

  // Small bathroom/service nook visible through the cutaway.
  scene.add.rectangle(cx - 182, cy + 118, 70, 52, 0xd8d1c3, 0.9)
    .setStrokeStyle(2, 0x7b6c59, 0.7)
    .setDepth(furnitureDepth + 1.5);
  scene.add.ellipse(cx - 182, cy + 108, 38, 16, 0xf0e7d7, 0.96)
    .setStrokeStyle(1.5, 0x8a806e, 0.8)
    .setDepth(furnitureDepth + 1.7);
  scene.add.rectangle(cx - 182, cy + 72, 48, 42, 0x151a20, 0.96)
    .setStrokeStyle(2, 0x96754a, 0.68)
    .setDepth(furnitureDepth + 1.2);

  scene.add.image(cx + 246, cy + 36, 'prop-plant')
    .setOrigin(0.5, 1)
    .setDisplaySize(58, 86)
    .setDepth(furnitureDepth + 1.8);
}

function addBed(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.rectangle(x, y - 54, 184, 62, 0x3d241d, 0.98)
    .setStrokeStyle(2, 0x9a6d3d, 0.9)
    .setDepth(depth - 1);
  scene.add.polygon(x, y, [0, -58, 130, -2, 0, 60, -130, -2], 0xc6b49b, 1)
    .setStrokeStyle(2, 0x755b43, 0.86)
    .setDepth(depth);
  scene.add.polygon(x + 16, y + 16, [0, -42, 108, 1, 4, 56, -104, 4], 0x6c2c3c, 0.98)
    .setStrokeStyle(1.5, 0xb97b65, 0.46)
    .setDepth(depth + 0.2);
  scene.add.ellipse(x - 48, y - 34, 54, 26, 0xe3d5c0, 1)
    .setRotation(-0.18)
    .setDepth(depth + 0.4);
  scene.add.ellipse(x + 24, y - 34, 54, 26, 0xe3d5c0, 1)
    .setRotation(-0.18)
    .setDepth(depth + 0.4);
}

function addNightstand(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.rectangle(x, y, 42, 34, 0x2e1d17, 1)
    .setStrokeStyle(1.5, 0x9d7242, 0.78)
    .setDepth(depth);
  scene.add.line(x, y + 7, -15, 0, 15, 0, 0xb1844d, 0.55).setDepth(depth + 0.1);
}

function addWardrobe(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.rectangle(x, y - 46, 76, 122, 0x261913, 1)
    .setStrokeStyle(2, 0x9c7042, 0.82)
    .setDepth(depth);
  scene.add.line(x, y - 44, 0, -48, 0, 48, 0x7d5737, 0.75).setDepth(depth + 0.1);
  scene.add.circle(x - 8, y - 44, 2.4, 0xc59a59, 1).setDepth(depth + 0.2);
  scene.add.circle(x + 8, y - 44, 2.4, 0xc59a59, 1).setDepth(depth + 0.2);
}

function addArmchair(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.ellipse(x, y, 70, 42, 0x542433, 1)
    .setStrokeStyle(2, 0x97664a, 0.78)
    .setDepth(depth);
  scene.add.ellipse(x, y - 32, 68, 70, 0x632a3b, 1)
    .setStrokeStyle(2, 0xa06d51, 0.74)
    .setDepth(depth - 0.1);
  scene.add.rectangle(x - 34, y - 3, 14, 44, 0x3d202a, 1).setDepth(depth + 0.2);
  scene.add.rectangle(x + 34, y - 3, 14, 44, 0x3d202a, 1).setDepth(depth + 0.2);
}

function addRoundTable(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.ellipse(x, y, 72, 34, 0x36231c, 1)
    .setStrokeStyle(2, 0x9d7345, 0.78)
    .setDepth(depth);
  scene.add.rectangle(x, y + 24, 9, 48, 0x251812, 1).setDepth(depth - 0.1);
  scene.add.ellipse(x + 12, y - 5, 12, 21, 0x91a4a2, 0.9).setDepth(depth + 0.2);
}

function addTelevisionConsole(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.rectangle(x, y, 112, 44, 0x291b16, 1)
    .setStrokeStyle(2, 0x8d663e, 0.76)
    .setDepth(depth);
  scene.add.rectangle(x, y - 54, 96, 56, 0x070a0d, 1)
    .setStrokeStyle(2, 0x434b50, 0.9)
    .setDepth(depth + 0.1);
  scene.add.rectangle(x, y - 54, 82, 43, 0x111820, 1).setDepth(depth + 0.2);
}

function addLuggageBench(scene: Phaser.Scene, x: number, y: number, depth: number) {
  scene.add.rectangle(x, y, 108, 36, 0x33211a, 1)
    .setStrokeStyle(2, 0x9b6f40, 0.76)
    .setDepth(depth);
  scene.add.rectangle(x + 20, y - 30, 64, 46, 0x3a2518, 1)
    .setStrokeStyle(2, 0xb0834e, 0.72)
    .setDepth(depth + 0.2);
  scene.add.line(x + 20, y - 53, -15, 0, 15, 0, 0xb0834e, 0.82).setDepth(depth + 0.3);
}

function addRoomLamp(scene: Phaser.Scene, x: number, y: number, depth: number) {
  addWarmGlow(scene, x, y - 28, 118, 88, depth - 0.2, 0.14);
  scene.add.rectangle(x, y, 5, 30, 0x8d693c, 1).setDepth(depth);
  scene.add.ellipse(x, y - 18, 32, 22, 0xe2b866, 1)
    .setStrokeStyle(1.5, 0xffdda0, 0.72)
    .setDepth(depth + 0.1);
}

function addWarmGlow(scene: Phaser.Scene, x: number, y: number, width: number, height: number, depth: number, alpha: number) {
  scene.add.ellipse(x, y, width, height, 0xf2b55b, alpha)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(depth);
}

function findImage(scene: Phaser.Scene, texture: string) {
  return scene.children.list.find((child): child is Phaser.GameObjects.Image =>
    child instanceof Phaser.GameObjects.Image && child.texture.key === texture);
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
    .filter((image) => image.visible && (image.texture.key === 'runtime-wall-nw' || image.texture.key === 'runtime-wall-ne'))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  for (let index = 0; index < walls.length; index += 1) {
    const wall = walls[index];
    const orientation = wall.texture.key.endsWith('-nw') ? -1 : 1;

    if (index % 5 === 1) {
      const x = wall.x + orientation * 17;
      const y = wall.y - 58;
      addWarmGlow(scene, x, y + 5, 100, 74, wall.depth + 0.35, 0.12);
      scene.add.image(x, y, 'prop-wall-lamp')
        .setDisplaySize(36, 66)
        .setDepth(wall.depth + 0.55);
      continue;
    }

    if (index % 8 === 4) {
      scene.add.image(wall.x + orientation * 13, wall.y - 55, 'prop-painting')
        .setDisplaySize(62, 51)
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
    addNear('runtime-room307', 82, 8, 58, 86);
    addNear('runtime-elevator', -84, 4, 56, 82);
  } else {
    addNear('runtime-reception', 176, 0, 66, 96);
    addNear('runtime-elevator', -78, 2, 56, 82);
  }
}

function applyMockupCameraFraming(scene: Phaser.Scene, mapId: RooseveltMapId) {
  const camera = scene.cameras.main;
  if (mapId === 'roosevelt-floor-3') {
    const door = findImage(scene, 'runtime-room307');
    camera.setZoom(1.04);
    if (door) camera.centerOn(door.x + 116, door.y - 114);
    return;
  }

  camera.setZoom(mapId === 'roosevelt-lobby' ? 0.9 : 0.88);
}

function hideInternalSceneChrome(scene: Phaser.Scene) {
  const hiddenPrefixes = ['CAMERA ', 'HOTEL NOCTURNE /', 'Drag to pan', 'EVIDENCE '];
  for (const child of scene.children.list) {
    if (!(child instanceof Phaser.GameObjects.Text)) continue;
    if (hiddenPrefixes.some((prefix) => child.text.startsWith(prefix))) child.setVisible(false);
  }
}

function addMockupNavigationChrome(scene: Phaser.Scene, mapId: RooseveltMapId) {
  const depth = 32900;
  const currentFloor = mapId === 'roosevelt-floor-3' ? '3F' : mapId === 'roosevelt-basement' ? 'B1' : '1F';

  scene.add.rectangle(890, 550, 236, 134, 0x070c13, 0.9)
    .setStrokeStyle(1.2, 0x3d5367, 0.92)
    .setScrollFactor(0)
    .setDepth(depth);

  scene.add.polygon(846, 551, [0, -43, 68, -9, 0, 29, -68, -9], 0x172230, 0.98)
    .setStrokeStyle(1.2, 0x485a70, 0.95)
    .setScrollFactor(0)
    .setDepth(depth + 1);
  scene.add.polygon(846, 551, [0, -27, 43, -6, 0, 18, -43, -6], 0x213044, 0.94)
    .setStrokeStyle(1, 0x6d5d3f, 0.8)
    .setScrollFactor(0)
    .setDepth(depth + 2);
  scene.add.line(846, 551, -45, -21, 45, 22, 0x506176, 0.6).setScrollFactor(0).setDepth(depth + 3);
  scene.add.line(846, 551, -44, 20, 44, -20, 0x506176, 0.5).setScrollFactor(0).setDepth(depth + 3);
  scene.add.circle(846, 551, 5.5, 0xe2b24f, 1)
    .setStrokeStyle(1.4, 0x11161c, 1)
    .setScrollFactor(0)
    .setDepth(depth + 4);

  scene.add.text(846, 494, 'N', { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#d6c7a6' })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth + 3);
  scene.add.line(846, 507, 0, 12, 0, -8, 0xd6c7a6, 0.8).setScrollFactor(0).setDepth(depth + 2);

  scene.add.text(927, 516, currentFloor, {
    fontFamily: 'Georgia, serif',
    fontSize: '15px',
    fontStyle: 'bold',
    color: '#edcf8d',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);
  scene.add.text(927, 540, mapId === 'roosevelt-basement' ? 'SERVICE' : 'ISOMETRIC 2.5D', {
    fontFamily: 'Arial, sans-serif',
    fontSize: '9px',
    color: '#9faaba',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);
}

function addCameraControls(scene: Phaser.Scene) {
  const makeButton = (label: string, y: number, onPress: () => void) => {
    const x = 978;
    const background = scene.add.rectangle(x, y, 34, 34, 0x0a0e14, 0.96)
      .setStrokeStyle(1.2, 0x586675, 0.96)
      .setScrollFactor(0)
      .setDepth(33000)
      .setInteractive({ useHandCursor: true });
    const text = scene.add.text(x, y - 1, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: label === '◎' ? '18px' : '22px',
      color: '#d9d2c3',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(33001);

    background.on('pointerover', () => { background.setStrokeStyle(1.5, 0xc09a57, 1); text.setColor('#f0d79d'); });
    background.on('pointerout', () => { background.setStrokeStyle(1.2, 0x586675, 0.96); text.setColor('#d9d2c3'); });
    background.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      onPress();
    });
  };

  makeButton('+', 510, () => {
    const camera = scene.cameras.main;
    camera.setZoom(Phaser.Math.Clamp(camera.zoom + 0.12, 0.5, 1.5));
  });
  makeButton('−', 550, () => {
    const camera = scene.cameras.main;
    camera.setZoom(Phaser.Math.Clamp(camera.zoom - 0.12, 0.5, 1.5));
  });
  makeButton('◎', 590, () => {
    const detective = scene.children.getByName('detective');
    if (detective instanceof Phaser.GameObjects.Container) scene.cameras.main.centerOn(detective.x, detective.y);
  });
}
