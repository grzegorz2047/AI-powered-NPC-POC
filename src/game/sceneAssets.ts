import { clues, witnesses } from '../data/caseData';
import detectiveTexture from './generatedTextures/characterDetective';
import irenaTexture from './generatedTextures/characterIrena';
import {
  character_kamil as kamilTexture,
  character_marek as marekTexture,
  character_nina as ninaTexture,
} from './generatedTextures/charactersRemaining';
import {
  floor_guest as floorGuestTexture,
  floor_lobby as floorLobbyTexture,
  floor_service as floorServiceTexture,
} from './generatedTextures/floors';
import { laundry as laundryTexture } from './generatedTextures/laundry';
import { reception as receptionTexture } from './generatedTextures/reception';
import { elevator as elevatorTexture, stairs as stairsTexture } from './generatedTextures/verticalModules';
import {
  wall_door307 as room307Texture,
  wall_ne as wallNeTexture,
  wall_nw as wallNwTexture,
} from './generatedTextures/walls';
import type { WorldMapId } from './worldManifest';

export const SCENE_SVG_ASSETS = [
  ['detective', '/assets/scene/detective.svg'],
  ['npc-kamil', '/assets/scene/npc-kamil.svg'],
  ['npc-nina', '/assets/scene/npc-nina.svg'],
  ['npc-irena', '/assets/scene/npc-irena.svg'],
  ['npc-marek', '/assets/scene/npc-marek.svg'],
  ['prop-reception', '/assets/scene/prop-reception.svg'],
  ['prop-door307', '/assets/scene/prop-door307.svg'],
  ['prop-cctv', '/assets/scene/prop-cctv.svg'],
  ['prop-cctv-console', '/assets/scene/prop-cctv-console.svg'],
  ['prop-cart', '/assets/scene/prop-cart.svg'],
  ['prop-luggage-cart', '/assets/scene/prop-luggage-cart.svg'],
  ['prop-laundry', '/assets/scene/prop-laundry.svg'],
  ['prop-window', '/assets/scene/prop-window.svg'],
  ['prop-elevator', '/assets/scene/prop-elevator.svg'],
  ['prop-wall-lamp', '/assets/scene/prop-wall-lamp.svg'],
  ['prop-wall-clock', '/assets/scene/prop-wall-clock.svg'],
  ['prop-plant', '/assets/scene/prop-plant.svg'],
  ['prop-painting', '/assets/scene/prop-painting.svg'],
  ['prop-room-door-305', '/assets/scene/prop-room-door-305.svg'],
  ['prop-room-door-309', '/assets/scene/prop-room-door-309.svg'],
  ['clue-whisky', '/assets/scene/clue-whisky.svg'],
  ['clue-keycard', '/assets/scene/clue-keycard.svg'],
  ['clue-cctv-note', '/assets/scene/clue-cctv-note.svg'],
  ['clue-fiber', '/assets/scene/clue-fiber.svg'],
  ['clue-ledger', '/assets/scene/clue-ledger.svg'],
  ['clue-heron', '/assets/scene/clue-heron.svg'],
  ['clue-cctv-still', '/assets/scene/clue-cctv-still.svg'],
] as const;

/**
 * Production Roosevelt assets cut from the generated high-resolution sheets.
 * All character sprites are normalized to a shared bottom-center foot anchor;
 * all architecture sprites are pre-normalized to the display aspect ratios used by Phaser.
 */
export const ROOSEVELT_IMAGE_ASSETS = [
  ['runtime-detective', detectiveTexture],
  ['runtime-kamil', kamilTexture],
  ['runtime-nina', ninaTexture],
  ['runtime-irena', irenaTexture],
  ['runtime-marek', marekTexture],
  ['runtime-reception', receptionTexture],
  ['runtime-room307', room307Texture],
  ['runtime-elevator', elevatorTexture],
  ['runtime-stairs', stairsTexture],
  ['runtime-laundry', laundryTexture],
  ['runtime-wall-nw', wallNwTexture],
  ['runtime-wall-ne', wallNeTexture],
] as const;

export const ROOSEVELT_FLOOR_TEXTURE_BY_MAP: Record<Exclude<WorldMapId, 'prototype-room-307'>, string> = {
  'roosevelt-lobby': floorLobbyTexture,
  'roosevelt-floor-3': floorGuestTexture,
  'roosevelt-basement': floorServiceTexture,
};

export const ROOSEVELT_WALL_TEXTURES_BY_MAP: Record<Exclude<WorldMapId, 'prototype-room-307'>, { nw: string; ne: string }> = {
  'roosevelt-lobby': { nw: 'runtime-wall-nw', ne: 'runtime-wall-ne' },
  'roosevelt-floor-3': { nw: 'runtime-wall-nw', ne: 'runtime-wall-ne' },
  'roosevelt-basement': { nw: 'runtime-wall-nw', ne: 'runtime-wall-ne' },
};

export const ROOSEVELT_PLAYER_TEXTURE = 'runtime-detective';

export const ROOSEVELT_WITNESS_TEXTURE_BY_ID: Record<string, string> = {
  kamil: 'runtime-kamil',
  nina: 'runtime-nina',
  irena: 'runtime-irena',
  marek: 'runtime-marek',
};

export const CLUE_TEXTURE_BY_ID: Record<string, string> = {
  'whisky-glass': 'clue-whisky',
  'keycard-log': 'clue-keycard',
  'cctv-note': 'clue-cctv-note',
  'green-fiber': 'clue-fiber',
  'burnt-ledger': 'clue-ledger',
  'brass-heron': 'clue-heron',
  'cctv-still': 'clue-cctv-still',
};

// The prototype room keeps its light-weight SVG actors. Roosevelt uses the generated mapping above.
export const WITNESS_TEXTURE_BY_ID: Record<string, string> = {
  kamil: 'npc-kamil',
  nina: 'npc-nina',
  irena: 'npc-irena',
  marek: 'npc-marek',
};

export function validateSceneAssetManifest() {
  const missingClues = clues.filter((clue) => !CLUE_TEXTURE_BY_ID[clue.id]).map((clue) => clue.id);
  const missingWitnesses = witnesses.filter((witness) => !WITNESS_TEXTURE_BY_ID[witness.id]).map((witness) => witness.id);
  return { missingClues, missingWitnesses };
}
