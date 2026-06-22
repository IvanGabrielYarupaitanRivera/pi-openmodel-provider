# Agent Instructions

- This package is **pi-openmodel-provider** for OpenModel.ai, **NOT** OpenRouter.
- OpenModel is a multi-model AI gateway, similar to OpenRouter but a different service.
- Models are fetched dynamically from OpenModel's API at startup — no hardcoded model list.
- If the `/v1/models` endpoint fails (no API key), protocols are inferred from the provider.
- See `.agents/skills/pi-openmodel-info/SKILL.md` for full documentation.
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) before changing code.
- Use [RELEASE.md](RELEASE.md) for release process.

**Maintained by** [Ivan Gabriel Yarupaitan Rivera](https://www.vanchi.pro/)
