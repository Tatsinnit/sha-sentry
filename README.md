# SHA Sentry 🛡️

[![GitHub release](https://img.shields.io/github/release/Tatsinnit/sha-sentry.svg)](https://github.com/Tatsinnit/sha-sentry/releases)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-sha--sentry-blue?logo=github)](https://github.com/marketplace/actions/sha-sentry)
[![CI](https://github.com/Tatsinnit/sha-sentry/workflows/CI/badge.svg)](https://github.com/Tatsinnit/sha-sentry/actions)

A GitHub Action that automatically SHA-pins all GitHub Actions in your workflow files for enhanced security and reproducible builds. Say goodbye to supply chain attacks and hello to security best practices! 🚀

## 🌟 Why SHA Sentry?

- **🔒 Enhanced Security**: Prevents supply chain attacks by pinning actions to specific commit SHAs
- **🔄 Reproducible Builds**: Ensures your workflows always use the exact same action versions
- **🤖 Automated**: No manual work required - just run the action and it handles everything
- **💬 Maintains Context**: Adds comments with original references for easy maintenance
- **🛡️ Safe**: Supports dry-run mode and can create pull requests for review
- **⚙️ Configurable**: Exclude patterns, custom commit messages, and more

## 🚀 Quick Start

**Important**: To process workflow files (the main purpose of SHA Sentry), you need a Personal Access Token.

### Step 1: Create Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` and `workflow` scopes
3. Add as repository secret named `PAT_TOKEN`

### Step 2: Add Workflow
Create `.github/workflows/sha-sentry.yml`:

```yaml
name: SHA Pin Actions
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:      # Manual trigger

jobs:
  sha-pin:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: SHA Pin Actions in Workflows
        uses: Tatsinnit/sha-sentry@v1
        with:
          github_token: ${{ secrets.PAT_TOKEN }}  # Required for workflow files
          create_pr: true
```

## 📋 Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github_token` | GitHub token for API access | ✅ | `${{ github.token }}` |
| `commit_message` | Commit message for changes | ❌ | `chore: SHA-pin GitHub Actions for security` |
| `create_pr` | Create pull request instead of direct commit | ❌ | `false` |
| `pr_title` | Pull request title | ❌ | `chore: SHA-pin GitHub Actions for security` |
| `pr_body` | Pull request body | ❌ | Auto-generated description |
| `exclude_patterns` | Comma-separated patterns to exclude | ❌ | `''` |
| `dry_run` | Show changes without applying them | ❌ | `false` |

## 📤 Outputs

| Output | Description |
|--------|-------------|
| `changes_made` | Whether any changes were made |
| `files_updated` | Number of workflow files updated |
| `actions_pinned` | Number of actions that were SHA-pinned |
| `pr_number` | Pull request number (if created) |

## 📖 Usage Examples

### Basic Usage (Direct Commit)

```yaml
- name: SHA Pin Actions
  uses: Tatsinnit/sha-sentry@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Create Pull Request

```yaml
- name: SHA Pin Actions
  uses: Tatsinnit/sha-sentry@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    create_pr: true
    pr_title: "🔒 Security: SHA-pin GitHub Actions"
    pr_body: |
      This PR SHA-pins all GitHub Actions for enhanced security.
      
      - ✅ Prevents supply chain attacks
      - ✅ Ensures reproducible builds
      - ✅ Follows security best practices
```

### Dry Run Mode

```yaml
- name: Check SHA Pinning
  uses: Tatsinnit/sha-sentry@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    dry_run: true
```

### Exclude Specific Actions

```yaml
- name: SHA Pin Actions
  uses: Tatsinnit/sha-sentry@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    exclude_patterns: "actions/checkout,actions/setup-node"
```

## 🔄 Before and After

**Before (vulnerable to supply chain attacks):**
```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v3
- uses: docker/build-push-action@v5
```

**After (secure and reproducible):**
```yaml
- uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608 # v4
- uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8 # v3
- uses: docker/build-push-action@2eb1c1961a95fc15694676618e422e8ba1d63825 # v5
```

## 🛡️ Security Features

### What Gets Pinned?
- ✅ Tag references (`actions/checkout@v4` → `actions/checkout@8ade135a...`)
- ✅ Branch references (`actions/checkout@main` → `actions/checkout@8ade135a...`)
- ✅ Partial SHA references (`actions/checkout@8ade135` → `actions/checkout@8ade135a...`)

### What Doesn't Get Pinned?
- ❌ Already full SHA-pinned actions (40 characters)
- ❌ Local actions (starting with `./`)
- ❌ Actions matching exclude patterns

## 🔧 Advanced Configuration

### Custom Commit Message
```yaml
- uses: Tatsinnit/sha-sentry@v1
  with:
    commit_message: "security: pin all GitHub Actions to SHA commits"
```

### Multiple Exclude Patterns
```yaml
- uses: Tatsinnit/sha-sentry@v1
  with:
    exclude_patterns: "actions/checkout,actions/setup-node,docker/*"
```

## 🔍 Permissions Required

SHA Sentry is designed to SHA-pin actions in workflow files. The default `GITHUB_TOKEN` cannot modify workflows for security reasons.

### **Required Setup (Personal Access Token):**

1. **Create a Personal Access Token:**
   - Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes: `repo` and `workflow`
   - Copy the generated token

2. **Add PAT as Repository Secret:**
   - Go to your repository Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `PAT_TOKEN`
   - Value: Your PAT token

3. **Use in Workflow:**
```yaml
permissions:
  contents: write
  pull-requests: write

steps:
  - uses: Tatsinnit/sha-sentry@v1
    with:
      github_token: ${{ secrets.PAT_TOKEN }}  # Required for workflow files
      create_pr: true
```

### **Why PAT is Required:**
- Workflow files contain the security-critical automation logic
- GitHub prevents the default token from modifying workflows to prevent privilege escalation
- SHA-pinning workflows requires the `workflow` permission that only PATs have

### **Fallback - Skip Workflows (Not Recommended):**
Only use this if you cannot create a PAT:
```yaml
- uses: Tatsinnit/sha-sentry@v1
  with:
    exclude_patterns: ".github/workflows"  # Defeats the main purpose
```

## 🏃‍♂️ Running Locally

You can test the action locally:

```bash
# Install dependencies
npm install

# Set environment variables
export GITHUB_TOKEN="your-token"
export DRY_RUN="true"

# Run the action
node src/index.js
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋‍♂️ Support

- 📖 [Documentation](https://github.com/Tatsinnit/sha-sentry/wiki)
- 🐛 [Report Issues](https://github.com/Tatsinnit/sha-sentry/issues)
- 💬 [Discussions](https://github.com/Tatsinnit/sha-sentry/discussions)

---

**Made with ❤️ for supply chain security**

> ⚠️ **Security Note**: Always review the changes made by this action, especially in production environments. While SHA-pinning enhances security, it's important to understand what each pinned action does.