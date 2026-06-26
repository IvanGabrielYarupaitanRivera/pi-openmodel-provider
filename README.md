# pi-openmodel-provider

A [pi](https://github.com/earendil-works/pi-mono) custom provider that connects pi to [OpenModel.ai](https://www.openmodel.ai) — a unified AI API gateway.

[![npm version](https://img.shields.io/npm/v/pi-openmodel-provider)](https://www.npmjs.com/package/pi-openmodel-provider)
[![CI](https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/actions/workflows/ci.yml/badge.svg)](https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/actions/workflows/ci.yml)

> **Disclaimer:** This is an unofficial, community-maintained package. I am not affiliated with, endorsed by, or connected to OpenModel in any way. This provider simply forwards requests to the public OpenModel API using your own API key.

> **Note:** This package only provides a model _provider_. It does **not** include an API key. You must bring your own OpenModel API key.

[▶️ Watch the video tutorial](https://youtu.be/aUaXznGVuzg) — See the full installation and usage walkthrough.

## Install + Quick start

```sh
pi install npm:pi-openmodel-provider
```

![pi-openmodel-provider thumbnail](https://raw.githubusercontent.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/master/media/thumbnail.jpeg)

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

On startup, the provider fetches models from two endpoints:

- **Pricing & capabilities:** `https://api.openmodel.ai/web/v1/models` (public, no auth needed)
- **Protocol info:** `https://api.openmodel.ai/v1/models` (requires API key — if unavailable, protocols are inferred from the provider)

Pricing, context window, reasoning support, and vision capabilities are all provided by the API — no hardcoded data.

### Caching

Models are cached locally at `~/.pi/agent/cache/openmodel-models.json` with a **5-minute TTL**. On subsequent startups or `/reload`, the cached list is used instead of hitting the API again. The `/openmodel` command shows `(cached)` when the cache is active.

To force a fresh fetch, wait 5 minutes or delete the cache file manually.

## Pricing

Model pricing is fetched live from OpenModel's public API (`/web/v1/models`). Each model returns its real per-token rates in microdollars, converted to dollars per million tokens for display.

- Input and output tokens are billed at separate rates
- Cache reads and writes are billed at reduced rates
- A `price_multiplier` may apply (e.g., 0.95 = 5% discount)
- Free models have zero cost

## Features

- **41+ models** from 9+ providers (dynamically fetched)
- **3 protocols**: Messages (Anthropic), Responses (OpenAI), Gemini (Google)
- **Model stability metrics** via `/openmodel-stability`
- **1M context window** for DeepSeek V4 models
- **Thinking levels** for reasoning models (DeepSeek, Claude, GPT, Gemini, etc.)
- **Compat flags** per provider for optimal protocol compatibility
- **Local caching** with 5-minute TTL to reduce API calls
- **AbortSignal support** in stability commands for cancellation
- **Friendly error messages** with emojis and actionable guidance
- **No hardcoding** — new models, pricing, and capabilities appear automatically
- **CI workflow** — typecheck and tests run on every push and PR
- **Modular architecture** — each module has a single responsibility (SRP), making the codebase easy to maintain and extend

## Error handling

Errors from OpenModel's API are shown with friendly messages:

| HTTP Status | What you'll see |
|-------------|-----------------|
| 401 | 🔑 Invalid API key. Check your credentials or run /login again. |
| 402 | 💳 Insufficient balance. Top up at console.openmodel.ai |
| 429 | ⏳ Rate limited. Try again later. |
| 404 | 🔍 Resource not found. Check the model name. |
| 5xx | 🔧 OpenModel API error. Try again later. |

For stability endpoints, errors include context about what went wrong.

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

# Run all tests
npm test

# Run specific tests
npm run test:models
npm run test:auth
npm run test:pricing
npm run test:stability
npm run test:edge
npm run test:cache
```

### Codebase Architecture

The source code is organized by responsibility following the Single Responsibility Principle:

```
src/
├── api/                    # Network fetching (models, stability)
│   ├── models.ts           #   fetchOpenModelModels() — model discovery orchestration
│   └── stability.ts        #   fetchModelStabilitySummary/Detail()
├── providers/              # Provider-specific business logic
│   ├── compat.ts           #   compatForProvider() — per-provider compatibility flags
│   ├── protocols.ts        #   determineApi() + thinkingLevelMapForApi()
│   └── pricing.ts          #   pricePerMillion() — cost-per-token conversion
├── auth/                   # Authentication flow
│   ├── login.ts            #   login() + refreshToken() + getApiKey()
│   └── validate.ts         #   sanitizeApiKey() + isValidApiKey()
├── formatters/             # Pure display formatting
│   └── stability.ts        #   formatHealthStatus() + formatConfidence()
├── health.ts               # Shared health status determination
├── cache.ts                # Local model cache (read/write)
├── errors.ts               # API error parsing + friendly messages
└── stub.d.ts               # Type stubs for pi peer dependency
```

**Key principles:**
- Each file has exactly one responsibility
- `api/` modules only handle HTTP — no business logic
- `providers/` modules are pure functions — no side effects
- `formatters/` modules are pure — no network calls
- `auth/` separates input validation from login orchestration
- Tests mirror the source structure and mock network boundaries

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, PR expectations, and commit message rules.

## Release

See [RELEASE.md](RELEASE.md) for prerelease, npm smoke-test, stable publish, git tag, and GitHub follow-up checklist.

## License

MIT

---

**Maintained by** [Ivan Gabriel Yarupaitan Rivera](https://www.vanchi.pro/)