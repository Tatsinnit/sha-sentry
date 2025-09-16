#!/bin/bash

# Release helper script for SHA Sentry
# Usage: ./scripts/release.sh [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to validate version format
validate_version() {
    local version=$1
    if [[ ! $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
        print_error "Invalid version format: $version"
        print_error "Expected format: v1.2.3 or v1.2.3-beta"
        exit 1
    fi
}

# Function to check if version exists in changelog
check_changelog() {
    local version=$1
    local version_without_v=${version#v}
    
    if ! grep -q "## \[$version_without_v\]" CHANGELOG.md; then
        print_error "Version $version not found in CHANGELOG.md"
        print_error "Please add the version to CHANGELOG.md first"
        exit 1
    fi
    
    print_success "Version $version found in CHANGELOG.md"
}

# Function to check if tag already exists
check_tag_exists() {
    local version=$1
    
    if git rev-parse "$version" >/dev/null 2>&1; then
        print_warning "Tag $version already exists"
        read -p "Do you want to continue? This will overwrite the existing tag. (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Release cancelled"
            exit 0
        fi
    fi
}

# Function to run pre-release checks
run_checks() {
    print_status "Running pre-release checks..."
    
    # Check if we're on main branch
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]]; then
        print_warning "You're not on the main branch (current: $current_branch)"
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Release cancelled"
            exit 0
        fi
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_error "You have uncommitted changes"
        print_error "Please commit or stash your changes before releasing"
        exit 1
    fi
    
    # Run tests
    print_status "Running tests..."
    npm test
    print_success "All tests passed"
    
    # Run linting
    print_status "Running linting..."
    npm run lint
    print_success "Linting passed"
}

# Function to trigger release workflow
trigger_release() {
    local version=$1
    local prerelease=${2:-false}
    
    print_status "Triggering manual release workflow for $version..."
    
    gh workflow run manual-release.yml \
        --field version="$version" \
        --field prerelease="$prerelease" \
        --field create_tag="true"
    
    print_success "Release workflow triggered!"
    print_status "You can monitor the progress at:"
    print_status "https://github.com/Tatsinnit/sha-sentry/actions/workflows/manual-release.yml"
}

# Main script
main() {
    echo "🛡️  SHA Sentry Release Helper"
    echo "================================="
    
    local version=$1
    local prerelease=${2:-false}
    
    # If no version provided, show usage
    if [[ -z "$version" ]]; then
        echo "Usage: $0 <version> [prerelease]"
        echo ""
        echo "Examples:"
        echo "  $0 v2.1.0          # Release v2.1.0"
        echo "  $0 v2.1.0-beta     # Release v2.1.0-beta as prerelease"
        echo "  $0 v2.1.0 true     # Release v2.1.0 as prerelease"
        echo ""
        echo "Prerequisites:"
        echo "  - Version must exist in CHANGELOG.md"
        echo "  - All tests must pass"
        echo "  - No uncommitted changes"
        echo "  - GitHub CLI must be installed and authenticated"
        exit 1
    fi
    
    # Auto-detect prerelease from version string
    if [[ $version =~ -[a-zA-Z] ]]; then
        prerelease="true"
        print_status "Detected prerelease version: $version"
    fi
    
    # Validate version format
    validate_version "$version"
    print_success "Version format is valid"
    
    # Check if changelog has this version
    check_changelog "$version"
    
    # Check if tag already exists
    check_tag_exists "$version"
    
    # Run pre-release checks
    run_checks
    
    # Final confirmation
    echo ""
    print_status "Ready to release:"
    print_status "  Version: $version"
    print_status "  Prerelease: $prerelease"
    echo ""
    read -p "Proceed with release? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        trigger_release "$version" "$prerelease"
    else
        print_status "Release cancelled"
    fi
}

# Run main function with all arguments
main "$@"