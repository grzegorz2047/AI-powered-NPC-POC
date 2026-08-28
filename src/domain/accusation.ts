export const ACCUSATION_MOTIVES = [
  { id: 'financial-exposure', label: 'Silence exposure of financial wrongdoing' },
  { id: 'personal-dispute', label: 'Escalating personal dispute' },
  { id: 'cover-minor-theft', label: 'Cover up a separate theft' },
  { id: 'professional-retaliation', label: 'Professional retaliation' },
] as const;

export const ACCUSATION_METHODS = [
  { id: 'blunt-hotel-object', label: 'Blunt-force attack with a hotel object' },
  { id: 'poisoned-whisky', label: 'Poisoning through the whisky' },
  { id: 'accidental-fall', label: 'Accidental fall during an argument' },
  { id: 'unknown-method', label: 'Method not established' },
] as const;

export type AccusationMotiveId = (typeof ACCUSATION_MOTIVES)[number]['id'];
export type AccusationMethodId = (typeof ACCUSATION_METHODS)[number]['id'];

type TranscriptLineLike = { speaker?: string };
type TranscriptRecord = Record<string, TranscriptLineLike[] | undefined>;

export function accusationReadiness(
  discoveredClueIds: string[],
  transcripts: TranscriptRecord,
  witnessIds: string[],
) {
  const interviewedWitnessIds = witnessIds.filter((id) =>
    (transcripts[id] ?? []).some((line) => line.speaker === 'witness'),
  );
  const missingWitnessIds = witnessIds.filter((id) => !interviewedWitnessIds.includes(id));
  const minimumEvidence = 4;
  const missingEvidenceCount = Math.max(0, minimumEvidence - discoveredClueIds.length);

  return {
    ready: missingEvidenceCount === 0 && missingWitnessIds.length === 0,
    interviewedWitnessIds,
    missingWitnessIds,
    missingEvidenceCount,
    minimumEvidence,
  };
}

export function evaluateAccusation(input: {
  suspectId: string;
  motiveId: string;
  methodId: string;
  selectedEvidenceIds: string[];
  discoveredClueIds: string[];
}) {
  const selected = new Set(input.selectedEvidenceIds);
  const discovered = new Set(input.discoveredClueIds);
  const coreEvidence = ['keycard-log', 'burnt-ledger', 'brass-heron', 'cctv-still'];
  const hasCorrectedTimeline = discovered.has('cctv-note') && selected.has('cctv-still');
  const evidenceChainComplete = coreEvidence.every((id) => selected.has(id)) && hasCorrectedTimeline;

  const correct =
    input.suspectId === 'marek' &&
    input.motiveId === 'financial-exposure' &&
    input.methodId === 'blunt-hotel-object' &&
    evidenceChainComplete;

  return {
    correct,
    evidenceChainComplete,
    hasCorrectedTimeline,
  };
}
