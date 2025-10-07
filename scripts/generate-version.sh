#!/bin/bash

# Build script that generates version information from package.json and git
# This creates a version.js file that can be imported by the app

echo "Generating version information..."

# Get package.json version
PACKAGE_VERSION=$(node -p "require('./package.json').version")

# Get git commit hash (short)
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Get git commit hash (full)
GIT_HASH_FULL=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

# Get build timestamp
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get git branch
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Create version object
cat > src/version.js << EOF
// Auto-generated version file - do not edit manually
// Generated on: $BUILD_TIMESTAMP

export const VERSION_INFO = {
  version: '$PACKAGE_VERSION',
  gitHash: '$GIT_HASH',
  gitHashFull: '$GIT_HASH_FULL',
  buildTimestamp: '$BUILD_TIMESTAMP',
  gitBranch: '$GIT_BRANCH',
  buildVersion: '$PACKAGE_VERSION+$GIT_HASH'
};

export default VERSION_INFO;
EOF

echo "Version information generated:"
echo "  Package Version: $PACKAGE_VERSION"
echo "  Git Hash: $GIT_HASH"
echo "  Build Version: $PACKAGE_VERSION+$GIT_HASH"
echo "  Branch: $GIT_BRANCH"
echo "  Timestamp: $BUILD_TIMESTAMP"
echo ""
echo "Version file created at: src/version.js"

# Also create a version file for the service worker
cat > public/version.json << EOF
{
  "version": "$PACKAGE_VERSION",
  "gitHash": "$GIT_HASH",
  "gitHashFull": "$GIT_HASH_FULL",
  "buildTimestamp": "$BUILD_TIMESTAMP",
  "gitBranch": "$GIT_BRANCH",
  "buildVersion": "$PACKAGE_VERSION+$GIT_HASH"
}
EOF

echo "Service worker version file created at: public/version.json"
