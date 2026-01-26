# Release Process

Guide to versioning, changelog maintenance, and publishing releases.

## Version Numbering

Moonsurf follows [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR** - Breaking changes to API or protocol
- **MINOR** - New features, backwards compatible
- **PATCH** - Bug fixes, backwards compatible

## Pre-Release Checklist

Before creating a release:

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Documentation updated for new features
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] README updated if needed

## Release Steps

### 1. Update Version

```bash
npm version patch  # or minor, major
```

This automatically:
- Updates package.json version
- Creates a git commit
- Creates a git tag

Or manually:
```json
// package.json
{
  "version": "1.1.0"
}
```

### 2. Update Changelog

Edit `CHANGELOG.md`:

```markdown
## [1.1.0] - 2024-01-15

### Added
- New browser_cookies tool for cookie management
- Support for multiple authentication tokens

### Changed
- Improved error messages for element not found

### Fixed
- Race condition in WebSocket reconnection
- Memory leak in download watcher

### Deprecated
- Old authentication method (use Bearer tokens)
```

### 3. Update Version in Code

Check all version references:

```bash
grep -r "version.*1.0" src/
```

Update `src/index.ts` if version is hardcoded:
```typescript
function showVersion(): void {
  console.error('Moonsurf Browser Control v1.1.0');
}
```

### 4. Build and Test

```bash
npm run build
npm start -- --version
npm test  # if tests exist
```

### 5. Commit Changes

```bash
git add -A
git commit -m "chore: release v1.1.0"
```

### 6. Tag Release

```bash
git tag -a v1.1.0 -m "Release v1.1.0"
```

### 7. Push to Repository

```bash
git push origin main
git push origin v1.1.0
```

### 8. Publish to npm

```bash
npm publish
```

For scoped package:
```bash
npm publish --access public
```

## GitHub Release

### Create Release

1. Go to repository on GitHub
2. Click "Releases"
3. Click "Create a new release"
4. Select the version tag
5. Add release title: "v1.1.0"
6. Add release notes from changelog
7. Attach built artifacts if applicable
8. Publish release

### Release Notes Template

```markdown
## What's New

### Features
- 🎉 New browser_cookies tool for managing cookies
- 🔐 Support for multiple authentication tokens

### Improvements
- 📝 Better error messages
- ⚡ Performance improvements

### Bug Fixes
- 🐛 Fixed WebSocket reconnection race condition
- 🐛 Fixed memory leak in download watcher

### Breaking Changes
- ⚠️ None in this release

## Installation

```bash
npm install -g @moonsurf/browser-control
```

## Documentation

See [documentation](https://github.com/MoonsurfAI/browser-control/tree/main/docs)
```

## Extension Release

If the Chrome extension is updated:

### 1. Update Extension Version

In `chrome-extension/manifest.json`:
```json
{
  "version": "1.1.0"
}
```

### 2. Build Extension

```bash
cd chrome-extension
npm run build
```

### 3. Package Extension

```bash
cd dist
zip -r ../moonsurf-extension-v1.1.0.zip .
```

### 4. Publish to Chrome Web Store

(If publicly listed)

### 5. Update GitHub Release

Attach extension zip to the release.

### 6. Update Server Extension Download

If the server downloads the extension automatically, ensure the release asset is available.

## Hotfix Process

For urgent fixes:

### 1. Create Hotfix Branch

```bash
git checkout -b hotfix/critical-fix main
```

### 2. Make Fix

```bash
# Edit files
npm run build
npm test
```

### 3. Bump Patch Version

```bash
npm version patch
```

### 4. Update Changelog

Add to CHANGELOG.md under a new patch version.

### 5. Merge and Release

```bash
git checkout main
git merge hotfix/critical-fix
git push origin main
git push origin v1.0.1
npm publish
```

## Rollback Process

If a release has critical issues:

### 1. Deprecate npm Version

```bash
npm deprecate @moonsurf/browser-control@1.1.0 "Critical bug, use 1.0.x"
```

### 2. Unpublish (within 72 hours)

```bash
npm unpublish @moonsurf/browser-control@1.1.0
```

### 3. Revert Git

```bash
git revert HEAD
git push origin main
```

### 4. Create Fix Release

Follow normal release process for 1.1.1.

## Continuous Integration

### GitHub Actions for Release

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

## Changelog Format

Use [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Work in progress features

## [1.1.0] - 2024-01-15

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Features that will be removed

### Removed
- Features removed in this release

### Fixed
- Bug fixes

### Security
- Security fixes
```

## Version Compatibility

### MCP Protocol Version

Document supported MCP versions:
```
Moonsurf 1.x - MCP Protocol 2024-11-05
```

### Node.js Version

Document minimum Node.js version:
```
Requires Node.js 18+
```

### Browser Compatibility

Document supported browsers:
```
Chrome 90+
Chromium 90+
Chrome for Testing (any version)
```

## Related

- [Project Structure](project-structure.md) - Code organization
- [Testing](testing.md) - Test procedures
- [README](../../README.md) - Main documentation
