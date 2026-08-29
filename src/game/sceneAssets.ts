import { clues, witnesses } from '../data/caseData';
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
  ['mockup-room307-suite', '/assets/scene/mockup-room307-suite.svg'],
  ['wall-hotel-nw', '/assets/roosevelt-wall-nw.svg'],
  ['wall-hotel-ne', '/assets/roosevelt-wall-ne.svg'],
  ['wall-service-nw', '/assets/roosevelt-service-wall-nw.svg'],
  ['wall-service-ne', '/assets/roosevelt-service-wall-ne.svg'],
  ['clue-whisky', '/assets/scene/clue-whisky.svg'],
  ['clue-keycard', '/assets/scene/clue-keycard.svg'],
  ['clue-cctv-note', '/assets/scene/clue-cctv-note.svg'],
  ['clue-fiber', '/assets/scene/clue-fiber.svg'],
  ['clue-ledger', '/assets/scene/clue-ledger.svg'],
  ['clue-heron', '/assets/scene/clue-heron.svg'],
  ['clue-cctv-still', '/assets/scene/clue-cctv-still.svg'],
] as const;

export const ROOSEVELT_IMAGE_ASSETS = [
  ['mockup-detective', '/assets/mockup/detective.webp'],
  ['mockup-kamil', '/assets/mockup/kamil.webp'],
  ['mockup-irena', '/assets/mockup/irena.webp'],
  ['mockup-marek', '/assets/mockup/marek.webp'],
  ['mockup-reception', '/assets/mockup/reception-desk.webp'],
  ['mockup-door307', '/assets/mockup/door-307.webp'],
  ['mockup-elevator', '/assets/mockup/elevator.webp'],
  ['mockup-stairs', '/assets/mockup/stairs.webp'],
  ['mockup-laundry', '/assets/mockup/laundry.webp'],
] as const;

export const ROOSEVELT_FLOOR_TEXTURE_BY_MAP: Record<Exclude<WorldMapId, 'prototype-room-307'>, string> = {
  'roosevelt-lobby': '/assets/mockup/floor-lobby.webp',
  'roosevelt-floor-3': '/assets/mockup/floor-guest.webp',
  'roosevelt-basement': '/assets/mockup/floor-service.webp',
};

export const ROOSEVELT_WALL_TEXTURES_BY_MAP: Record<Exclude<WorldMapId, 'prototype-room-307'>, { nw: string; ne: string }> = {
  'roosevelt-lobby': { nw: 'wall-hotel-nw', ne: 'wall-hotel-ne' },
  'roosevelt-floor-3': { nw: 'wall-hotel-nw', ne: 'wall-hotel-ne' },
  'roosevelt-basement': { nw: 'wall-service-nw', ne: 'wall-service-ne' },
};

export const ROOSEVELT_PLAYER_TEXTURE = 'mockup-detective';

export const ROOSEVELT_WITNESS_TEXTURE_BY_ID: Record<string, string> = {
  kamil: 'mockup-kamil',
  nina: 'npc-nina',
  irena: 'mockup-irena',
  marek: 'mockup-marek',
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
