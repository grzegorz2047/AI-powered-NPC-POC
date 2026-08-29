import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const sourcePath = resolve(root, 'public/maps/roosevelt-floor-3.json');
const outputPath = resolve(root, 'public/maps/roosevelt-floor-3-visual.json');

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const width = Number(source.width);
const height = Number(source.height);

if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
  throw new Error('Roosevelt floor 3 must declare a finite tilemap width and height.');
}

const map = structuredClone(source);
for (const layer of map.layers ?? []) {
  if (layer.type === 'tilelayer' && Array.isArray(layer.data)) {
    if (layer.data.length !== width * height) {
      throw new Error(`${layer.name ?? 'tile layer'} has ${layer.data.length} tiles; expected ${width * height}.`);
    }
    layer.data = [...layer.data].reverse();
  }

  if (layer.type !== 'objectgroup' || !Array.isArray(layer.objects)) continue;
  for (const object of layer.objects) {
    if (!Array.isArray(object.properties)) continue;
    const tileX = object.properties.find((property) => property.name === 'tileX');
    const tileY = object.properties.find((property) => property.name === 'tileY');
    if (typeof tileX?.value === 'number') tileX.value = width - 1 - tileX.value;
    if (typeof tileY?.value === 'number') tileY.value = height - 1 - tileY.value;
  }
}

map.properties = [
  ...(map.properties ?? []).filter((property) => property.name !== 'visualOrientation'),
  {
    name: 'visualOrientation',
    type: 'string',
    value: 'rotated-180-for-approved-mockup-composition',
  },
];

await writeFile(outputPath, `${JSON.stringify(map)}\n`, 'utf8');
console.log(`Prepared ${outputPath.replace(`${root}/`, '')} from canonical Roosevelt topology.`);
