# 🚀 Complete Release Process for SHA Sentry

This document provides step-by-step instructions for creating releases using semantic versioning.

## Quick Release Commands

### Automated Way (Recommended)

```bash
# For patch releases (bug fixes)
./scripts/bump-version.sh patch

# For minor releases (new features)
./scripts/bump-version.sh minor

# For major releases (breaking changes)
./scripts/bump-version.sh major

# Then push to trigger the release
git push origin main && git push origin $(git describe --tags --abbrev=0)
```

### Manual Way

```bash
# 1. Update version in package.json
npm version 1.2.3 --no-git-tag-version

# 2. Update README.md and CHANGELOG.md manually

# 3. Commit changes
git add .
git commit -m "chore: bump version to v1.2.3"

# 4. Create and push tag
git tag v1.2.3
git push origin main && git push origin v1.2.3
```

## Semantic Versioning Strategy

| Version Type | When to Use | Example | 
|--------------|-------------|---------|
| **Patch** (1.0.1) | Bug fixes, security updates, documentation | Fixed YAML parsing bug |
| **Minor** (1.1.0) | New features, new inputs/outputs, enhancements | Added exclude patterns |
| **Major** (2.0.0) | Breaking changes, removed features, changed behavior | Changed input names |

## Pre-Release Checklist

Before creating any release, ensure:

- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Documentation is updated
- [ ] CHANGELOG.md reflects changes
- [ ] No uncommitted changes: `git status`
- [ ] You're on the main branch: `git branch --show-current`

## Release Workflow

### 1. Prepare the Release

```bash
# Check current status
git status
git branch --show-current  # Should be 'main'
npm test                   # Should pass
npm run lint               # Should pass

# Pull latest changes
git pull origin main
```

### 2. Bump Version

```bash
# Use the automated script (recommended)
./scripts/bump-version.sh patch  # or minor, major

# Or manually update package.json
npm version 1.2.3 --no-git-tag-version
```

### 3. Update Documentation

The script automatically updates:
- `package.json` version
- `README.md` examples  
- `CHANGELOG.md` with new version and date

### 4. Review Changes

```bash
# Review what will be committed
git diff

# Check the version is correct
node -p "require('./package.json').version"
```

### 5. Commit and Tag

```bash
# If using the script, this is done automatically
# Manual way:
git add .
git commit -m "chore: bump version to v1.2.3"
git tag v1.2.3
```

### 6. Push and Trigger Release

```bash
# Push main branch and tags
git push origin main
git push origin v1.2.3

# Or push both at once
git push origin main && git push origin $(git describe --tags --abbrev=0)
```

### 7. Monitor Release

1. **Check GitHub Actions**: Go to Actions tab and verify the release workflow succeeds
2. **Verify Release**: Check the Releases page for the new release
3. **Test Major Tag**: Confirm `v1` tag points to the latest `v1.x.x` release

## What Happens During Automated Release

The `.github/workflows/release.yml` workflow:

1. ✅ **Runs Tests**: Ensures code quality
2. 📝 **Generates Release Notes**: Creates detailed release description  
3. 🏷️ **Creates GitHub Release**: With proper changelog
4. 🔄 **Updates Major Version Tag**: So users can use `@v1`
5. 📣 **Notifies Success**: Shows release URL and information

## Using Released Versions

Users can reference your action in three ways:

```yaml
# Recommended: Major version (gets latest patches/features)
- uses: your-org/sha-sentry@v1

# Specific version (completely reproducible)
- uses: your-org/sha-sentry@v1.2.3

# Latest (not recommended for production)
- uses: your-org/sha-sentry@main
```

## Pre-Release Versions

For testing new features:

```bash
# Alpha version
git tag v1.3.0-alpha.1

# Beta version  
git tag v1.3.0-beta.1

# Release candidate
git tag v1.3.0-rc.1

# Push pre-release tags
git push origin v1.3.0-alpha.1
```

Pre-releases won't update the major version tag automatically.

## Hotfix Process

For urgent bug fixes:

```bash
# 1. Create hotfix branch from latest release
git checkout -b hotfix/v1.0.1 v1.0.0

# 2. Make minimal fixes
# ... edit files ...

# 3. Test thoroughly
npm test

# 4. Update version and changelog
./scripts/bump-version.sh patch

# 5. Merge back to main
git checkout main
git merge hotfix/v1.0.1

# 6. Push to trigger release
git push origin main && git push origin v1.0.1

# 7. Delete hotfix branch
git branch -d hotfix/v1.0.1
```

## Release Validation

After each release, verify:

1. **Release Page**: GitHub release was created successfully
2. **Major Tag**: `v1` points to latest `v1.x.x` (check Tags page)
3. **Action Works**: Test the new version in a test repository
4. **Documentation**: All links and examples are correct

## Troubleshooting

### Release Workflow Failed

Check the Actions tab for error details:

```bash
# Common issues:
# - Tests failed: Fix tests and re-tag
# - Linting failed: Run npm run lint locally
# - Permission issues: Check GITHUB_TOKEN permissions
```

### Major Version Tag Not Updated

```bash
# Manually update major version tag
git tag -f v1
git push origin v1 --force
```

### Wrong Version Tagged

```bash
# Delete local and remote tag
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3

# Re-run the bump script with correct version
```

## Example Release Flow

Here's a complete example of releasing version 1.2.0:

```bash
# Starting from clean main branch
git checkout main
git pull origin main
git status  # Should be clean

# Run automated version bump
./scripts/bump-version.sh minor

# Script output:
# [INFO] Current version: 1.1.0
# [INFO] New version will be: 1.2.0
# Continue with version bump to 1.2.0? (y/N): y
# [SUCCESS] Version bumped to v1.2.0!

# Push to trigger release
git push origin main && git push origin v1.2.0

# Monitor at: https://github.com/your-org/sha-sentry/actions
# Release available at: https://github.com/your-org/sha-sentry/releases
```

That's it! Your SHA Sentry action is now properly versioned and released following industry best practices. 🎉

## Next Steps

After releasing:

1. **Update dependents**: Notify users about new features
2. **Monitor usage**: Check for any issues with the new version  
3. **Plan next release**: Based on user feedback and feature requests