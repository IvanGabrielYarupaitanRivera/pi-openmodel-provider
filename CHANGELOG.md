# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.14] - 2026-06-22

### Changed
- Updated `actions/checkout` and `actions/setup-node` to v5 (Node 24 native)

## [0.2.13] - 2026-06-22

### Fixed
- OIDC Trusted Publisher: added `npm install -g npm@latest` before publish
- Forced Node.js 24 in workflow for OIDC compatibility

## [0.2.12] - 2026-06-22

### Added
- GitHub Actions workflow for auto-publishing to npm via OIDC Trusted Publisher
- Provenance statements via `npm publish --provenance`

## [0.2.11] - 2026-06-22

### Changed
- Updated npm badge from `badge.fury.io` to `shields.io` (faster updates)
- Updated README endpoint descriptions (protocol endpoint requires API key)
- Updated SKILL.md with model discovery, fallback, and thinking levels info
- Updated AGENTS.md with dynamic fetch and fallback notes

## [0.2.10] - 2026-06-22

### Fixed
- Legacy `/v1/models` endpoint failing without API key (models now load without auth)
- `require("node:os")` bug in `/openmodel` command (ESM compatibility)
- Added fallback protocol inference when legacy endpoint unavailable

### Added
- Test: recovers when legacy endpoint fails with 401

## [0.2.9] - 2026-06-20

### Added
- `src/errors.ts` with `parseWebError`, `parseProxyError`, `friendlyMessage` helpers
- Friendly error messages for 401, 402, 404, 429, 5xx and more
- `thinkingLevelMap` for reasoning models (Messages + Responses protocols)
- Error handling in model discovery and stability endpoints
- Comprehensive error handling section in README

### Changed
- Models now fetched from two public endpoints (no auth required)
- Pricing, context window, reasoning, and vision capabilities from real API
- Removed all hardcoded pricing tables (PROVIDER_DEFAULTS, PRICING_OVERRIDES)
- Simplified index.ts: removed readFileSync and auth.json reading
- Stability errors now show specific API error codes
- Updated all tests to use mock fetch with real API response format

### Removed
- Hardcoded PROVIDER_DEFAULTS in src/models.ts
- Hardcoded PRICING_OVERRIDES, CONTEXT_OVERRIDES, MAX_TOKENS_OVERRIDES
- Hardcoded REASONING_OVERRIDES in src/models.ts
- readFileSync import and getApiKeyFromAuth function from index.ts

## [0.2.6] - 2026-06-20

### Fixed
- Added .agents/ and AGENTS.md to package.json files field so they appear in npm

## [0.2.5] - 2026-06-20

### Changed
- Fixed README display on npm main page

## [0.2.4] - 2026-06-20

### Changed
- Internal version bump

## [0.2.3] - 2026-06-20

### Changed
- Updated CHANGELOG, RELEASE, and CONTRIBUTING docs for consistency
- Bumped version to 0.2.3

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

[0.2.14]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.14
[0.2.13]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.13
[0.2.12]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.12
[0.2.11]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.11
[0.2.10]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.10
[0.2.9]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.9
[0.2.6]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.6
[0.2.5]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.5
[0.2.4]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.4
[0.2.3]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.3
[0.2.2]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.2
[0.2.1]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.1
[0.2.0]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.2.0
[0.1.0]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.1.0