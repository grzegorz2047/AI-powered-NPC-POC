import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ROOSEVELT_FLOOR_TEXTURE_BY_MAP,
  ROOSEVELT_GENERATED_PROP_SHEET,
  ROOSEVELT_IMAGE_ASSETS,
} from './sceneAssets';

function readPublicAsset(url: string) {
  const relative = url.replace(/^\//, '');
  return readFileSync(new URL(`../../public/${relative}`, import.meta.url));
}

function expectWebp(url: string) {
  const file = readPublicAsset(url);
  expect(file.length, `${url} payload`).toBeGreaterThan(32);
  expect(file.subarray(0, 4).toString('ascii'), `${url} RIFF header`).toBe('RIFF');
  expect(file.subarray(8, 12).toString('ascii'), `${url} WEBP header`).toBe('WEBP');
}

describe('Roosevelt visual assets', () => {
  it('keeps the generated environment atlas and stable character crops checked in as WebP', () => {
    expectWebp(ROOSEVELT_GENERATED_PROP_SHEET.url);
    expect(ROOSEVELT_GENERATED_PROP_SHEET.frameWidth).toBeGreaterThan(0);
    expect(ROOSEVELT_GENERATED_PROP_SHEET.frameHeight).toBeGreaterThan(0);
    expect(ROOSEVELT_GENERATED_PROP_SHEET.endFrame).toBe(5);

    expect(ROOSEVELT_IMAGE_ASSETS).toHaveLength(4);
    for (const [, url] of ROOSEVELT_IMAGE_ASSETS) expectWebp(url);
  });

  it('keeps a distinct checked-in floor texture for every production map', () => {
    expect(new Set(Object.values(ROOSEVELT_FLOOR_TEXTURE_BY_MAP)).size).toBe(3);
    for (const url of Object.values(ROOSEVELT_FLOOR_TEXTURE_BY_MAP)) expectWebp(url);
  });
});
