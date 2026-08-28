import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROOSEVELT_FLOOR_TEXTURE_BY_MAP, ROOSEVELT_GENERATED_SHEETS } from './sceneAssets';

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

describe('Roosevelt generated art', () => {
  it('keeps both generated runtime atlases checked in as WebP', () => {
    expect(Object.values(ROOSEVELT_GENERATED_SHEETS)).toHaveLength(2);
    for (const sheet of Object.values(ROOSEVELT_GENERATED_SHEETS)) {
      expectWebp(sheet.url);
      expect(sheet.frameWidth).toBeGreaterThan(0);
      expect(sheet.frameHeight).toBeGreaterThan(0);
    }
  });

  it('keeps a distinct checked-in floor texture for every production map', () => {
    expect(new Set(Object.values(ROOSEVELT_FLOOR_TEXTURE_BY_MAP)).size).toBe(3);
    for (const url of Object.values(ROOSEVELT_FLOOR_TEXTURE_BY_MAP)) expectWebp(url);
  });
});
