import { clues, witnesses } from '../data/caseData';

export const SCENE_SVG_ASSETS = [
  ['detective', '/assets/scene/detective.svg'],
  ['npc-kamil', '/assets/scene/npc-kamil.svg'],
  ['npc-nina', '/assets/scene/npc-nina.svg'],
  ['npc-irena', '/assets/scene/npc-irena.svg'],
  ['npc-marek', '/assets/scene/npc-marek.svg'],
  ['prop-reception', '/assets/scene/prop-reception.svg'],
  ['prop-door307', '/assets/scene/prop-door307.svg'],
  ['prop-cctv', '/assets/scene/prop-cctv.svg'],
  ['prop-cart', '/assets/scene/prop-cart.svg'],
  ['prop-laundry', '/assets/scene/prop-laundry.svg'],
  ['prop-window', '/assets/scene/prop-window.svg'],
  ['clue-whisky', '/assets/scene/clue-whisky.svg'],
  ['clue-keycard', '/assets/scene/clue-keycard.svg'],
  ['clue-cctv-note', '/assets/scene/clue-cctv-note.svg'],
  ['clue-fiber', '/assets/scene/clue-fiber.svg'],
  ['clue-ledger', '/assets/scene/clue-ledger.svg'],
  ['clue-heron', '/assets/scene/clue-heron.svg'],
  ['clue-cctv-still', '/assets/scene/clue-cctv-still.svg'],
] as const;

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
