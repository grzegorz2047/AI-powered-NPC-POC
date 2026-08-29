import { describe, expect, it } from 'vitest';
import {
  CLUE_TEXTURE_BY_ID,
  ROOSEVELT_IMAGE_ASSETS,
  SCENE_SVG_ASSETS,
  WITNESS_TEXTURE_BY_ID,
  validateSceneAssetManifest,
} from './sceneAssets';

describe('scene asset manifest', () => {
  it('covers every clue and witness', () => {
    expect(validateSceneAssetManifest()).toEqual({ missingClues: [], missingWitnesses: [] });
  });

  it('uses unique SVG texture keys and maps prototype data to registered textures', () => {
    const registered = SCENE_SVG_ASSETS.map(([key]) => key);
    expect(new Set(registered).size).toBe(registered.length);
    expect(Object.values(CLUE_TEXTURE_BY_ID).every((key) => registered.includes(key as (typeof registered)[number]))).toBe(true);
    expect(Object.values(WITNESS_TEXTURE_BY_ID).every((key) => registered.includes(key as (typeof registered)[number]))).toBe(true);
  });

  it('does not ship mockup/reference plates as Roosevelt runtime textures', () => {
    expect(SCENE_SVG_ASSETS.some(([key]) => key.includes('reference-plate') || key.includes('mockup-room307'))).toBe(false);
    expect(ROOSEVELT_IMAGE_ASSETS.some(([key]) => key.startsWith('mockup-'))).toBe(false);
  });
});
