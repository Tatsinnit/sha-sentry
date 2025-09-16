# Release Guide for SHA Sentry

This guide explains how to create releases using semantic versioning for the SHA Sentry GitHub Action.

## Semantic Versioning (SemVer)

We follow [Semantic Versioning](https://semver.org/) with the format: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes that are not backward compatible
- **MINOR** (1.0.0 → 1.1.0): New features that are backward compatible  
- **PATCH** (1.0.0 → 1.0.1): Bug fixes that are backward compatible

## Pre-Release Process

### 1. Update Version Numbers

Before creating a release, update version numbers in relevant files:

**package.json:**
```json
{
  "version": "1.2.3"
}
```

**README.md examples:**
```yaml
- uses: Tatsinnit/sha-sentry@v1.2.3
```

### 2. Update CHANGELOG

Create or update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [1.2.3] - 2025-09-15

### Added
- New exclude patterns feature
- Support for custom commit messages

### Changed  
- Improved error handling for API rate limits

### Fixed
- Fixed issue with parsing YAML comments
```

### 3. Commit Changes

```bash
git add .
git commit -m "chore: bump version to 1.2.3"
git push origin main
```

## Creating Releases

### Method 1: GitHub Web UI (Recommended)

1. **Go to your repository** on GitHub
2. **Click "Releases"** in the right sidebar
3. **Click "Create a new release"**
4. **Choose or create a tag:**
   - Tag version: `v1.2.3` (include the 'v' prefix)
   - Target: `main` branch
5. **Fill in release details:**
   - Release title: `v1.2.3`
   - Description: Copy from CHANGELOG.md
6. **Check "Set as the latest release"**
7. **Click "Publish release"**

### Method 2: Command Line with GitHub CLI

```bash
# Install GitHub CLI if not already installed
brew install gh

# Authenticate (first time only)
gh auth login

# Create and push tag
git tag v1.2.3
git push origin v1.2.3

# Create release
gh release create v1.2.3 \
  --title "v1.2.3" \
  --notes-file CHANGELOG.md \
  --latest
```

### Method 3: Automated with GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref_name }}
          release_name: ${{ github.ref_name }}
          draft: false
          prerelease: false
```

## Major Version Tags

For GitHub Actions, create major version tags (v1, v2) that point to the latest version:

```bash
# After releasing v1.2.3, update the v1 tag
git tag -f v1
git push origin v1 --force
```

This allows users to use:
- `@v1` (latest v1.x.x - recommended for stability)
- `@v1.2.3` (exact version - recommended for reproducibility)
- `@main` (bleeding edge - not recommended for production)

## Complete Release Workflow

Here's the complete step-by-step process:

1. **Make your changes** and test thoroughly
2. **Update version** in package.json
3. **Update CHANGELOG.md** with new version details
4. **Update README.md** examples with new version
5. **Commit changes:** `git commit -m "chore: bump version to v1.2.3"`
6. **Push to main:** `git push origin main`
7. **Create and push tag:** `git tag v1.2.3 && git push origin v1.2.3`
8. **Create GitHub release** (using web UI or CLI)
9. **Update major version tag:** `git tag -f v1 && git push origin v1 --force`
10. **Announce** the release to users

## Pre-release Versions

For testing new features, use pre-release versions:

```bash
# Alpha release
git tag v1.3.0-alpha.1

# Beta release  
git tag v1.3.0-beta.1

# Release candidate
git tag v1.3.0-rc.1
```

## Version Strategy Recommendations

- **Patch releases (1.0.x)**: Bug fixes, security updates, documentation
- **Minor releases (1.x.0)**: New features, enhancements, new inputs/outputs
- **Major releases (x.0.0)**: Breaking changes, changed behavior, removed features

## Example Release Notes Template

```markdown
## What's Changed 🚀

### ✨ New Features
- Added support for custom exclude patterns (#123)
- Improved dry-run output formatting (#124)

### 🐛 Bug Fixes  
- Fixed issue with YAML parsing edge cases (#125)
- Resolved API rate limiting problems (#126)

### 📖 Documentation
- Updated README with new examples
- Added troubleshooting section

### 🔧 Internal Changes
- Updated dependencies to latest versions
- Improved test coverage

**Full Changelog**: https://github.com/Tatsinnit/sha-sentry/compare/v1.1.0...v1.2.0
```

## Testing Releases

Before announcing:

1. **Test the action** in a test repository
2. **Verify the tag** points to correct commit
3. **Check the release notes** are accurate
4. **Ensure major version tag** is updated

That's it! Your SHA Sentry action is now properly versioned and released following best practices. 🎉