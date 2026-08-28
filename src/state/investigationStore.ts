import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clues, witnesses } from '../data/caseData';
import { getNarrativeLine } from '../narrative/runtime';
import { addUnique } from '../domain/progression';

type InterviewLine = {
  id: string;
  speaker: 'detective' | 'witness';
  text: string;
};

type WitnessProgress = Record<string, { resistance: number; contradictions: number }>;

type InvestigationState = {
  discoveredClueIds: string[];
  selectedWitnessId: string | null;
  detectiveThought: string;
  muted: boolean;
  witnessProgress: WitnessProgress;
  transcripts: Record<string, InterviewLine[]>;
  discoverClue: (clueId: string) => void;
  selectWitness: (witnessId: string | null) => void;
  toggleMute: () => void;
  addInterviewExchange: (witnessId: string, question: string, answer: string, resistanceDelta?: number, contradictionDelta?: number) => void;
  resetCase: () => void;
};

const initialProgress: WitnessProgress = Object.fromEntries(
  witnesses.map((witness) => [witness.id, { resistance: witness.resistance, contradictions: 0 }]),
);

export const useInvestigationStore = create<InvestigationState>()(
  persist(
    (set) => ({
      discoveredClueIds: [],
      selectedWitnessId: null,
      detectiveThought: 'Room 307 is sealed. Start with what the room can tell you.',
      muted: false,
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
      addInterviewExchange: (witnessId, question, answer, resistanceDelta = 0, contradictionDelta = 0) =>
        set((state) => {
          const current = state.witnessProgress[witnessId] ?? { resistance: 50, contradictions: 0 };
          const nextResistance = Math.max(0, Math.min(100, current.resistance + resistanceDelta));
          const oldTranscript = state.transcripts[witnessId] ?? [];
          return {
            transcripts: {
              ...state.transcripts,
              [witnessId]: [
                ...oldTranscript,
                { id: crypto.randomUUID(), speaker: 'detective', text: question },
                { id: crypto.randomUUID(), speaker: 'witness', text: answer },
              ],
            },
            witnessProgress: {
              ...state.witnessProgress,
              [witnessId]: {
                resistance: nextResistance,
                contradictions: current.contradictions + contradictionDelta,
              },
            },
          };
        }),
      resetCase: () =>
        set({
          discoveredClueIds: [],
          selectedWitnessId: null,
          detectiveThought: 'Room 307 is sealed. Start with what the room can tell you.',
          witnessProgress: initialProgress,
          transcripts: {},
        }),
    }),
    {
      name: 'hotel-nocturne-case-307',
      partialize: (state) => ({
        discoveredClueIds: state.discoveredClueIds,
        muted: state.muted,
        witnessProgress: state.witnessProgress,
        transcripts: state.transcripts,
      }),
    },
  ),
);

