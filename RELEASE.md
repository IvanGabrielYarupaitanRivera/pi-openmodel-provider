# Release Process for pi-openmodel-provider

## Prerelease Checklist

- [ ] Update version in `package.json` (e.g. `0.2.3`)
- [ ] Update `CHANGELOG.md` with new version and changes
- [ ] Update `AGENTS.md` and SKILL.md if new features added
- [ ] Run type checking: `npm run typecheck`
- [ ] Run all tests: `npm test`
- [ ] Create and merge PR for review

## NPM Smoke-Test

```sh
# Create a temporary test directory
mkdir /tmp/test-openmodel
cd /tmp/test-openmodel

# Create a minimal package.json
cat > package.json << 'EOF'
{
  "name": "test-openmodel",
  "version": "0.0.0-test",
  "type": "module",
  "devDependencies": {
    "@earendil-works/pi-coding-agent": "^0.75.5"
  }
}
EOF

# Install the local package
npm install /path/to/pi-openmodel-provider

# Test installation
pi install npm:test-openmodel
```

## Stable Publish

```sh
# Make sure all tests pass
npm run typecheck
npm test

# Push to GitHub
git push origin master

# Create release on GitHub
# Go to https://github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider/releases/new
# Tag: v0.2.0
# Title: v0.2.0
# Description: Copy relevant CHANGELOG entries
```

## GitHub Follow-up Checklist

- [ ] Verify git tag is created
- [ ] Update GitHub release notes with CHANGELOG content
- [ ] Add release badge to README (if applicable)
- [ ] Announce on relevant channels (if applicable)
- [ ] Monitor for issues

## Version Numbering

Use semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

## Changelog Format

```markdown
## [x.y.z] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Changed feature description

### Fixed
- Bug fix description

### Removed
- Removed feature description
```
