type NpcRequest = {
  witnessId?: string;
  question?: string;
  evidenceIds?: string[];
  resistance?: number;
  contradictions?: number;
};

type RuleResult = {
  answer: string;
  resistanceDelta: number;
  contradictionDelta: number;
  allowedFacts: string[];
};

const profiles: Record<string, { name: string; persona: string }> = {
  kamil: { name: 'Kamil', persona: 'talkative bartender, nervous, informal, hiding a stolen bottle' },
  nina: { name: 'Nina', persona: 'professional receptionist, careful, worried about her job' },
  irena: { name: 'Irena', persona: 'frightened housekeeper, defensive, responds to empathy' },
  marek: { name: 'Marek', persona: 'calm hotel manager, controlling, evasive under pressure' },
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function ruleResponse(body: NpcRequest): RuleResult {
  const witnessId = body.witnessId ?? '';
  const evidence = new Set(body.evidenceIds ?? []);
  const q = (body.question ?? '').toLowerCase();
  const contradictions = body.contradictions ?? 0;

  if (witnessId === 'kamil') {
    if (includesAny(q, ['whisky', 'drink', 'poison']) && evidence.has('whisky-glass')) {
      return { answer: 'I poured the whisky, yes. Nothing else. Rylski was alive and angry when I left. The missing bottle is another matter.', resistanceDelta: -6, contradictionDelta: 0, allowedFacts: ['Kamil delivered whisky at 22:03', 'Rylski was alive when Kamil left', 'Kamil stole a bottle from the bar'] };
    }
    if (includesAny(q, ['last see', 'alive', 'when'])) {
      return { answer: 'A little after ten. I brought whisky and ice to 307. He was alive, on the phone, and in a hurry to get rid of me.', resistanceDelta: -4, contradictionDelta: 0, allowedFacts: ['Kamil delivered whisky at 22:03', 'Rylski was alive when Kamil left'] };
    }
    return { answer: 'I was working the bar. Ask me something specific and I will tell you what I actually saw.', resistanceDelta: 0, contradictionDelta: 0, allowedFacts: ['Kamil worked the bar that night'] };
  }

  if (witnessId === 'nina') {
    if (includesAny(q, ['m-01', 'master', 'card']) && evidence.has('keycard-log')) {
      return { answer: 'M-01 is the manager master card. Mr Wolski normally keeps it on him. Please do not make me repeat that in front of him.', resistanceDelta: -8, contradictionDelta: 1, allowedFacts: ['M-01 belongs to the hotel manager', 'Nina fears retaliation'] };
    }
    if (includesAny(q, ['return', 'lobby', 'when']) && evidence.has('keycard-log')) {
      return { answer: 'I did not see Mr Wolski at the desk for a while. He was back sometime after half past ten.', resistanceDelta: -5, contradictionDelta: 1, allowedFacts: ['Wolski returned to the lobby after 22:30'] };
    }
    return { answer: 'I can confirm check-ins and desk records. I would rather not speculate beyond them.', resistanceDelta: 1, contradictionDelta: 0, allowedFacts: ['Nina handled reception records'] };
  }

  if (witnessId === 'irena') {
    if (includesAny(q, ['green', 'cloth', 'carrying', 'wrapped']) && evidence.has('green-fiber')) {
      return { answer: 'I saw Mr Wolski near 307. He had something long and heavy wrapped in a green service cloth. I was scared to say it before.', resistanceDelta: -12, contradictionDelta: 1, allowedFacts: ['Irena saw Wolski carrying a wrapped heavy object from room 307', 'The wrapping looked like a green hotel cloth'] };
    }
    if (includesAny(q, ['hear', 'noise', 'argument', '307'])) {
      return { answer: 'Voices. Two men arguing behind the door. One of them sounded like the manager, but I did not want trouble.', resistanceDelta: -7, contradictionDelta: 0, allowedFacts: ['Irena heard two men arguing near 307', 'One voice sounded like Wolski'] };
    }
    return { answer: 'I was doing my rooms. I do not want to accuse anyone because of something I half-heard.', resistanceDelta: 1, contradictionDelta: 0, allowedFacts: ['Irena was working the third floor'] };
  }

  if (witnessId === 'marek') {
    const strongContradictions = contradictions >= 3;
    if (includesAny(q, ['kill', 'murder', 'killed', 'confess']) && !strongContradictions) {
      return { answer: 'No. And if that is all you have, detective, you are wasting both our time.', resistanceDelta: 5, contradictionDelta: 0, allowedFacts: ['Marek denies killing Rylski'] };
    }
    if (includesAny(q, ['m-01', 'card', '22:17']) && evidence.has('keycard-log')) {
      return { answer: 'Master cards are used by staff. A log entry does not put me inside that room.', resistanceDelta: -3, contradictionDelta: 1, allowedFacts: ['Marek claims the master card log does not prove he personally entered'] };
    }
    if (includesAny(q, ['camera', '22:27', 'six minute', 'timestamp']) && evidence.has('cctv-note') && evidence.has('cctv-still')) {
      return { answer: 'A blurred corridor image proves very little. You are building a story around a clock fault.', resistanceDelta: -6, contradictionDelta: 1, allowedFacts: ['Marek disputes the identification in the corrected CCTV timeline'] };
    }
    if (includesAny(q, ['ledger', 'baltic', 'burn']) && evidence.has('burnt-ledger')) {
      return { answer: 'Baltic North was a contractor. Rylski saw corruption everywhere. I had no reason to burn his papers.', resistanceDelta: -7, contradictionDelta: 1, allowedFacts: ['Marek knew Baltic North Facilities', 'Marek denies burning the ledger'] };
    }
    if (strongContradictions && (evidence.has('brass-heron') || includesAny(q, ['heron', 'weapon']))) {
      return { answer: 'He said he would publish everything. I only meant to stop him, not kill him. Then I panicked and tried to make the room tell a different story.', resistanceDelta: -25, contradictionDelta: 0, allowedFacts: ['Marek admits confronting Rylski', 'Marek admits the fatal blow and staging the scene'] };
    }
    if (includesAny(q, ['where', 'alibi', '22:17'])) {
      return { answer: 'I was in the service area dealing with a maintenance problem. Staff can confirm I was working that evening.', resistanceDelta: 1, contradictionDelta: 0, allowedFacts: ['Marek claims he was in the service area at 22:17'] };
    }
    return { answer: 'You are asking broad questions about a chaotic night. Bring me something concrete.', resistanceDelta: 2, contradictionDelta: 0, allowedFacts: ['Marek remains guarded'] };
  }

  return { answer: 'I cannot help you with that.', resistanceDelta: 0, contradictionDelta: 0, allowedFacts: [] };
}

async function naturalize(body: NpcRequest, result: RuleResult) {
  const baseUrl = process.env.NPC_LLM_BASE_URL;
  const apiKey = process.env.NPC_LLM_API_KEY;
  const model = process.env.NPC_LLM_MODEL;
  const profile = profiles[body.witnessId ?? ''];
  if (!baseUrl || !model || !profile) return result.answer;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 100,
        messages: [
          {
            role: 'system',
            content: [
              `You are ${profile.name}, a ${profile.persona}.`,
              'You are a witness in a detective game. Stay in character.',
              'Use only the facts listed below. Never add new case facts, names, times, motives or evidence.',
              `Allowed facts: ${result.allowedFacts.join('; ') || 'none'}.`,
              'Reply in 1-3 natural sentences. If the question asks for a fact not allowed, evade or say you do not know.',
            ].join('\n'),
          },
          { role: 'user', content: body.question ?? '' },
        ],
      }),
    });
    if (!response.ok) return result.answer;
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() || result.answer;
  } catch {
    return result.answer;
  }
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const body = await request.json() as NpcRequest;
    if (!body.witnessId || !body.question) {
      return Response.json({ error: 'witnessId and question are required' }, { status: 400 });
    }
    const result = ruleResponse(body);
    const answer = await naturalize(body, result);
    return Response.json({
      answer,
      resistanceDelta: result.resistanceDelta,
      contradictionDelta: result.contradictionDelta,
      mode: process.env.NPC_LLM_BASE_URL && process.env.NPC_LLM_MODEL ? 'llm' : 'rules',
    });
  },
};
