# Release Process for pi-openmodel-provider

## Prerelease Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with new version and changes
- [ ] Update README.md if there are breaking changes or new features
- [ ] Run type checking: `npm run typecheck`
- [ ] Run tests: `npm run test:models`
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
npm install C:/Users/Admin/pi-openmodel-provider

# Test installation
pi install test-openmodel
```

## Stable Publish

```sh
# Make sure all tests pass
npm run typecheck
npm run test:models

# Push to GitHub
git push origin main

# Create release on GitHub (triggers npm publish)
```

## GitHub Follow-up Checklist

- [ ] Verify npm package is published
- [ ] Update GitHub release notes
- [ ] Add release badge to README
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