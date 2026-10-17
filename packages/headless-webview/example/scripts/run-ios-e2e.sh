#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
IOS_DIR="${EXAMPLE_DIR}/ios"

echo "================================================================================"
echo "  Maestro E2E Test: React Native Headless WebView on iOS Simulator             "
echo "================================================================================"

if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ Error: iOS Simulator tests require macOS host with Xcode."
    exit 1
fi

# 1. Ensure Maestro CLI is available
if ! command -v maestro &> /dev/null; then
    export PATH="${PATH}:${HOME}/.maestro/bin"
fi

if ! command -v maestro &> /dev/null; then
    echo "--> Installing Maestro CLI..."
    curl -fsSL "https://get.maestro.mobile.dev" | bash
    export PATH="${PATH}:${HOME}/.maestro/bin"
fi

echo "--> Maestro version: $(maestro --version)"

# 2. Boot iOS Simulator
echo "--> Booting iOS Simulator..."
DEVICE_NAME="${IOS_SIMULATOR_NAME:-iPhone 15}"
BOOTED_DEVICE=$(xcrun simctl list devices | grep -E "Booted" | head -n 1 || true)

if [ -z "${BOOTED_DEVICE}" ]; then
    echo "--> Booting ${DEVICE_NAME}..."
    xcrun simctl boot "${DEVICE_NAME}" || true
else
    echo "--> Found already booted simulator: ${BOOTED_DEVICE}"
fi

# Wait for boot completion
xcrun simctl bootstatus booted -b

# 3. Build iOS Application
echo "--> Building iOS example app for simulator..."
cd "${IOS_DIR}"

POD_BIN="${HOME}/.gem/bin/pod"
if [ ! -x "${POD_BIN}" ]; then
    POD_BIN="pod"
fi

if command -v "${POD_BIN}" &> /dev/null && [ -f "Podfile" ]; then
    "${POD_BIN}" install
fi

BUILD_CMD="xcodebuild"
if [ -d "HeadlessWebviewExample.xcworkspace" ]; then
    BUILD_CMD="${BUILD_CMD} -workspace HeadlessWebviewExample.xcworkspace"
else
    BUILD_CMD="${BUILD_CMD} -project HeadlessWebviewExample.xcodeproj"
fi

${BUILD_CMD} \
    -scheme HeadlessWebviewExample \
    -configuration Debug \
    -destination "generic/platform=iOS Simulator" \
    -derivedDataPath build \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    build

APP_PATH="${IOS_DIR}/build/Build/Products/Debug-iphonesimulator/HeadlessWebviewExample.app"
if [ ! -d "${APP_PATH}" ]; then
    echo "❌ Error: Built .app not found at ${APP_PATH}"
    exit 1
fi

# 4. Install Application on Booted Simulator
echo "--> Installing ${APP_PATH} on booted iOS simulator..."
xcrun simctl install booted "${APP_PATH}"

# 5. Execute Maestro Flow
echo "--> Running Maestro HTML-to-PDF verification flow..."
cd "${EXAMPLE_DIR}"
maestro test .maestro/html-to-pdf-flow.yaml

echo "================================================================================"
echo "✅ Maestro iOS E2E HTML-to-PDF Test Passed Successfully!                        "
echo "================================================================================"
