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
scene = replaceAllRequired(scene, "'prop-cart'", "'runtime-cleaning-cart'", 'Roosevelt cleaning carts');
scene = replaceAllRequired(scene, "'prop-cctv'", "'runtime-cctv-desk'", 'Roosevelt CCTV desks');
scene = replaceRequired(
  scene,
  `  private propArt(texture: string, x: number, y: number, width: number, height: number, depth: number, alpha = 1) {
    return this.add.image(x, y, texture)
      .setOrigin(0.5, 1)
      .setDisplaySize(width, height)
      .setDepth(depth)
      .setAlpha(alpha);
  }`,
  `  private propArt(texture: string, x: number, y: number, width: number, height: number, depth: number, alpha = 1) {
    // Generated sprites keep their intrinsic proportions; legacy calls pass footprint widths
    // and this normalizes height so carts/desks do not look squashed on the isometric grid.
    if (texture === 'runtime-cleaning-cart') height = width * (205 / 155);
    if (texture === 'runtime-cctv-desk') height = width * (180 / 234);
    if (texture === 'runtime-luggage-cart') height = width * (203 / 145);

    return this.add.image(x, y, texture)
      .setOrigin(0.5, 1)
      .setDisplaySize(width, height)
      .setDepth(depth)
      .setAlpha(alpha);
  }`,
  'prop aspect normalization',
);
writeFileSync(scenePath, scene);

const visualPath = 'src/game/mockupVisualPass.ts';
let visual = readFileSync(visualPath, 'utf8');
visual = replaceAllRequired(visual, "'prop-luggage-cart'", "'runtime-luggage-cart'", 'visual pass luggage carts');
visual = replaceAllRequired(visual, "'prop-cctv'", "'runtime-cctv-desk'", 'visual pass CCTV');
visual = replaceRequired(
  visual,
  `  for (const monitor of images.filter((image) => image.texture.key === 'runtime-cctv-desk')) {
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
  }`,
  `  for (const monitor of images.filter((image) => image.texture.key === 'runtime-cctv-desk')) {
    const wall = nearestWall(monitor, walls);
    if (!wall) continue;

    const orientation = wall.texture.key.endsWith('-nw') ? -1 : 1;
    monitor.setOrigin(0.5, 1);
    monitor.setDisplaySize(156, 120);
    monitor.x = wall.x + orientation * 82;
    monitor.y = wall.y + wall.displayHeight * (1 - wall.originY) + 72;
    monitor.setDepth(wall.depth + 2.5);

    if (mapId === 'roosevelt-floor-3') {
      scene.add.image(wall.x + orientation * 18, wall.y - 64, 'prop-wall-clock')
        .setDisplaySize(50, 50)
        .setDepth(wall.depth + 2.7);
    }
  }`,
  'generated CCTV wall placement',
);
writeFileSync(visualPath, visual);

const compositionPath = 'src/game/mockupMapComposition.ts';
let composition = readFileSync(compositionPath, 'utf8');
composition = replaceAllRequired(composition, "'prop-cart'", "'runtime-cleaning-cart'", 'composition cleaning cart');
composition = replaceRequired(
  composition,
  ".setDisplaySize(96, 92)\n    .setDepth(depth - 6);",
  ".setDisplaySize(86, 114)\n    .setDepth(depth - 6);",
  'basement cleaning cart aspect',
);
writeFileSync(compositionPath, composition);
