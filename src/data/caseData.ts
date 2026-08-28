export type ClueStrength = 'circumstantial' | 'supporting' | 'decisive';
export type Pressure = 'empathy' | 'neutral' | 'confront';

export type Clue = {
  id: string;
  title: string;
  description: string;
  tooltip: string;
  thoughtPath: string;
  strength: ClueStrength;
  tileX: number;
  tileY: number;
};

export type Witness = {
  id: string;
  name: string;
  role: string;
  resistance: number;
  profile: string;
  tileX: number;
  tileY: number;
};

export type SuggestedQuestion = {
  id: string;
  witnessId: string;
  text: string;
  pressure: Pressure;
  requiresClues?: string[];
};

export const clues: Clue[] = [
  {
    id: 'whisky-glass',
    title: 'Broken whisky glass',
    description: 'The glass is broken near the desk. Nothing suggests poison.',
    tooltip: 'A sharp smell of whisky. The glass broke before anyone cleaned the room.',
    thoughtPath: 'clue_whisky',
    strength: 'circumstantial',
    tileX: 4,
    tileY: 3,
  },
  {
    id: 'keycard-log',
    title: 'Master keycard log',
    description: 'M-01 opened room 307 at 22:17.',
    tooltip: 'A printed access log with one entry circled by hand.',
    thoughtPath: 'clue_keycard',
    strength: 'decisive',
    tileX: 2,
    tileY: 2,
  },
  {
    id: 'cctv-note',
    title: 'CCTV service note',
    description: 'The service corridor camera runs six minutes fast.',
    tooltip: 'A maintenance note taped beneath the monitor.',
    thoughtPath: 'clue_cctv_note',
    strength: 'supporting',
    tileX: 7,
    tileY: 1,
  },
  {
    id: 'green-fiber',
    title: 'Green fiber',
    description: 'A green thread caught on the handle of room 307.',
    tooltip: 'One green fiber shines against the dark brass handle.',
    thoughtPath: 'clue_fiber',
    strength: 'supporting',
    tileX: 5,
    tileY: 2,
  },
  {
    id: 'burnt-ledger',
    title: 'Burnt ledger fragment',
    description: 'The surviving line names Baltic North Facilities and a large transfer.',
    tooltip: 'Most of the page is ash, but one company name survived.',
    thoughtPath: 'clue_ledger',
    strength: 'decisive',
    tileX: 8,
    tileY: 4,
  },
  {
    id: 'brass-heron',
    title: 'Brass heron statuette',
    description: 'Heavy, recently wiped, hidden in a laundry basket.',
    tooltip: 'A hotel decoration that does not belong in the laundry room.',
    thoughtPath: 'clue_heron',
    strength: 'decisive',
    tileX: 7,
    tileY: 5,
  },
  {
    id: 'cctv-still',
    title: 'CCTV still',
    description: 'A suited figure crosses the service corridor at camera time 22:33.',
    tooltip: 'The silhouette is familiar, but the timestamp needs context.',
    thoughtPath: 'clue_cctv_still',
    strength: 'supporting',
    tileX: 8,
    tileY: 1,
  },
];

export const witnesses: Witness[] = [
  {
    id: 'kamil',
    name: 'Kamil Nowak',
    role: 'Bartender',
    resistance: 25,
    profile: 'Talkative and nervous. Hides a minor theft, not murder.',
    tileX: 1,
    tileY: 5,
  },
  {
    id: 'nina',
    name: 'Nina Sokolowska',
    role: 'Receptionist',
    resistance: 50,
    profile: 'Professional and careful. Afraid of losing her job.',
    tileX: 2,
    tileY: 6,
  },
  {
    id: 'irena',
    name: 'Irena Maj',
    role: 'Housekeeper',
    resistance: 70,
    profile: 'Frightened and defensive. Responds better to empathy than pressure.',
    tileX: 6,
    tileY: 6,
  },
  {
    id: 'marek',
    name: 'Marek Wolski',
    role: 'Hotel manager',
    resistance: 90,
    profile: 'Calm, controlling and difficult to corner.',
    tileX: 4,
    tileY: 6,
  },
];

export const suggestedQuestions: SuggestedQuestion[] = [
  { id: 'kamil-last-seen', witnessId: 'kamil', text: 'When did you last see Rylski alive?', pressure: 'neutral' },
  { id: 'kamil-whisky', witnessId: 'kamil', text: 'Did you put anything in the whisky?', pressure: 'confront', requiresClues: ['whisky-glass'] },
  { id: 'nina-card', witnessId: 'nina', text: 'Who owns master card M-01?', pressure: 'neutral', requiresClues: ['keycard-log'] },
  { id: 'nina-return', witnessId: 'nina', text: 'When did Wolski return to the lobby?', pressure: 'empathy', requiresClues: ['keycard-log'] },
  { id: 'irena-noise', witnessId: 'irena', text: 'What did you hear near room 307?', pressure: 'empathy' },
  { id: 'irena-fiber', witnessId: 'irena', text: 'Did you see anyone carrying something wrapped in green cloth?', pressure: 'empathy', requiresClues: ['green-fiber'] },
  { id: 'marek-alibi', witnessId: 'marek', text: 'Where were you at 22:17?', pressure: 'neutral' },
  { id: 'marek-card', witnessId: 'marek', text: 'M-01 opened room 307 at 22:17. Explain that.', pressure: 'confront', requiresClues: ['keycard-log'] },
  { id: 'marek-camera', witnessId: 'marek', text: 'The camera clock is six minutes fast. Your corridor timestamp is 22:27.', pressure: 'confront', requiresClues: ['cctv-note', 'cctv-still'] },
  { id: 'marek-ledger', witnessId: 'marek', text: 'Why was a Baltic North ledger page burned in the service area?', pressure: 'confront', requiresClues: ['burnt-ledger'] },
  { id: 'marek-heron', witnessId: 'marek', text: 'The brass heron was hidden in the laundry basket. Why?', pressure: 'confront', requiresClues: ['brass-heron'] },
];

export const clueById = Object.fromEntries(clues.map((clue) => [clue.id, clue]));
export const witnessById = Object.fromEntries(witnesses.map((witness) => [witness.id, witness]));
