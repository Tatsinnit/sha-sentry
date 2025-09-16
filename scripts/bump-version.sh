#!/bin/bash

# SHA Sentry Version Bump Script
# Usage: ./scripts/bump-version.sh [major|minor|patch]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "action.yml" ]; then
    print_error "This script must be run from the root of the sha-sentry repository"
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_error "Git working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Determine version type
VERSION_TYPE=${1:-patch}

if [ "$VERSION_TYPE" != "major" ] && [ "$VERSION_TYPE" != "minor" ] && [ "$VERSION_TYPE" != "patch" ]; then
    print_error "Invalid version type. Use: major, minor, or patch"
    exit 1
fi

print_status "Bumping $VERSION_TYPE version..."

# Install semver if not present
if ! command -v semver &> /dev/null; then
    print_status "Installing semver globally..."
    npm install -g semver
fi

# Calculate new version
NEW_VERSION=$(semver $CURRENT_VERSION -i $VERSION_TYPE)
print_status "New version will be: $NEW_VERSION"

# Confirm with user
read -p "Continue with version bump to $NEW_VERSION? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Version bump cancelled"
    exit 0
fi

# Update package.json
print_status "Updating package.json..."
npm version $NEW_VERSION --no-git-tag-version

# Update README.md examples
print_status "Updating README.md examples..."
sed -i '' "s/sha-sentry@v[0-9]\+\.[0-9]\+\.[0-9]\+/sha-sentry@v$NEW_VERSION/g" README.md
sed -i '' "s/sha-sentry@v[0-9]\+/sha-sentry@v$(echo $NEW_VERSION | cut -d. -f1)/g" README.md

# Update CHANGELOG.md
print_status "Updating CHANGELOG.md..."
TODAY=$(date +%Y-%m-%d)
sed -i '' "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $TODAY/" CHANGELOG.md

# Update changelog links
MAJOR_VERSION=$(echo $NEW_VERSION | cut -d. -f1)
sed -i '' "s|\[unreleased\]: .*|\[unreleased\]: https://github.com/Tatsinnit/sha-sentry/compare/v$NEW_VERSION...HEAD\n[$NEW_VERSION]: https://github.com/Tatsinnit/sha-sentry/compare/v$CURRENT_VERSION...v$NEW_VERSION|" CHANGELOG.md

print_success "Files updated successfully!"

# Show changes
print_status "Changes made:"
git diff --name-only

# Commit changes
print_status "Committing changes..."
git add package.json README.md CHANGELOG.md package-lock.json 2>/dev/null || true
git commit -m "chore: bump version to v$NEW_VERSION"

# Create and push tag
print_status "Creating and pushing tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"

print_success "Version bumped to v$NEW_VERSION!"
print_status "Next steps:"
echo "  1. Review the changes: git show"
echo "  2. Push to trigger release: git push origin main && git push origin v$NEW_VERSION"
echo "  3. Check the release workflow: https://github.com/Tatsinnit/sha-sentry/actions"
echo ""
print_warning "The release workflow will automatically:"
echo "  • Run tests and linting"
echo "  • Create a GitHub release"
echo "  • Update the major version tag (v$MAJOR_VERSION)"