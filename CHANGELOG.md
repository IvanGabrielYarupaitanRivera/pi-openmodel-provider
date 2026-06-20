# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-06-20

### Added
- AGENTS.md with agent instructions (fixed OpenRouter confusion)
- Skill file for agent to understand the extension
- Skills path in package.json

### Changed
- Updated README with correct step order

## [0.2.1] - 2026-06-20

### Changed
- Updated install command from git to npm

## [0.2.0] - 2026-06-20

### Added
- Async factory pattern (same as pi-commandcode-provider)
- API key auto-detection from pi's auth.json
- Debug logs for model loading process
- Windows path support for auth.json

### Changed
- Rewrote extension to match Command Code provider architecture
- Removed all event hooks (session_start, before_agent_start)
- Simplified to pure async factory function
- Improved auth.json reading with error handling
- Updated auth.json path for Windows compatibility

### Fixed
- All TypeScript errors (no `any`, proper types, `@types/node`)
- `node:fs` import instead of bare `fs`
- `allowImportingTsExtensions` in tsconfig
- `.ts` extension imports working correctly
- auth.json path resolution

## [0.1.0] - 2026-06-20

### Added
- Initial release
- Dynamic model discovery from OpenModel API (42 models)
- OAuth login via `/login openmodel`
- Model stability metrics via `/openmodel-stability`
- Health status indicators on model names
- Support for 3 protocols: Messages (Anthropic), Responses (OpenAI), Gemini (Google)
- Provider-based inference for context window, maxTokens, and pricing
- Commands: `/openmodel`, `/openmodel-stability`

### Changed
- Models fetched dynamically instead of hardcoded list
- Context windows inferred from provider (DeepSeek = 1M, Anthropic = 200K, etc.)
- Pricing as provider defaults with per-model overrides

### Fixed
- TypeScript type errors
- `onSelect` optional callback handling
- Import path extensions (.ts → .js)
- Process import in models.ts

[0.2.2]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.2
[0.2.1]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.1
[0.2.0]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.0
[0.1.0]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.1.0