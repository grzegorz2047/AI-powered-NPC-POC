import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clues, witnesses } from '../data/caseData';
import type { InterviewPressure } from '../domain/npcPolicy';
import { addUnique, applyWitnessEffects, type WitnessProgressSnapshot } from '../domain/progression';
import { getNarrativeLine } from '../narrative/runtime';

type InterviewLine = {
  id: string;
  speaker: 'detective' | 'witness';
  text: string;
  pressure?: InterviewPressure;
};

type WitnessProgress = Record<string, Required<WitnessProgressSnapshot>>;

type ExchangeEffects = {
  resistanceDelta?: number;
  contradictionDelta?: number;
  contradictionId?: string;
  pressure?: InterviewPressure;
};

type InvestigationState = {
  discoveredClueIds: string[];
  selectedWitnessId: string | null;
  detectiveThought: string;
  muted: boolean;
  soundEnabled: boolean;
  notebookOpen: boolean;
  witnessProgress: WitnessProgress;
  transcripts: Record<string, InterviewLine[]>;
  discoverClue: (clueId: string) => void;
  selectWitness: (witnessId: string | null) => void;
  toggleMute: () => void;
  toggleSound: () => void;
  setNotebookOpen: (open: boolean) => void;
  addInterviewExchange: (witnessId: string, question: string, answer: string, effects?: ExchangeEffects) => void;
  resetCase: () => void;
};

const initialProgress: WitnessProgress = Object.fromEntries(
  witnesses.map((witness) => [witness.id, { resistance: witness.resistance, contradictions: 0, contradictionIds: [] }]),
);

export const useInvestigationStore = create<InvestigationState>()(
  persist(
    (set) => ({
      discoveredClueIds: [],
      selectedWitnessId: null,
      detectiveThought: 'Room 307 is sealed. Start with what the room can tell you.',
      muted: false,
      soundEnabled: true,
      notebookOpen: false,
      witnessProgress: initialProgress,
      transcripts: {},
      discoverClue: (clueId) => {
        const clue = clues.find((item) => item.id === clueId);
        if (!clue) return;
        set((state) => ({
          discoveredClueIds: addUnique(state.discoveredClueIds, clueId),
          detectiveThought: getNarrativeLine(clue.thoughtPath),
        }));
      },
      selectWitness: (selectedWitnessId) => set({ selectedWitnessId }),
      toggleMute: () => set((state) => ({ muted: !state.muted })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setNotebookOpen: (notebookOpen) => set({ notebookOpen }),
      addInterviewExchange: (witnessId, question, answer, effects = {}) =>
        set((state) => {
          const current = state.witnessProgress[witnessId] ?? { resistance: 50, contradictions: 0, contradictionIds: [] };
          const nextProgress = applyWitnessEffects(current, effects);
          const oldTranscript = state.transcripts[witnessId] ?? [];
          return {
            transcripts: {
              ...state.transcripts,
              [witnessId]: [
                ...oldTranscript,
                { id: crypto.randomUUID(), speaker: 'detective', text: question, pressure: effects.pressure ?? 'neutral' },
                { id: crypto.randomUUID(), speaker: 'witness', text: answer },
              ],
            },
            witnessProgress: {
              ...state.witnessProgress,
              [witnessId]: nextProgress,
            },
          };
        }),
      resetCase: () =>
        set({
          discoveredClueIds: [],
          selectedWitnessId: null,
          detectiveThought: 'Room 307 is sealed. Start with what the room can tell you.',
          notebookOpen: false,
          witnessProgress: initialProgress,
          transcripts: {},
        }),
    }),
    {
      name: 'hotel-nocturne-case-307',
      partialize: (state) => ({
        discoveredClueIds: state.discoveredClueIds,
        muted: state.muted,
        soundEnabled: state.soundEnabled,
        witnessProgress: state.witnessProgress,
        transcripts: state.transcripts,
      }),
    },
  ),
);
