#!/bin/bash

# Script to bump the package.json version and regenerate version info
# This creates a new build version with updated package version + git hash

echo "Bumping version for testing updates..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository. This script requires git."
    exit 1
fi

# Get current package version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current package version: $CURRENT_VERSION"

# Extract version parts
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Increment patch version
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

echo "New package version: $NEW_VERSION"

# Update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Package.json updated to version: $NEW_VERSION"

# Generate new version information
echo "Generating new version information..."
./scripts/generate-version.sh

# Get the new build version
NEW_BUILD_VERSION=$(node -p "require('./public/version.json').buildVersion")
echo "New build version: $NEW_BUILD_VERSION"

echo ""
echo "Version bump completed!"
echo "Package version: $NEW_VERSION"
echo "Build version: $NEW_BUILD_VERSION"
echo ""
echo "To test the update:"
echo "1. Run: npm run build:version"
echo "2. Deploy the updated app"
echo "3. Open the app in a browser"
echo "4. The service worker will detect the new version"
echo "5. An update banner will appear at the top"
echo "6. Click 'Update Now' to apply the update"
echo ""
echo "You can also check the version info in Settings > Version Information"
