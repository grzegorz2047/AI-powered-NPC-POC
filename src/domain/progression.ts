import { suggestedQuestions } from '../data/caseData';

export type WitnessProgressSnapshot = {
  resistance: number;
  contradictions: number;
  contradictionIds?: string[];
};

export function availableQuestions(witnessId: string, clueIds: string[]) {
  return suggestedQuestions.filter((question) => {
    if (question.witnessId !== witnessId) return false;
    return (question.requiresClues ?? []).every((required) => clueIds.includes(required));
  });
}

export function questionsUnlockedByClue(clueId: string, clueIds: string[]) {
  const discoveryIndex = new Map(clueIds.map((id, index) => [id, index]));

  return suggestedQuestions.filter((question) => {
    const requirements = question.requiresClues ?? [];
    if (!requirements.length || !requirements.includes(clueId)) return false;
    if (!requirements.every((required) => discoveryIndex.has(required))) return false;

    const trigger = requirements.reduce((latest, current) => {
      const latestIndex = discoveryIndex.get(latest) ?? -1;
      const currentIndex = discoveryIndex.get(current) ?? -1;
      return currentIndex > latestIndex ? current : latest;
    });
    return trigger === clueId;
  });
}

export function applyWitnessEffects(
  current: WitnessProgressSnapshot,
  effects: { resistanceDelta?: number; contradictionDelta?: number; contradictionId?: string },
): Required<WitnessProgressSnapshot> {
  const contradictionIds = [...(current.contradictionIds ?? [])];
  const contradictionDelta = effects.contradictionDelta ?? 0;
  const contradictionId = effects.contradictionId;
  const isNewContradiction = contradictionDelta > 0 && (!contradictionId || !contradictionIds.includes(contradictionId));

  if (isNewContradiction && contradictionId) contradictionIds.push(contradictionId);

  return {
    resistance: Math.max(0, Math.min(100, current.resistance + (effects.resistanceDelta ?? 0))),
    contradictions: current.contradictions + (isNewContradiction ? contradictionDelta : 0),
    contradictionIds,
  };
}

export function addUnique<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}
