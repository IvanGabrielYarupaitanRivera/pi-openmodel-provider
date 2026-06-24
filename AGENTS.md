# Agent Instructions

- This package is **pi-openmodel-provider** for OpenModel.ai, **NOT** OpenRouter.
- OpenModel is a multi-model AI gateway, similar to OpenRouter but a different service.
- Models are fetched dynamically from OpenModel's API at startup — no hardcoded model list.
- Models are cached locally at `~/.pi/agent/cache/openmodel-models.json` with a 5-minute TTL to avoid hitting the API on every startup.
- Compat flags are set per provider (openai, anthropic, deepseek, qwen, zai) for optimal protocol compatibility.
- If the `/v1/models` endpoint fails (no API key), protocols are inferred from the provider.
- See `.agents/skills/pi-openmodel-info/SKILL.md` for full documentation.
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) before changing code.
- Use [RELEASE.md](RELEASE.md) for release process.

**Maintained by** [Ivan Gabriel Yarupaitan Rivera](https://www.vanchi.pro/)
