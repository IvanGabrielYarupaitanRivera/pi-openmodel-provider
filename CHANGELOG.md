# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.19] - 2026-06-27

### Added
- `src/auth/login.ts` — `hasApiKey()` function to check for configured credentials (was inline in `index.ts`)
- `src/formatters/status.ts` — new module with pure `formatProviderStatus()` for the `/openmodel` command display
- `formatStabilityDetail()` and `formatStabilitySummaryLine()` in `src/formatters/stability.ts` — extract stability formatting from `index.ts`
- `CommandContext` interface in `index.ts` — types the command handler context instead of using `any`

### Changed
- `index.ts` — refactored to pure orchestration: `/openmodel` and `/openmodel-stability` handlers delegate I/O, formatting, and display logic to extracted functions
- `.agents/skills/pi-openmodel-info/SKILL.md` — completed thinking levels section with full mappings (`minimal` through `xhigh`) for both protocols

### Removed
- `import { readFile } from "node:fs/promises"` and `import { homedir } from "node:os"` from `index.ts` (moved into `hasApiKey()`)

## [0.2.18] - 2026-06-26

### Added
- `src/health.ts` — shared `HealthStatus` type and `determineHealth()` function, extracted from `src/api/stability.ts` and `src/formatters/stability.ts` to eliminate code duplication
- `tests/test-cache.ts` — 12 tests covering cache read (valid, expired, corrupted, missing) and write (success, directory creation, error suppression)
- `CacheFs` interface in `src/cache.ts` for dependency injection (matching `fetchImpl` pattern)
- `test:cache` npm script

### Changed
- `src/api/stability.ts` — removed local `determineHealthFallback()` copy, imports from `src/health.ts` instead
- `src/formatters/stability.ts` — removed local `determineHealth()` copy, imports from `src/health.ts` instead
- `src/api/models.ts` — eliminated unsafe `as unknown as OpenModelProviderModel` cast and 4 `as number` price casts via type annotation and `getNumberPrice()` helper; removed `as const` on model base object
- `src/providers/compat.ts` — removed unused `api` parameter from `compatForProvider()`
- `index.ts` — replaced blocking `readFileSync` with `await readFile` from `fs/promises`
- `LICENSE` — added copyright holder name
- `tsconfig.json` — enabled `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `AGENTS.md` — reduced to LLM-focused bullet points with references to README and SKILL.md
- `README.md` — added `health.ts` to architecture tree, added `test:cache` to development section

### Changed
- **Major refactor (SRP):** Reorganized `src/` into single-responsibility modules
  - `api/` — network fetching only (models, stability)
  - `providers/` — pure business logic (compat, protocols, pricing)
  - `auth/` — login orchestration + input validation separated
  - `formatters/` — pure display formatting (stability health/confidence)
  - Each file now has exactly one responsibility (was 1-4 before)
- `index.ts` — replaced dynamic `import("node:fs")` with static top-level import

### Documentation
- `README.md` — added Codebase Architecture section with module descriptions
- `CONTRIBUTING.md` — added Codebase Architecture section with contributor guidelines

## [0.2.16] - 2026-06-23

### Added
- Local model cache at `~/.pi/agent/cache/openmodel-models.json` with 5-minute TTL
- `src/cache.ts` module for cache read/write operations
- Compat flags per provider (openai, anthropic, deepseek, qwen, zai) for optimal protocol compatibility
- AbortSignal support in stability fetch functions
- CI workflow (`.github/workflows/ci.yml`) for typecheck + tests on push and PR
- Typecheck and test steps before publish in `.github/workflows/publish.yml`
- `(cached)` indicator in `/openmodel` status output

### Changed
- Models now load from cache first, falling back to API fetch
- Updated `actions/checkout` and `actions/setup-node` to v5 (Node 24 native)

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