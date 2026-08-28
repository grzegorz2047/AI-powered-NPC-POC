import { buildAllowedNpcPrompt, evaluateNpcPolicy, type InterviewPressure, type NpcPolicyRequest, type NpcPolicyResult } from '../src/domain/npcPolicy.js';
import { enforceNpcReplyFirewall } from '../src/domain/npcReplyFirewall.js';

type LlmConfig = {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
};

type ApiRequest = NpcPolicyRequest & { llm?: LlmConfig };

const DEFAULT_ALLOWED_BYOK_HOSTS = new Set([
  'api.openai.com',
  'openrouter.ai',
  'api.groq.com',
  'api.together.xyz',
  'api.mistral.ai',
]);

async function naturalize(body: ApiRequest, result: NpcPolicyResult) {
  const config = resolveLlmConfig(body.llm);
  if (!config) {
    return { answer: result.answer, model: null, firewallRejected: false, firewallRule: null as string | null };
  }
  const prompt = buildAllowedNpcPrompt(body, result);

  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.65,
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: [
            `You are ${prompt.witnessName}, a ${prompt.persona}.`,
            `Current resistance: ${Math.round(prompt.resistance)}/100. Detective approach: ${prompt.pressure}.`,
            'You are a witness in a detective game. Stay in character.',
            'Use only the facts listed below. Never add new case facts, names, times, motives or evidence.',
            `Allowed facts: ${prompt.allowedFacts.join('; ') || 'none'}.`,
            'Reply in 1-3 natural sentences. If the question asks for a fact not allowed, evade or say you do not know.',
          ].join('\n'),
        },
        { role: 'user', content: prompt.question },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`LLM provider returned ${response.status}.`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const candidate = data.choices?.[0]?.message?.content?.trim() || result.answer;
  const filtered = enforceNpcReplyFirewall(candidate, prompt);
  return {
    answer: filtered.answer,
    model: filtered.rejected ? null : config.model,
    firewallRejected: filtered.rejected,
    firewallRule: filtered.ruleId,
  };
}

function resolveLlmConfig(requested?: LlmConfig) {
  if (requested?.baseUrl && requested.model && requested.apiKey) {
    const url = new URL(requested.baseUrl);
    if (url.protocol !== 'https:') throw new Error('BYOK endpoint must use HTTPS.');
    if (!allowedByokHosts().has(url.hostname.toLowerCase())) {
      throw new Error(`BYOK host ${url.hostname} is not allowed by this deployment.`);
    }
    return { baseUrl: url.origin + url.pathname.replace(/\/$/, ''), model: requested.model.trim(), apiKey: requested.apiKey };
  }

  const baseUrl = process.env.NPC_LLM_BASE_URL;
  const model = process.env.NPC_LLM_MODEL;
  if (!baseUrl || !model) return null;
  return { baseUrl, model, apiKey: process.env.NPC_LLM_API_KEY ?? '' };
}

function allowedByokHosts() {
  const configured = (process.env.NPC_LLM_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_BYOK_HOSTS, ...configured]);
}

function normalizePressure(value: unknown): InterviewPressure {
  return value === 'empathy' || value === 'confront' ? value : 'neutral';
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    try {
      const body = await request.json() as Partial<ApiRequest>;
      if (!body.witnessId || !body.question) {
        return Response.json({ error: 'witnessId and question are required' }, { status: 400 });
      }
      const normalized: ApiRequest = {
        witnessId: body.witnessId,
        question: body.question,
        evidenceIds: Array.isArray(body.evidenceIds) ? body.evidenceIds : [],
        resistance: Number(body.resistance) || 0,
        contradictions: Number(body.contradictions) || 0,
        pressure: normalizePressure(body.pressure),
        llm: body.llm,
      };
      const result = evaluateNpcPolicy(normalized);
      const naturalized = await naturalize(normalized, result);
      return Response.json({
        answer: naturalized.answer,
        resistanceDelta: result.resistanceDelta,
        contradictionDelta: result.contradictionDelta,
        contradictionId: result.contradictionId ?? null,
        mode: naturalized.firewallRejected ? 'rules-firewall' : naturalized.model ? 'llm' : 'rules',
        model: naturalized.model,
        firewallRejected: naturalized.firewallRejected,
        firewallRule: naturalized.firewallRule,
      });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }
  },
};
