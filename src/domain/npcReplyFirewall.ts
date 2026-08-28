import type { AllowedNpcPrompt } from './npcPolicy';

export type NpcReplyFirewallDecision =
  | { safe: true }
  | { safe: false; ruleId: string; reason: string };

export type FilteredNpcReply = {
  answer: string;
  rejected: boolean;
  ruleId: string | null;
};

type FirewallRule = {
  id: string;
  signal: RegExp;
  allowedBy: RegExp;
  reason: string;
};

const CANONICAL_TIMES = [
  '21:42', '21:58', '22:03', '22:11', '22:17', '22:19', '22:22',
  '22:23', '22:26', '22:27', '22:31', '22:33', '22:35', '22:41',
];

const INVENTED_EVIDENCE_TERMS = [
  'knife', 'gun', 'pistol', 'bullet', 'gunshot', 'fingerprint', 'fingerprints',
  'dna', 'cyanide', 'chloroform', 'rope', 'shell casing',
];

const FACT_RULES: FirewallRule[] = [
  {
    id: 'marek-confession',
    signal: /\b(?:i|we)\s+(?:did it|killed|murdered|hit him|struck him)\b|\bi only meant to stop\b|\bi panicked\b.{0,80}\b(?:staged?|burned|burnt|hid)\b|\bfatal blow\b|\bstaged the scene\b/i,
    allowedBy: /admits.{0,80}(?:fatal blow|staging|killing|murder)|admits confronting rylski/i,
    reason: 'The reply states or strongly implies the killer confession before that fact is allowed.',
  },
  {
    id: 'named-killer',
    signal: /\b(?:marek|wolski|nina|irena|kamil)\b.{0,60}\b(?:killer|murderer|killed|murdered)\b|\b(?:killer|murderer)\b.{0,60}\b(?:marek|wolski|nina|irena|kamil)\b/i,
    allowedBy: /admits.{0,80}(?:fatal blow|staging|killing|murder)/i,
    reason: 'The reply names a killer without an allowed confession fact.',
  },
  {
    id: 'embezzlement-motive',
    signal: /\bembezzl\w*\b|\bshell company\b|\bstol(?:e|en)\b.{0,40}\brenovation\b|\bskimmed\b.{0,40}\brenovation\b/i,
    allowedBy: /embezzl|shell company|stol(?:e|en).{0,40}renovation|skimmed.{0,40}renovation/i,
    reason: 'The reply reveals the hidden embezzlement motive before it is allowed.',
  },
  {
    id: 'wolski-wrapped-object',
    signal: /\b(?:wolski|marek|manager)\b.{0,90}\b(?:carrying|carried|wrapped|green cloth|heavy object)\b|\b(?:carrying|carried|wrapped|green cloth|heavy object)\b.{0,90}\b(?:wolski|marek|manager)\b/i,
    allowedBy: /saw wolski carrying|wolski.{0,80}wrapped|wrapped heavy object/i,
    reason: 'The reply identifies Wolski with the wrapped object before Irena is allowed to do so.',
  },
  {
    id: 'm01-owner',
    signal: /\bm-?01\b.{0,60}\b(?:belongs?|manager|wolski|master card)\b|\b(?:manager|wolski)\b.{0,60}\bm-?01\b/i,
    allowedBy: /m-?01.{0,80}(?:belongs|manager|master card)|manager.{0,80}m-?01/i,
    reason: 'The reply reveals ownership or management meaning of M-01 before it is allowed.',
  },
  {
    id: 'cctv-correction',
    signal: /\b(?:six|6)\s+minutes?\b|\b22:27\b|\b22:33\b|\bcamera clock\b|\bclock fault\b|\bcctv\b.{0,60}\b(?:wolski|marek|manager)\b/i,
    allowedBy: /corrected cctv|clock fault|(?:six|6)\s+minutes?|22:27|22:33/i,
    reason: 'The reply reveals the corrected CCTV timing or identification before it is allowed.',
  },
  {
    id: 'baltic-ledger',
    signal: /\bbaltic north\b|\bburn(?:ed|t) ledger\b|\bledger fragment\b/i,
    allowedBy: /baltic north|ledger|burn(?:ed|t)/i,
    reason: 'The reply reveals the ledger/company link before it is allowed.',
  },
  {
    id: 'green-cloth',
    signal: /\bgreen\b.{0,24}\bcloth\b|\bcloth\b.{0,24}\bgreen\b/i,
    allowedBy: /green.{0,24}cloth|cloth.{0,24}green/i,
    reason: 'The reply reveals the green service cloth before it is allowed.',
  },
  {
    id: 'brass-heron',
    signal: /\bbrass\b.{0,24}\bheron\b|\bheron\b.{0,40}\b(?:weapon|blood|hit|struck|killed)\b|\b(?:weapon|blood)\b.{0,40}\bheron\b/i,
    allowedBy: /fatal blow|brass.{0,24}heron|heron.{0,40}weapon/i,
    reason: 'The reply links the brass heron to the killing before that connection is allowed.',
  },
  {
    id: 'kamil-bottle-theft',
    signal: /\bmissing bottle\b|\bstol(?:e|en)\b.{0,30}\bbottle\b|\bbottle\b.{0,30}\bstol(?:e|en)\b/i,
    allowedBy: /missing bottle|stol(?:e|en).{0,30}bottle/i,
    reason: 'The reply reveals Kamil\'s bottle theft before it is allowed.',
  },
  {
    id: 'irena-cleaning-theft',
    signal: /\birena\b.{0,50}\b(?:stol(?:e|en)|cleaning supplies)\b|\bcleaning supplies\b.{0,50}\birena\b/i,
    allowedBy: /irena.{0,50}cleaning supplies|cleaning supplies.{0,50}irena/i,
    reason: 'The reply reveals Irena\'s hidden red herring before it is allowed.',
  },
  {
    id: 'victim-phone-call',
    signal: /\btomorrow everything (?:comes|is coming) out\b|\bi have the ledger\b|\bmam ksi[eę]g[eę]\b/i,
    allowedBy: /tomorrow everything|have the ledger|mam ksi[eę]g[eę]/i,
    reason: 'The reply reveals the protected content of the victim\'s phone call.',
  },
  {
    id: 'laundry-disposal',
    signal: /\blaundry\b.{0,50}\b(?:burn|ledger|heron|weapon|bin)\b|\b(?:burn|ledger|heron|weapon)\b.{0,50}\blaundry\b/i,
    allowedBy: /laundry.{0,50}(?:burn|ledger|heron|weapon|bin)|(?:burn|ledger|heron|weapon).{0,50}laundry/i,
    reason: 'The reply reveals the disposal location before it is allowed.',
  },
];

