import { describe, expect, it } from 'vitest';
import { ROOSEVELT_FLOOR_TEXTURE_BY_MAP, ROOSEVELT_IMAGE_ASSETS } from './sceneAssets';

function expectEmbeddedAvif(url: string) {
  const prefix = 'data:image/avif;base64,';
  expect(url.startsWith(prefix), 'generated asset should be an embedded AVIF data URI').toBe(true);
  const file = Buffer.from(url.slice(prefix.length), 'base64');
  expect(file.length, 'AVIF payload').toBeGreaterThan(32);
  expect(file.subarray(4, 8).toString('ascii'), 'ISO BMFF ftyp box').toBe('ftyp');
  expect(file.subarray(8, 12).toString('ascii'), 'AVIF major brand').toBe('avif');
}

describe('Roosevelt production visual assets', () => {
  it('uses generated AVIF characters, architecture and environment props instead of mockup plates', () => {
    expect(ROOSEVELT_IMAGE_ASSETS).toHaveLength(15);
    expect(new Set(ROOSEVELT_IMAGE_ASSETS.map(([key]) => key)).size).toBe(ROOSEVELT_IMAGE_ASSETS.length);
    expect(ROOSEVELT_IMAGE_ASSETS.every(([key]) => key.startsWith('runtime-'))).toBe(true);
    for (const [, url] of ROOSEVELT_IMAGE_ASSETS) expectEmbeddedAvif(url);
  });

  it('keeps a distinct generated floor texture for every production map', () => {
    expect(new Set(Object.values(ROOSEVELT_FLOOR_TEXTURE_BY_MAP)).size).toBe(3);
    for (const url of Object.values(ROOSEVELT_FLOOR_TEXTURE_BY_MAP)) expectEmbeddedAvif(url);
  });
});
