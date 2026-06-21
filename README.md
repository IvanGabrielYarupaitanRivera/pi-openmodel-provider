# pi-openmodel-provider

A [pi](https://github.com/earendil-works/pi-mono) custom provider that connects pi to [OpenModel.ai](https://www.openmodel.ai) — a unified AI API gateway.

> **Disclaimer:** This is an unofficial, community-maintained package. I am not affiliated with, endorsed by, or connected to OpenModel in any way. This provider simply forwards requests to the public OpenModel API using your own API key.

> **Note:** This package only provides a model _provider_. It does **not** include an API key. You must bring your own OpenModel API key.

## Install + Quick start

```sh
pi install npm:pi-openmodel-provider
```

![pi-openmodel-provider thumbnail](https://raw.githubusercontent.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/master/media/thumbnail.jpeg)

[▶️ Watch video tutorial](https://youtu.be/aUaXznGVuzg)

| Step | What to do |
|------|------------|
| 1️⃣ | `/reload` (so OpenModel appears in /login) |
| 2️⃣ | `/login` → "Use a subscription" → **OpenModel** → "Paste API key manually" → paste your key |
| 3️⃣ | `/reload` (so models load) |
| 4️⃣ | `Ctrl + L` or `/model openmodel/deepseek-v4-flash` to select your model |

Done! You can now use OpenModel in pi.

## Usage

After setup, select any OpenModel model:

```txt
/model openmodel/deepseek-v4-flash
```

Press **Ctrl + L** to open the model selector and browse available models.

## Models

Models are fetched live from OpenModel's API at startup, so new models show up without a package release.

### Supported Providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-5.x family |
| Anthropic | Claude Opus/Sonnet/Haiku |
| Google Gemini | Gemini Flash/Pro |
| DeepSeek | DeepSeek V4 (1M context) |
| Alibaba Qwen | Qwen3.x family |
| Xiaomi (MiMo) | Mimo v2.x |
| Moonshot (Kimi) | Kimi K2.x |
| MiniMax | MiniMax M2.x/M3 |
| ZAI (GLM) | GLM-4.x/5.x |

## Model discovery

On startup, the provider fetches:

```txt
https://api.openmodel.ai/v1/models
```

## Pricing

OpenModel does not yet expose model pricing through its Provider API. The provider ships a static cost table (`PROVIDER_DEFAULTS` and `PRICING_OVERRIDES` in `src/models.ts`) for known models so that pi can display per-model pricing.

- Models present in the provider defaults show their estimated per-million-token rates.
- Models **not** in the table fall back to zero cost.

## Features

- **41 models** from 9+ providers (dynamically fetched)
- **3 protocols**: Messages (Anthropic), Responses (OpenAI), Gemini (Google)
- **Model stability metrics** via `/openmodel-stability`
- **1M context window** for DeepSeek V4 models
- **No hardcoding** — new models appear automatically

## Commands

```txt
/openmodel                Show provider status
/openmodel-stability      Show health metrics for all models
/openmodel-stability <model>  Show detailed metrics for a specific model
```

## Stability explained

The `/openmodel-stability` command shows how healthy each model is:

| Symbol | Meaning | Condition |
|--------|---------|-----------|
| ✅ Operational | Healthy | ≥99.9% success + enough data |
| 🟢 Healthy | Good | ≥99% success |
| 🟡 Degraded | Some issues | ≥95% success |
| 🔴 Unstable | Problems | <95% success |
| ⚪ No Data | Not enough info | <10 requests (low confidence) |

```
✅ deepseek-v4-flash  100.0%   8541ms   136.4 t/s
   ↑         ↑          ↑        ↑          ↑
   |         |          |        |          └── Tokens per second
   |         |          |        └── Average latency (ms)
   |         |          └── Success rate
   |         └── Model name
   └── Health status
```

## Development

```sh
# Clone the repo
git clone https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider
cd pi-openmodel-provider

# Install dependencies
npm install

# Type check
npm run typecheck

# Test model fetching
npm run test:models
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, PR expectations, and commit message rules.

## Release

See [RELEASE.md](RELEASE.md) for prerelease, npm smoke-test, stable publish, git tag, and GitHub follow-up checklist.

## License

MIT