# pi-openmodel-provider

Custom provider for [OpenModel.ai](https://www.openmodel.ai) — a unified AI API gateway that provides a single access point to multiple AI model providers.

## Features

- 🔌 **Automatic model discovery** — Fetches available models from OpenModel's API
- 🔄 **3 protocol support** — Messages (Anthropic), Responses (OpenAI), Gemini (Google)
- 🧠 **Reasoning detection** — Automatically enables thinking for compatible models
- 💰 **Known pricing** — Pre-configured costs for popular models
- 🔐 **Secure auth** — Uses environment variable for API key

## Supported Providers

| Provider | Protocol | Models |
|----------|----------|--------|
| OpenAI | Responses | GPT-5.x family |
| Anthropic | Messages | Claude Opus/Sonnet/Haiku |
| Google Gemini | Gemini | Gemini Flash/Pro |
| DeepSeek | Messages | DeepSeek V4 |
| DashScope (Alibaba) | Messages & Responses | Qwen3.x family |
| Xiaomi (MiMo) | Messages | Mimo v2.x |
| Moonshot (Kimi) | Messages | Kimi K2.x |
| MiniMax | Messages | MiniMax M2.x/M3 |
| ZAI (GLM) | Messages | GLM-4.x/5.x |

## Installation

```bash
# Install from local path
pi install C:/path/to/pi-openmodel-provider
```

## Setup

1. Get an API key from [console.openmodel.ai](https://console.openmodel.ai)
2. Set the environment variable:
   ```bash
   export OPENMODEL_API_KEY="om-your-api-key"
   ```

## Usage

```bash
# List available models
pi --list-models

# Use OpenModel models
pi --model openmodel/deepseek-v4-flash
pi --model openmodel-responses/gpt-5.4-mini
pi --model openmodel-gemini/gemini-3.5-flash

# With thinking enabled
pi --model openmodel/deepseek-v4-flash --thinking high
```

## Development

```bash
# Type check
npm run typecheck

# Test model fetching
npm run test:models
```
