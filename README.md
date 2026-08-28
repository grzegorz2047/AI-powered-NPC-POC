# AI-powered NPC POC

A browser detective game vertical slice. The player explores an isometric hotel scene, collects evidence and interviews witnesses whose dialogue can be naturalized by a small OpenAI-compatible LLM without giving the model access to the full case canon.

## Stack

- Phaser 4.2.1: game engine, isometric tilemap, input, camera, tweens.
- Tiled-compatible JSON: scene map data.
- React + Vite: evidence board and interview UI.
- Ink / inkjs: authored detective narration.
- Zustand: shared browser game state with persistence.
- Vercel Function `/api/npc`: deterministic reveal policy plus optional LLM naturalization.
- Web Speech API: detective-thought TTS.

## Run

```bash
npm install
npm run dev
```

## Optional NPC LLM

Configure an OpenAI-compatible endpoint:

```text
NPC_LLM_BASE_URL=https://your-llm-host/v1
NPC_LLM_API_KEY=optional-key
NPC_LLM_MODEL=Qwen3-4B-Instruct-2507
```

Without these variables the full case remains playable using deterministic dialogue rules.

## Narrative safety

The LLM never receives the whole murder solution. The server first evaluates the current evidence and witness state, computes an allow-list of facts, and only then asks the model to phrase those facts in character.
