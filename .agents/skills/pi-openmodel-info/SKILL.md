# OpenModel Provider for pi

This skill describes the pi-openmodel-provider package installed in this environment.

## What is it?

pi-openmodel-provider is a custom provider that connects pi to [OpenModel.ai](https://www.openmodel.ai) — a unified AI API gateway.

## What it provides

- Access to **41 models** from 9+ providers: OpenAI, Anthropic, DeepSeek, Google Gemini, Alibaba Qwen, Xiaomi (MiMo), Moonshot (Kimi), MiniMax, ZAI (GLM)
- **DeepSeek-V4-Flash** with 1M context window
- **NOT** OpenRouter — this is a different service called OpenModel.ai

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
