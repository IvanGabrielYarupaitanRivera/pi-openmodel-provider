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