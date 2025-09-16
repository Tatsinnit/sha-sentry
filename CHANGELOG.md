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

[unreleased]: https://github.com/Tatsinnit/sha-sentry/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/Tatsinnit/sha-sentry/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/Tatsinnit/sha-sentry/releases/tag/v1.0.0