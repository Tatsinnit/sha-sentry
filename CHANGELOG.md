# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of SHA Sentry GitHub Action

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

[unreleased]: https://github.com/Tatsinnit/sha-sentry/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Tatsinnit/sha-sentry/releases/tag/v1.0.0