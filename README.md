# SHA Sentry 🔍

[![GitHub release](https://img.shields.io/github/release/Tatsinnit/sha-sentry.svg)](https://github.com/Tatsinnit/sha-sentry/releases)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-sha--sentry-blue?logo=github)](https://github.com/marketplace/actions/sha-sentry)
[![CI](https://github.com/Tatsinnit/sha-sentry/workflows/CI/badge.svg)](https://github.com/Tatsinnit/sha-sentry/actions)

A GitHub Action that **scans and reports** unpinned GitHub Actions in your workflow files with detailed SHA recommendations. Perfect for security audits and compliance checks! 🛡️

## 🌟 Why SHA Sentry?

- **🔍 Security Audit**: Identifies all unpinned actions that could be security risks
- **📋 Detailed Reports**: Provides exact SHA commits for each unpinned action  
- **🎯 Precise Recommendations**: Shows you exactly what to change and where
- **⚡ Zero Risk**: Only scans and reports - never modifies your files
- **🏃‍♂️ Easy Setup**: Works with default GitHub token, no special permissions needed
- **📊 Comprehensive**: Scans all workflow files and action.yml files

## 🚀 Quick Start

Add this workflow to your repository (`.github/workflows/sha-audit.yml`):

```yaml
name: SHA Security Audit
on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  workflow_dispatch:      # Manual trigger

jobs:
  security-audit:
    runs-on: ubuntu-latest
    permissions:
      contents: read    # Only read access needed
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Run SHA Sentry Audit
        uses: Tatsinnit/sha-sentry@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## 📋 What You Get

When SHA Sentry runs, it provides:

### 📊 Console Output
```
🔍 Starting SHA Sentry - scanning for unpinned actions...
📁 Found 3 workflow files to scan
🔍 Scanning: .github/workflows/ci.yml
🔍 Found unpinned action: actions/checkout@v4
🎯 Resolved to SHA: 8aca7672a9e6a874d8faa6b8f98a5212554c65cd
📄 File: .github/workflows/ci.yml
  ⚠️  actions/checkout@v4 → actions/checkout@8aca7672a9e6a874d8faa6b8f98a5212554c65cd (line 15)

💡 Next Steps:
  1. Review the actions above
  2. Manually update your workflow files with the SHA-pinned versions
  3. Add comments to preserve the original version references
  4. Test your workflows to ensure they still work correctly
```

### 📋 Detailed GitHub Summary Report
A comprehensive markdown report in the Actions summary with:
- File-by-file breakdown
- Line numbers for each finding
- Before/after code examples
- Copy-paste ready SHA-pinned versions

## 📋 Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github_token` | GitHub token for API access | ✅ | `${{ github.token }}` |
| `exclude_patterns` | Comma-separated patterns to exclude | ❌ | `''` |

## 📤 Outputs

| Output | Description |
|--------|-------------|
| `files_scanned` | Number of workflow files scanned |
| `total_actions` | Total number of actions found |
| `unpinned_actions_found` | Number of unpinned actions discovered |
| `findings` | JSON array of detailed findings |

## 🔧 Example Usage Scenarios

### Basic Security Audit
```yaml
- name: Security Audit
  uses: Tatsinnit/sha-sentry@v1
```

### Exclude Certain Files
```yaml
- name: Audit Core Workflows Only
  uses: Tatsinnit/sha-sentry@v1
  with:
    exclude_patterns: "docs/,.github/workflows/experimental"
```

### Use in Matrix Strategy
```yaml
strategy:
  matrix:
    directory: ['frontend', 'backend', 'scripts']
steps:
  - name: Audit ${{ matrix.directory }}
    uses: Tatsinnit/sha-sentry@v1
    with:
      exclude_patterns: "${{ matrix.directory == 'frontend' && 'backend,scripts' || matrix.directory == 'backend' && 'frontend,scripts' || 'frontend,backend' }}"
```

## 🔒 Security Benefits

SHA-pinning your actions prevents supply chain attacks where malicious actors could:

### 🚫 Without SHA Pinning
```yaml
uses: actions/checkout@v4  # ⚠️ Vulnerable - tag can be moved
```
- Attacker pushes malicious code to the `v4` tag
- Your workflow uses the compromised action
- Security breach in your repository

### ✅ With SHA Pinning  
```yaml
uses: actions/checkout@8aca7672a9e6a874d8faa6b8f98a5212554c65cd  # v4 ✅ Secure
```
- Action is pinned to a specific commit
- Attacker cannot modify that specific SHA
- Your workflow is protected against supply chain attacks

## 📁 What Gets Scanned

SHA Sentry automatically finds and analyzes:
- `.github/workflows/*.yml`
- `.github/workflows/*.yaml` 
- `action.yml` (composite actions)
- `action.yaml` (composite actions)

## 🎯 Manual Implementation Guide

After running SHA Sentry, follow these steps to implement the recommendations:

### 1. Review the Report
Check the Actions summary tab for the detailed breakdown.

### 2. Update Your Files
Replace unpinned actions with SHA-pinned versions:

```yaml
# Before (from SHA Sentry report)
uses: actions/setup-node@v4

# After (copy from SHA Sentry recommendations)  
uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8  # v4
```

### 3. Add Comments
Always include the original version as a comment:
```yaml
uses: actions/checkout@8aca7672a9e6a874d8faa6b8f98a5212554c65cd  # v4
```

### 4. Test Your Workflows
Run your workflows to ensure they still work correctly after pinning.

## 🏃‍♂️ Running Locally

Test SHA Sentry on your local repository:

```bash
# Install dependencies
npm install

# Set your GitHub token
export GITHUB_TOKEN="your-personal-access-token"

# Run the scanner
node src/index.js
```

## 🤝 Contributing

Contributions welcome! Please:
1. 🍴 Fork the repository
2. 🌱 Create a feature branch
3. 📝 Add tests for your changes  
4. ✅ Ensure all tests pass
5. 📤 Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

Created with ❤️ for the open source community. Special thanks to all contributors and the GitHub security team for their continued efforts to improve action security.