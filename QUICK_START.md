## SHA Sentry 🛡️ - Quick Test

Let's test our GitHub Action with a sample workflow file to see how it works:

### Sample Input Workflow (before SHA pinning):

```yaml
name: Sample CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
      - uses: docker/build-push-action@v5
```

### Expected Output (after SHA pinning):

```yaml
name: Sample CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608 # v4
      - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8 # v3
      - uses: docker/build-push-action@2eb1c1961a95fc15694676618e422e8ba1d63825 # v5
```

### How to Use SHA Sentry in Your Repository:

1. **Add the workflow file** (`.github/workflows/sha-sentry.yml`):

```yaml
name: SHA Pin Actions
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  sha-pin:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/sha-sentry@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          create_pr: true
```

2. **Manual trigger** from the Actions tab in your GitHub repository

3. **Review the pull request** created by the action

4. **Merge** to apply the security improvements

### Key Features:

✅ **Automatic detection** of all workflow files  
✅ **SHA resolution** via GitHub API  
✅ **Comment preservation** with original references  
✅ **Pull request creation** for safe review  
✅ **Dry run mode** for testing  
✅ **Exclude patterns** for flexibility  
✅ **Comprehensive logging** and error handling  

Your GitHub Actions are now secure and reproducible! 🎉