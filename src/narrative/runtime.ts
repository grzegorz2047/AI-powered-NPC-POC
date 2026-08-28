import { Story } from 'inkjs';
import compiledStory from './case.compiled.json';

export function getNarrativeLine(path: string): string {
  try {
    const story = new Story(compiledStory as never);
    story.ChoosePathString(path);
    const lines: string[] = [];
    while (story.canContinue) {
      lines.push(story.Continue().trim());
    }
    return lines.filter(Boolean).join(' ');
  } catch {
    return 'This clue changes the shape of the case.';
  }
}
