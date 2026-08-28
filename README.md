# AI-powered NPC POC

A browser detective-game vertical slice set in **Hotel Nocturne: Room 307**. The player explores an isometric scene, collects evidence and interviews witnesses. Dialogue can be naturalized by an LLM, but the model never owns the truth of the case.

## Stack

- **Phaser 4.2.1** — game engine, isometric scene, input, camera and tweens.
- **Tiled-compatible JSON** — scene/map data.
- **React + Vite** — investigation UI and model configuration.
- **Ink / inkjs** — authored detective narration.
- **Zustand** — persisted investigation state.
- **Transformers.js 4.2** — local Qwen inference in the browser.
- **ONNX Runtime Web / WebNN** — NPU execution through `webnn-npu` when supported.
- **WebGPU** — local GPU fallback.
- **WASM** — CPU fallback.
- **Chrome Prompt API** — optional browser-managed built-in model.
- **Vercel Function `/api/npc`** — deterministic reveal policy and allow-listed BYOK proxy.
- **Web Speech API** — detective-thought TTS.

## AI modes

Open **AI model & acceleration** in the game.

### 1. BYOK

Enter an OpenAI-compatible endpoint, model and API key. The API key is held only in tab memory and is excluded from persisted Zustand state. The Vercel proxy allows common public providers plus hosts configured with `NPC_LLM_ALLOWED_HOSTS`.

### 2. Local Qwen — free

Profiles:

- **Quality**: `onnx-community/Qwen3-4B-Instruct-2507-ONNX`.
- **Lite**: `onnx-community/Qwen3-0.6B-ONNX`.

Accelerators:

- **Auto**: NPU/WebNN → WebGPU → WASM/CPU.
- **NPU only**: strict `webnn-npu`, no silent fallback.
- **GPU only**: WebGPU.
- **CPU only**: WASM.

The model is not downloaded on page load. Download/initialization starts only after the user explicitly clicks the local-model button. Transformers.js is dynamically imported, so the game shell does not require the ML runtime before it is needed.

See `docs/NPU_BROWSER_SETUP.md` for NPU setup and physical verification.

### 3. Chrome built-in model — free when available

The game probes `LanguageModel.availability()` and creates a Chrome-managed session only after the user chooses it.

### Deterministic fallback

The full case remains playable with no model at all. If a selected AI runtime fails, the game uses the deterministic witness response for that turn and reports the fallback.

## Narrative safety

The LLM never receives the whole murder solution. Shared domain policy first evaluates the current evidence, witness and contradiction state and produces an **allow-list of facts**. Cloud, local NPU/GPU/CPU and Chrome providers all receive only that allow-list plus the witness persona and current question.

## Run

```bash
npm install
npm run dev
```

Tests and build:

```bash
npm run test
npm run build
```

## Optional server-side default LLM

```text
NPC_LLM_BASE_URL=https://your-llm-host/v1
NPC_LLM_API_KEY=optional-key
NPC_LLM_MODEL=Qwen3-4B-Instruct-2507
NPC_LLM_ALLOWED_HOSTS=optional-extra-host.example
```
