export type InterviewPressure = 'empathy' | 'neutral' | 'confront';

export type NpcPolicyRequest = {
  witnessId: string;
  question: string;
  evidenceIds: string[];
  resistance: number;
  contradictions: number;
  pressure?: InterviewPressure;
};

export type NpcPolicyResult = {
  answer: string;
  resistanceDelta: number;
  contradictionDelta: number;
  contradictionId?: string;
  allowedFacts: string[];
};

export type AllowedNpcPrompt = {
  witnessId: string;
  witnessName: string;
  persona: string;
  question: string;
  pressure: InterviewPressure;
  resistance: number;
  allowedFacts: string[];
  fallbackAnswer: string;
};

export const npcProfiles: Record<string, { name: string; persona: string }> = {
  kamil: { name: 'Kamil', persona: 'talkative bartender, nervous, informal, hiding a stolen bottle' },
  nina: { name: 'Nina', persona: 'professional receptionist, careful, worried about her job' },
  irena: { name: 'Irena', persona: 'frightened housekeeper, defensive, responds to empathy' },
  marek: { name: 'Marek', persona: 'calm hotel manager, controlling, evasive under pressure' },
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function pressureOf(body: NpcPolicyRequest): InterviewPressure {
  return body.pressure ?? 'neutral';
}

export function evaluateNpcPolicy(body: NpcPolicyRequest): NpcPolicyResult {
  const witnessId = body.witnessId;
  const evidence = new Set(body.evidenceIds);
  const q = body.question.toLowerCase();
  const contradictions = body.contradictions;
  const resistance = body.resistance;
  const pressure = pressureOf(body);

  if (witnessId === 'kamil') {
    if (includesAny(q, ['whisky', 'drink', 'poison']) && evidence.has('whisky-glass')) {
      const pushedTooHard = pressure === 'confront';
      return {
        answer: pushedTooHard
          ? 'I poured the whisky. That is all. He was alive when I left, so stop trying to make the bottle into a murder weapon.'
          : 'I poured the whisky, yes. Nothing else. Rylski was alive and angry when I left. The missing bottle is another matter.',
        resistanceDelta: pushedTooHard ? 2 : -6,
        contradictionDelta: 0,
        allowedFacts: ['Kamil delivered whisky at 22:03', 'Rylski was alive when Kamil left', 'Kamil stole a bottle from the bar'],
      };
    }
    if (includesAny(q, ['last see', 'alive', 'when'])) {
      return {
        answer: 'A little after ten. I brought whisky and ice to 307. He was alive, on the phone, and in a hurry to get rid of me.',
        resistanceDelta: pressure === 'confront' ? 1 : pressure === 'empathy' ? -5 : -4,
        contradictionDelta: 0,
        allowedFacts: ['Kamil delivered whisky at 22:03', 'Rylski was alive when Kamil left'],
      };
    }
    return { answer: 'I was working the bar. Ask me something specific and I will tell you what I actually saw.', resistanceDelta: pressure === 'confront' ? 2 : 0, contradictionDelta: 0, allowedFacts: ['Kamil worked the bar that night'] };
  }

  if (witnessId === 'nina') {
    if (includesAny(q, ['m-01', 'master', 'card']) && evidence.has('keycard-log')) {
      if (pressure === 'confront' && resistance >= 45) {
        return {
          answer: 'The record identifies M-01 as a management master card. I will not speculate about who physically carried it while you are treating me like a suspect.',
          resistanceDelta: 5,
          contradictionDelta: 0,
          allowedFacts: ['M-01 is the hotel manager master card', 'Nina fears retaliation'],
        };
      }
      return {
        answer: 'M-01 is the manager master card. Mr Wolski normally keeps it on him. Please do not make me repeat that in front of him.',
        resistanceDelta: pressure === 'empathy' ? -10 : -8,
        contradictionDelta: 1,
        contradictionId: 'nina-m01-owner',
        allowedFacts: ['M-01 belongs to the hotel manager', 'Nina fears retaliation'],
      };
    }
    if (includesAny(q, ['return', 'lobby', 'when']) && evidence.has('keycard-log')) {
      if (pressure === 'confront' && resistance >= 45) {
        return { answer: 'I was working the desk, not tracking every movement in the lobby. I am not comfortable guessing for you.', resistanceDelta: 4, contradictionDelta: 0, allowedFacts: ['Nina handled reception records'] };
      }
      return {
        answer: 'I did not see Mr Wolski at the desk for a while. He was back sometime after half past ten.',
        resistanceDelta: pressure === 'empathy' ? -8 : -5,
        contradictionDelta: 1,
        contradictionId: 'nina-wolski-return',
        allowedFacts: ['Wolski returned to the lobby after 22:30'],
      };
    }
    return { answer: 'I can confirm check-ins and desk records. I would rather not speculate beyond them.', resistanceDelta: pressure === 'confront' ? 3 : 1, contradictionDelta: 0, allowedFacts: ['Nina handled reception records'] };
  }

  if (witnessId === 'irena') {
    const reassured = resistance <= 60;
    if (includesAny(q, ['green', 'cloth', 'carrying', 'wrapped']) && evidence.has('green-fiber')) {
      if (pressure === 'confront') {
        return { answer: 'I already told you I was doing my rooms. If you accuse me, I am done talking.', resistanceDelta: 8, contradictionDelta: 0, allowedFacts: ['Irena was working the third floor'] };
      }
      if (!reassured) {
        return {
          answer: 'I saw someone come away from that end of the corridor carrying something wrapped in green cloth. I do not want to name anyone yet.',
          resistanceDelta: pressure === 'empathy' ? -16 : -7,
          contradictionDelta: 0,
          allowedFacts: ['Irena saw someone carrying a wrapped object near room 307', 'The wrapping looked like a green hotel cloth'],
        };
      }
      return {
        answer: 'I saw Mr Wolski near 307. He had something long and heavy wrapped in a green service cloth. I was scared to say it before.',
        resistanceDelta: pressure === 'empathy' ? -12 : -7,
        contradictionDelta: 1,
        contradictionId: 'irena-wolski-wrapped-object',
        allowedFacts: ['Irena saw Wolski carrying a wrapped heavy object from room 307', 'The wrapping looked like a green hotel cloth'],
      };
    }
    if (includesAny(q, ['hear', 'noise', 'argument', '307'])) {
      if (pressure === 'confront') {
        return { answer: 'I heard raised voices. That is all I am saying while you talk to me like this.', resistanceDelta: 8, contradictionDelta: 0, allowedFacts: ['Irena heard two men arguing near 307'] };
      }
      if (!reassured) {
        return {
          answer: 'There were two men arguing behind the door. I kept walking. I did not want trouble.',
          resistanceDelta: pressure === 'empathy' ? -14 : -5,
          contradictionDelta: 0,
          allowedFacts: ['Irena heard two men arguing near 307'],
        };
      }
      return {
        answer: 'Voices. Two men arguing behind the door. One of them sounded like the manager, but I did not want trouble.',
        resistanceDelta: pressure === 'empathy' ? -9 : -6,
        contradictionDelta: 0,
        allowedFacts: ['Irena heard two men arguing near 307', 'One voice sounded like Wolski'],
      };
    }
    return { answer: 'I was doing my rooms. I do not want to accuse anyone because of something I half-heard.', resistanceDelta: pressure === 'confront' ? 7 : pressure === 'empathy' ? -6 : 1, contradictionDelta: 0, allowedFacts: ['Irena was working the third floor'] };
  }

  if (witnessId === 'marek') {
    const strongContradictions = contradictions >= 3;
    const breaking = strongContradictions && resistance <= 65;
    const weaponQuestion = evidence.has('brass-heron') || includesAny(q, ['heron', 'weapon']);

    if (strongContradictions && weaponQuestion && includesAny(q, ['kill', 'murder', 'killed', 'confess', 'heron', 'weapon'])) {
      if (!breaking) {
        return {
          answer: 'You have collected a few awkward details. That is not the same thing as proving murder. If you want me to break, you will need more than volume.',
          resistanceDelta: pressure === 'confront' ? -8 : -2,
          contradictionDelta: 0,
          allowedFacts: ['Marek acknowledges the evidence creates pressure but still denies murder'],
        };
      }
      return {
        answer: 'He said he would publish everything. I only meant to stop him, not kill him. Then I panicked and tried to make the room tell a different story.',
        resistanceDelta: -25,
        contradictionDelta: 0,
        allowedFacts: ['Marek admits confronting Rylski', 'Marek admits the fatal blow and staging the scene'],
      };
    }

    if (includesAny(q, ['kill', 'murder', 'killed', 'confess'])) {
      return { answer: 'No. And if that is all you have, detective, you are wasting both our time.', resistanceDelta: pressure === 'confront' ? 4 : 5, contradictionDelta: 0, allowedFacts: ['Marek denies killing Rylski'] };
    }
    if (includesAny(q, ['m-01', 'card', '22:17']) && evidence.has('keycard-log')) {
      return {
        answer: 'Master cards are used by staff. A log entry does not put me inside that room.',
        resistanceDelta: pressure === 'confront' ? -10 : pressure === 'empathy' ? 2 : -3,
        contradictionDelta: 1,
        contradictionId: 'marek-keycard',
        allowedFacts: ['Marek claims the master card log does not prove he personally entered'],
      };
    }
    if (includesAny(q, ['camera', '22:27', 'six minute', 'timestamp']) && evidence.has('cctv-note') && evidence.has('cctv-still')) {
      return {
        answer: 'A blurred corridor image proves very little. You are building a story around a clock fault.',
        resistanceDelta: pressure === 'confront' ? -12 : pressure === 'empathy' ? 1 : -6,
        contradictionDelta: 1,
        contradictionId: 'marek-corrected-cctv',
        allowedFacts: ['Marek disputes the identification in the corrected CCTV timeline'],
      };
    }
    if (includesAny(q, ['ledger', 'baltic', 'burn']) && evidence.has('burnt-ledger')) {
      return {
        answer: 'Baltic North was a contractor. Rylski saw corruption everywhere. I had no reason to burn his papers.',
        resistanceDelta: pressure === 'confront' ? -12 : pressure === 'empathy' ? 2 : -7,
        contradictionDelta: 1,
        contradictionId: 'marek-ledger',
        allowedFacts: ['Marek knew Baltic North Facilities', 'Marek denies burning the ledger'],
      };
    }
    if (includesAny(q, ['where', 'alibi', '22:17'])) {
      return { answer: 'I was in the service area dealing with a maintenance problem. Staff can confirm I was working that evening.', resistanceDelta: pressure === 'confront' ? 3 : 1, contradictionDelta: 0, allowedFacts: ['Marek claims he was in the service area at 22:17'] };
    }
    return { answer: 'You are asking broad questions about a chaotic night. Bring me something concrete.', resistanceDelta: pressure === 'confront' ? 3 : 2, contradictionDelta: 0, allowedFacts: ['Marek remains guarded'] };
  }

  return { answer: 'I cannot help you with that.', resistanceDelta: 0, contradictionDelta: 0, allowedFacts: [] };
}

export function buildAllowedNpcPrompt(body: NpcPolicyRequest, result: NpcPolicyResult): AllowedNpcPrompt {
  const profile = npcProfiles[body.witnessId] ?? { name: 'Witness', persona: 'careful witness' };
  return {
    witnessId: body.witnessId,
    witnessName: profile.name,
    persona: profile.persona,
    question: body.question,
    pressure: pressureOf(body),
    resistance: body.resistance,
    allowedFacts: result.allowedFacts,
    fallbackAnswer: result.answer,
  };
}

export function allowedNpcSystemPrompt(prompt: AllowedNpcPrompt): string {
  return [
    `You are ${prompt.witnessName}, a ${prompt.persona}.`,
    'You are a witness in a detective game. Stay in character.',
    `Current resistance: ${Math.round(prompt.resistance)}/100. Detective approach: ${prompt.pressure}.`,
    'Use only the facts listed below. Never add new case facts, names, times, motives or evidence.',
    `Allowed facts: ${prompt.allowedFacts.join('; ') || 'none'}.`,
    'Reply in 1-3 natural sentences. If the question asks for a fact not allowed, evade or say you do not know.',
  ].join('\n');
}

export function allowedPromptToText(prompt: AllowedNpcPrompt): string {
  return [
    allowedNpcSystemPrompt(prompt),
    `Detective: ${prompt.question}`,
    `${prompt.witnessName}:`,
  ].join('\n');
}
