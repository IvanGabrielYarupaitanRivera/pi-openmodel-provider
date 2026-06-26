# Agent Instructions

This package is **pi-openmodel-provider** for [OpenModel.ai](https://www.openmodel.ai) — **NOT** OpenRouter.

## Key facts for LLMs

- Models are fetched dynamically from OpenModel's API at startup. No hardcoded model list.
- Cached at `~/.pi/agent/cache/openmodel-models.json` with 5-min TTL.
- Compat flags per provider (openai, anthropic, deepseek, qwen, zai) for optimal protocol compatibility.
- If `/v1/models` fails (no API key), protocols are inferred from the provider.
- Full docs at `.agents/skills/pi-openmodel-info/SKILL.md`.
- General project docs: [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md), [RELEASE.md](RELEASE.md).

**Maintained by** [Ivan Gabriel Yarupaitan Rivera](https://www.vanchi.pro/)
