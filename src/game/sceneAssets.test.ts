import { describe, expect, it } from 'vitest';
import { CLUE_TEXTURE_BY_ID, SCENE_SVG_ASSETS, WITNESS_TEXTURE_BY_ID, validateSceneAssetManifest } from './sceneAssets';

 describe('scene asset manifest', () => {
  it('covers every clue and witness', () => {
    expect(validateSceneAssetManifest()).toEqual({ missingClues: [], missingWitnesses: [] });
  });

  it('uses unique texture keys and maps to registered textures', () => {
    const registered = SCENE_SVG_ASSETS.map(([key]) => key);
    expect(new Set(registered).size).toBe(registered.length);
    expect(Object.values(CLUE_TEXTURE_BY_ID).every((key) => registered.includes(key as (typeof registered)[number]))).toBe(true);
    expect(Object.values(WITNESS_TEXTURE_BY_ID).every((key) => registered.includes(key as (typeof registered)[number]))).toBe(true);
  });

  it('keeps the approved Room 307 reference plate in the runtime manifest', () => {
    expect(SCENE_SVG_ASSETS).toContainEqual([
      'mockup-room307-reference-plate',
      '/assets/scene/mockup-room307-reference-plate.svg',
    ]);
  });
});
