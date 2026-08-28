# Local NPC inference on NPU / WebNN

The browser-Qwen provider follows the same backend policy as `grzegorz2047/NPU-site`:

1. **NPU** through Transformers.js `device: 'webnn-npu'` / ONNX Runtime Web WebNN `deviceType: 'npu'`.
2. **WebGPU** if the NPU session cannot be created in `Auto` mode.
3. **WASM / CPU** as the final local fallback.

`NPU only` is strict and never silently falls back.

## Important distinction

`navigator.ml` / WebNN being present means only that the browser exposes the API. It does **not** prove that a particular Qwen model can run on the NPU. Operator support, model dtype, browser version and drivers still matter.

The game reports NPU as active only after Transformers.js successfully creates the model pipeline using `webnn-npu`. The AI settings panel therefore shows both:

- `WebNN API: yes/no`;
- `Active backend: npu/webgpu/wasm`.

## Intel NPU / Chrome

Typical setup is:

1. Windows 11 with Intel Core Ultra / Intel AI Boost.
2. Current Intel NPU driver.
3. Current Chrome. If WebNN is unavailable, check Chrome Beta/Canary and the `Web Machine Learning Neural Network` flag at `chrome://flags/#web-machine-learning-neural-network` when that flag is exposed by the installed Chrome version.
4. Open **AI model & acceleration** in the game.
5. Select `Local Qwen` and `NPU only`.
6. Click **Download / initialize local model**.
7. Treat only `Active backend: npu` as confirmation of a successfully created NPU session.

For physical validation, also observe NPU activity in Windows Task Manager while generating an NPC response. CI can verify fallback rules and device mapping but cannot prove physical NPU execution.

## Models

- Lite: `onnx-community/Qwen3-0.6B-ONNX`.
- Quality: `onnx-community/Qwen3-4B-Instruct-2507-ONNX`.

NPU compatibility is probed at runtime per model. If a quantized graph is unsupported by the current WebNN implementation, `Auto` records the error and tries WebGPU; strict NPU surfaces the error to the user.
