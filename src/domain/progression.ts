import { suggestedQuestions } from '../data/caseData';

export function availableQuestions(witnessId: string, clueIds: string[]) {
  return suggestedQuestions.filter((question) => {
    if (question.witnessId !== witnessId) return false;
    return (question.requiresClues ?? []).every((required) => clueIds.includes(required));
  });
}

export function addUnique<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}
