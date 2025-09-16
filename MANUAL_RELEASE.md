# Manual Release Guide

This guide explains how to create releases using the manual release workflow that reads from the CHANGELOG.md.

## 🚀 Quick Release

The easiest way to create a release is using the helper script:

```bash
# Make sure you're on the main branch with no uncommitted changes
git checkout main
git pull origin main

# Run the release script
./scripts/release.sh v2.0.0
```

## 📋 Manual Release via GitHub Actions

You can also trigger releases manually via the GitHub Actions interface:

1. Go to [Actions → Manual Release](https://github.com/Tatsinnit/sha-sentry/actions/workflows/manual-release.yml)
2. Click **"Run workflow"**
3. Fill in the parameters:
   - **Version**: `v2.0.0` (must match changelog entry)
   - **Pre-release**: Check if this is a beta/alpha release
   - **Create tag**: Check to create the git tag automatically

## 📝 Prerequisites

Before creating a release, ensure:

### 1. Version in CHANGELOG.md
The version must exist in `CHANGELOG.md` with the correct format:

```markdown
## [2.0.0] - 2025-09-16

### Added
- New feature description

### Changed  
- Changed feature description

### Fixed
- Bug fix description
```

### 2. All Tests Pass
```bash
npm test
npm run lint
```

### 3. Clean Git State
- All changes committed
- Working on main branch
- Synced with remote

## 🔄 Release Process

The manual release workflow will:

1. **Validate** the version format (`v1.2.3` or `v1.2.3-beta`)
2. **Extract** changelog content for the specified version
3. **Run tests** and linting to ensure quality
4. **Create git tag** (if requested)
5. **Generate formatted release notes** from changelog
6. **Create GitHub release** with the formatted notes
7. **Update major version tag** (e.g., `v2` → `v2.0.0`)
8. **Self-test** by running SHA Sentry on itself

## 📦 Release Outputs

After successful release, you'll get:

- ✅ **GitHub Release** with formatted notes
- 🏷️ **Git Tags**: Both specific (`v2.0.0`) and major (`v2`)
- 📊 **Release Summary** in the workflow output
- 🔗 **Direct links** to view the release and documentation

## 🔧 Customization

### Version Format
Supported version formats:
- `v1.2.3` - Standard semantic version
- `v1.2.3-beta` - Pre-release version
- `v1.2.3-alpha.1` - Pre-release with build number

### Changelog Format
The workflow parses standard [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.2.3] - 2025-09-16

### Added
- New features

### Changed
- Breaking changes

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

## 🚨 Troubleshooting

### "Version not found in changelog"
- Ensure the version exists in `CHANGELOG.md`
- Check the exact format: `## [1.2.3] - YYYY-MM-DD`
- Version should not include the `v` prefix in the changelog

### "Tag already exists"
- The git tag already exists for this version
- Either choose a new version or delete the existing tag
- Use the script's confirmation prompt to overwrite

### "Tests failed"
- Fix any failing tests before releasing
- Run `npm test` and `npm run lint` locally first
- Ensure all code quality checks pass

## 📚 Examples

### Regular Release
```bash
# Release version 2.1.0
./scripts/release.sh v2.1.0
```

### Pre-release
```bash
# Release beta version  
./scripts/release.sh v2.1.0-beta
```

### Manual GitHub UI Release
1. Go to Actions → Manual Release
2. Click "Run workflow"
3. Set version to `v2.1.0`
4. Check/uncheck pre-release as needed
5. Click "Run workflow"

## 🔗 Related Files

- [`manual-release.yml`](.github/workflows/manual-release.yml) - The workflow file
- [`CHANGELOG.md`](CHANGELOG.md) - Version history and release notes
- [`scripts/release.sh`](scripts/release.sh) - Release helper script
- [`release.yml`](.github/workflows/release.yml) - Tag-triggered release (legacy)