# pi-openmodel-provider

A [pi](https://github.com/earendil-works/pi-mono) custom provider that connects pi to the [OpenModel.ai](https://www.openmodel.ai) API.

> **Disclaimer:** This is an unofficial, community-maintained package. I am not affiliated with, endorsed by, or connected to OpenModel in any way. This provider simply forwards requests to the public OpenModel API using your own API key.

> **Note:** This package only provides a model _provider_. It does **not** include an API key. You must bring your own OpenModel API key.

## Models

Models are fetched live from OpenModel's Provider API at startup, so new models show up without a package release.

You can list the current OpenModel models with:

```sh
pi --list-models
```

## Install

```sh
pi install git:github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider
```

## Setup

Set your OpenModel API key using one of these methods:

### 1. Browser login (recommended)

In pi, run:

```txt
/login openmodel
```

This opens OpenModel Console in your browser where you can create or copy your API key. The key is automatically stored in pi's auth file.

### 2. Environment variable

```sh
export OPENMODEL_API_KEY="om-..."
```

### 3. Auth file

Create `~/.pi/agent/auth.json`:

```json
{
  "openmodel": "om-..."
}
```

## Usage

After installing and setting your API key, select an OpenModel model in pi:

```txt
/model openmodel/deepseek-v4-flash
```

Any query will then use the OpenModel API. You can list available models:

```sh
pi --list-models
```

## Model discovery

On startup, the provider fetches:

```txt
https://api.openmodel.ai/v1/models
```

For tests or local mocks, override it with `OPENMODEL_MODELS_URL`.

## Pricing

OpenModel does not yet expose model pricing through its Provider API. The provider ships a static cost table (`PROVIDER_DEFAULTS` and `PRICING_OVERRIDES` in `src/models.ts`) for known models so that pi can display per-model pricing.

- Models present in the provider defaults show their estimated per-million-token rates.
- Models **not** in the table fall back to zero cost.

## Features

- **42 models** from 8+ providers (dynamically fetched)
- **3 protocols**: Messages (Anthropic), Responses (OpenAI), Gemini (Google)
- **Model stability metrics** via `/openmodel-stability` command
- **1M context window** for DeepSeek V4 models
- **No hardcoding** - new models appear automatically

## Supported Providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-5.x family |
| Anthropic | Claude Opus/Sonnet/Haiku |
| Google Gemini | Gemini Flash/Pro |
| DeepSeek | DeepSeek V4 (1M contexto) |
| Alibaba Qwen | Qwen3.x family |
| Xiaomi (MiMo) | Mimo v2.x |
| Moonshot (Kimi) | Kimi K2.x |
| MiniMax | MiniMax M2.x/M3 |
| ZAI (GLM) | GLM-4.x/5.x |

## Commands

```txt
/openmodel                # Show provider status
/openmodel-stability      # Show health metrics for all models
/openmodel-stability <model>  # Show detailed metrics for a model
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, PR expectations, and commit message rules.

## Release

See [RELEASE.md](RELEASE.md) for prerelease, npm smoke-test, stable publish, git tag, and GitHub follow-up checklist.

## License

MIT