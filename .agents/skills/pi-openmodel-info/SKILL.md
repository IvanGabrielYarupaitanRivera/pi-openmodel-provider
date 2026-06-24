---
name: pi-openmodel-info
description: Learn about the pi-openmodel-provider package, its commands (/openmodel, /openmodel-stability), supported providers (OpenAI, Anthropic, DeepSeek, Gemini), and how to use OpenModel models in pi.
---

# OpenModel Provider for pi

This skill describes the pi-openmodel-provider package installed in this environment.

## What is it?

pi-openmodel-provider is a custom provider that connects pi to [OpenModel.ai](https://www.openmodel.ai) — a unified AI API gateway.

## What it provides

- Access to **41 models** from 9+ providers: OpenAI, Anthropic, DeepSeek, Google Gemini, Alibaba Qwen, Xiaomi (MiMo), Moonshot (Kimi), MiniMax, ZAI (GLM)
- **DeepSeek-V4-Flash** with 1M context window
- **NOT** OpenRouter — this is a different service called OpenModel.ai

## Model discovery

Models are fetched live from OpenModel's API at startup:

- **Pricing & capabilities:** `https://api.openmodel.ai/web/v1/models` (public, no auth needed)
- **Protocol info:** `https://api.openmodel.ai/v1/models` (requires API key — if unavailable, protocols are inferred from provider)

If the API key is not configured yet, models still load — protocols are inferred automatically from the provider name.

### Caching

Models are cached locally at `~/.pi/agent/cache/openmodel-models.json` with a **5-minute TTL**. On subsequent startups or `/reload`, the cached list is used instead of hitting the API again. The `/openmodel` command shows `(cached)` when the cache is active.

## Thinking levels

Reasoning models support thinking levels:
- **Messages protocol:** minimal → low, low → medium, medium → high
- **Responses protocol:** `reasoning_effort` levels (low, medium, high)

## Compat flags

Compat flags are automatically set per provider for optimal protocol compatibility:
- **OpenAI:** `supportsReasoningEffort: true`
- **Anthropic:** `sendSessionAffinityHeaders`, `supportsCacheControlOnTools`, `supportsEagerToolInputStreaming`
- **DeepSeek (reasoning):** `thinkingFormat: "deepseek"`
- **Qwen (reasoning):** `thinkingFormat: "qwen-chat-template"`
- **ZAI / GLM (reasoning):** `thinkingFormat: "zai"`

## Available commands

- `/openmodel` — Show provider status
- `/openmodel-stability` — Show health metrics for all models
- `/openmodel-stability <model>` — Show detailed metrics for a specific model

## Installation

Installed via: `pi install npm:pi-openmodel-provider`

## Authentication

Users authenticate via `/login` → "Use a subscription" → OpenModel → paste their API key.

## Stability metrics

The `/openmodel-stability` command shows real-time data from OpenModel's public API:
- ✅ Operational (≥99.9% success)
- 🟢 Healthy (≥99%)
- 🟡 Degraded (≥95%)
- 🔴 Unstable (<95%)
- ⚪ No Data (<10 requests)

---

**Maintained by** [Ivan Gabriel Yarupaitan Rivera](https://www.vanchi.pro/)
