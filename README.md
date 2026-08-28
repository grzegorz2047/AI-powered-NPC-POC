# AI-powered NPC POC

A browser detective game vertical slice. The player explores an isometric hotel scene, collects evidence and interviews witnesses. Dialogue can be naturalized by optional LLM providers without giving any model access to the full case canon.

## Stack

- Phaser 4.2.1: game engine, isometric tilemap, input, camera, tweens.
- Tiled-compatible JSON: scene map data.
- React + Vite: evidence board and interview UI.
- Ink / inkjs: authored detective narration.
- Zustand: shared browser game state with persistence.
- Vercel Function `/api/npc`: deterministic reveal policy plus optional LLM naturalization.
- Web Speech API: detective-thought TTS.

## AI runtime options

The game is designed around three provider modes:

1. BYOK through an OpenAI-compatible endpoint.
2. Local browser inference using a ready-made WebGPU/WebNN runtime.
3. Chrome Prompt API / Gemini Nano when the browser exposes the built-in model.

The local browser mode exposes two free profiles:

- **Quality:** Qwen3-4B-class model for stronger hardware and better NPC dialogue.
- **Lite:** `onnx-community/Qwen3-0.6B-ONNX` through Hugging Face Transformers.js + WebGPU for weaker devices. Hugging Face maintains a working Qwen3 WebGPU browser example for this exact model. This mode requires no API key and keeps dialogue on-device.

The settings screen should offer `Auto`, `Quality`, and `Lite`. `Auto` must recommend a profile from browser/WebGPU capability and available device-memory hints, but never start a multi-gigabyte model download without explicit user confirmation.

## Optional server LLM

Configure an OpenAI-compatible endpoint:

```text
NPC_LLM_BASE_URL=https://your-llm-host/v1
NPC_LLM_API_KEY=optional-key
NPC_LLM_MODEL=Qwen3-4B-Instruct-2507
```

Without any model provider, the full case remains playable using deterministic dialogue rules.

## Narrative safety

The LLM never receives the whole murder solution. The game first evaluates the current evidence and witness state, computes an allow-list of facts, and only then asks the selected model to phrase those facts in character.
