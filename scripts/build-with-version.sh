#!/bin/bash

# Enhanced build script that generates version and injects it into service worker

echo "Building Phone Lookie with version information..."

# Generate version information
echo "Generating version information..."
./scripts/generate-version.sh

# Read the generated version info
VERSION_FILE="public/version.json"
if [ ! -f "$VERSION_FILE" ]; then
    echo "Error: Version file not found. Run generate-version.sh first."
    exit 1
fi

# Extract version info
BUILD_VERSION=$(node -p "require('./public/version.json').buildVersion")
PACKAGE_VERSION=$(node -p "require('./public/version.json').version")
GIT_HASH=$(node -p "require('./public/version.json').gitHash")
BUILD_TIMESTAMP=$(node -p "require('./public/version.json').buildTimestamp")

echo "Build version: $BUILD_VERSION"

# Create a temporary service worker with version injection
echo "Injecting version into service worker..."

# Create a version injection script
cat > inject-version.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Read version info
const versionInfo = JSON.parse(fs.readFileSync('public/version.json', 'utf8'));

// Read service worker
let swContent = fs.readFileSync('public/sw.js', 'utf8');

// Inject version info at the top
const versionInjection = `
// Auto-injected version information
self.VERSION_INFO = ${JSON.stringify(versionInfo, null, 2)};
`;

// Replace the version placeholder
swContent = swContent.replace(
    /\/\/ Version will be injected during build process[\s\S]*?const VERSION_INFO = self\.VERSION_INFO \|\| \{ buildVersion: '[^']*' \};/,
    versionInjection + 'const VERSION_INFO = self.VERSION_INFO;'
);

// Write the updated service worker
fs.writeFileSync('public/sw.js', swContent);

console.log('Version injected into service worker');
EOF

# Run the injection script
node inject-version.js

# Clean up
rm inject-version.js

echo "Service worker updated with version: $BUILD_VERSION"

# Build the React app
echo "Building React app..."
npm run build

echo ""
echo "Build completed successfully!"
echo "Version: $BUILD_VERSION"
echo "Package: $PACKAGE_VERSION"
echo "Git Hash: $GIT_HASH"
echo "Build Time: $BUILD_TIMESTAMP"
