# Contributing to pi-openmodel-provider

Thank you for considering contributing to this project!

## Development Setup

```sh
# Clone the repo
git clone https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider
cd pi-openmodel-provider

# Install dependencies
npm install
```

## Codebase Architecture

The project follows the **Single Responsibility Principle** — each module does exactly one thing.

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

**Guidelines for contributors:**
- **`api/`** — HTTP fetching only. Never add business logic or formatting here.
- **`providers/`** — Pure functions. No side effects, no network calls, no I/O.
- **`formatters/`** — Pure functions. Only string/output formatting.
- **`auth/`** — `validate.ts` for pure input checks, `login.ts` for orchestration.
- **`health.ts`** — Pure function. Shared health/status logic, no side effects.
- **`cache.ts`** / **`errors.ts`** — Shared utilities used across modules.
- **Tests** — Place in `tests/` and mock network boundaries via `fetchImpl` injection.

## Type Checking

```sh
npm run typecheck
```

## Testing

```sh
# Run all tests
npm test

# Run individual test suites
npm run test:models
npm run test:auth
npm run test:pricing
npm run test:stability
npm run test:edge
npm run test:cache
```

## Continuous Integration

On every push and pull request to `master`, GitHub Actions automatically runs:
- `npm run typecheck` — TypeScript type checking
- `npm test` — All test suites

Make sure both pass locally before pushing.

## Commit Message Rules

- Use imperative mood: "Add", "Fix", "Update", etc.
- Reference related issues if applicable
- Keep commit messages concise but descriptive

Examples:
- `Add OAuth login support`
- `Fix DeepSeek context window to 1M tokens`
- `Update pricing for Claude Opus 4.7`

## PR Expectations

1. Type checking must pass
2. Follow the existing code style
3. Update README if adding new features
4. Add tests for new functionality
5. Reference related issues/PRs

## Questions?

Open an issue or reach out via GitHub.