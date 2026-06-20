# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/tag/v0.1.0