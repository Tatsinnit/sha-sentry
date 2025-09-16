# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Manual release workflow with changelog integration
- GitHub Actions expression handling (skip `${{ }}` expressions)

### Changed
- Architecture pivoted to reporting-only mode for better security and permissions
- Complete transformation from modification-based to audit-based approach

## [5.0.0] - 2025-09-16

### Changed
- 🔖 Bumped package version to v5.0.0 and prepared release artifacts.
- 🧾 Minor documentation and release housekeeping (no functional changes since v4.0.0).


## [4.0.0] - 2025-09-16

### Added
- 🔍 Discover nested workflow files under `.github/workflows/**/*.yml` and `.github/workflows/**/*.yaml` (previously only flat directory patterns were searched).
- 🧩 Detect composite actions by indexing `action.yml` files under `.github/actions/**/action.yml`.
- 🎯 Support glob-style exclude patterns (via minimatch) for more precise file exclusions (supports patterns like `docs/**`, `**/*.yml`, `experimental/**`, etc.).
- 📋 Report excluded files and the matching exclude pattern in the GitHub Actions summary so auditing decisions are explicit and auditable.
- ⚖️ Case-insensitive matching for YAML file extensions to avoid false-negatives on case-sensitive runners (e.g. `.YML`, `.Yaml`).
- ✅ Added unit tests specifically covering composite-action discovery and glob-style excludes to prevent regressions.

### Changed
- ♻️ Broadened workflow discovery to include nested workflows and composite action manifests.
- 🛠️ Replace simple substring excludes with glob-style matching (minimatch) while keeping a safe substring fallback.
- 🧾 Enrich generated reports to include excluded files and matched patterns so reviewers can quickly identify why files were skipped.
- 🔁 Internal improvements to parsing logic and matching to reduce false-negatives when scanning repository-triggered runs.

### Fixed
- ✅ Correctly detect unpinned actions in workflows that are present in nested directories or use different file-extension casing.
- 🐛 Avoid false negatives for composite actions and repository-run workflows that weren't previously being scanned.

### Security
- 🛡️ Increased audit coverage by discovering more workflow/action files; improves supply-chain visibility and reduces attack surface.


## [3.0.0] - 2025-09-16

- 📊 **Remove unwanted skip**: RRemoved `{{` 


## [2.0.0] - 2025-09-16

### BREAKING CHANGES
- 🔄 **Complete architectural transformation**: Changed from file modification to reporting-only mode
- 🔒 **Permissions simplified**: Now only requires `contents: read` instead of write permissions  
- 📋 **No more Pull Requests**: Removed PR creation functionality to focus on security auditing
- ⚡ **Manual implementation**: Users now manually implement recommended SHA pins based on reports

### Added
- 🛡️ **Security audit mode**: Comprehensive scanning and reporting of unpinned actions
- 📊 **Detailed reporting**: Rich console output and GitHub Actions summary with recommendations
- 🎯 **SHA resolution**: Resolves action tags and branches to specific commit SHAs via GitHub API
- 🚫 **Smart filtering**: Skips local actions, Docker actions, and GitHub Actions expressions
- 🔍 **File discovery**: Automatic discovery of all workflow files in `.github/workflows/`
- ⚙️ **Configurable exclusions**: Support for exclude patterns to skip specific files
- 📈 **Comprehensive outputs**: Provides actionable metrics via GitHub Actions outputs
- ✅ **Full test coverage**: 12 comprehensive tests with 92%+ code coverage
- 🔄 **Async processing**: Proper async/await handling for reliable SHA resolution

### Changed
- **Core functionality**: From modification to reporting and recommendations
- **Permission model**: Reduced from write to read-only permissions
- **User workflow**: From automated changes to manual implementation with guidance
- **Documentation**: Complete rewrite focusing on security auditing capabilities

### Removed
- ❌ **Pull request creation**: No longer creates PRs to avoid permission complexity
- ❌ **File modification**: No longer directly modifies workflow files
- ❌ **Write permissions**: No longer requires `contents: write` or PR permissions

### Security
- 🛡️ **Enhanced security model**: Read-only approach prevents potential misuse
- 🔐 **No elevated permissions**: Works with minimal GitHub token permissions
- 📊 **Audit trail**: Provides clear reporting without making unauthorized changes
- ⚡ **Supply chain protection**: Identifies unpinned actions for manual remediation

## [1.0.0] - 2025-09-15

### Added
- 🔍 Automatic discovery of workflow files (.yml and .yaml)
- 🔒 SHA resolution via GitHub API for all action references
- 💬 Smart comment preservation with original references
- 🛡️ Dry-run mode for safe testing
- 📋 Pull request creation with detailed summaries
- ⚙️ Configurable exclude patterns
- 📊 Comprehensive logging and action outputs
- ✅ Jest test suite with mocking
- 🎨 ESLint and Prettier configuration
- 📖 Extensive documentation and examples

### Features
- Support for both direct commits and pull request workflows
- Custom commit messages and PR titles/bodies
- Skip already SHA-pinned actions (40-char hex detection)
- Skip local actions (starting with ./)
- Detailed error handling and user-friendly messages
- GitHub Actions outputs for integration with other steps

### Security
- Prevents supply chain attacks through SHA pinning
- Ensures reproducible builds across environments
- Follows GitHub Actions security best practices

[unreleased]: https://github.com/Tatsinnit/sha-sentry/compare/v4.0.0...HEAD
[5.0.0]: https://github.com/Tatsinnit/sha-sentry/releases/tag/v5.0.0
[4.0.0]: https://github.com/Tatsinnit/sha-sentry/releases/tag/v4.0.0
[3.0.0]: https://github.com/Tatsinnit/sha-sentry/releases/tag/v3.0.0
[2.0.0]: https://github.com/Tatsinnit/sha-sentry/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/Tatsinnit/sha-sentry/releases/tag/v1.0.0