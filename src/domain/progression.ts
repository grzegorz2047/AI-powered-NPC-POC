import { suggestedQuestions } from '../data/caseData';

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

export function addUnique<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}