function normalized(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

function allowedSurface(prompt: AllowedNpcPrompt) {
  return normalized([...prompt.allowedFacts, prompt.fallbackAnswer].join(' '));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWholeTerm(text: string, term: string) {
  return new RegExp(`\\b${escapeRegExp(term).replace(/\\ /g, '\\s+')}\\b`, 'i').test(text);
}

export function validateNpcReply(answer: string, prompt: AllowedNpcPrompt): NpcReplyFirewallDecision {
  const text = normalized(answer);
  const allowed = allowedSurface(prompt);

  if (!text) {
    return { safe: false, ruleId: 'empty-reply', reason: 'The model returned an empty reply.' };
  }

  for (const rule of FACT_RULES) {
    if (rule.signal.test(text) && !rule.allowedBy.test(allowed)) {
      return { safe: false, ruleId: rule.id, reason: rule.reason };
    }
  }

  for (const time of CANONICAL_TIMES) {
    if (text.includes(time) && !allowed.includes(time)) {
      return {
        safe: false,
        ruleId: `protected-time:${time}`,
        reason: `The reply introduced protected timeline value ${time} outside the allow-list.`,
      };
    }
  }

  for (const term of INVENTED_EVIDENCE_TERMS) {
    if (containsWholeTerm(text, term) && !containsWholeTerm(allowed, term)) {
      return {
        safe: false,
        ruleId: `invented-evidence:${term}`,
        reason: `The reply introduced evidence term "${term}" that is not allowed for this turn.`,
      };
    }
  }

  return { safe: true };
}

export function enforceNpcReplyFirewall(answer: string, prompt: AllowedNpcPrompt): FilteredNpcReply {
  const decision = validateNpcReply(answer, prompt);
  if (decision.safe) {
    return { answer: answer.trim(), rejected: false, ruleId: null };
  }
  return { answer: prompt.fallbackAnswer, rejected: true, ruleId: decision.ruleId };
}
