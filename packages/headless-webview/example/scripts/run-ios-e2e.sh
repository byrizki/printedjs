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
BOOTED_DEVICE=$(xcrun simctl list devices | grep -E "Booted" | head -n 1 || true)

if [ -z "${BOOTED_DEVICE}" ]; then
    TARGET_DEVICE="${IOS_SIMULATOR_NAME:-}"
    if [ -z "${TARGET_DEVICE}" ]; then
        if xcrun simctl list devices available | grep -q "iPhone 15"; then
            TARGET_DEVICE="iPhone 15"
        else
            TARGET_DEVICE=$(xcrun simctl list devices available | grep -E "iPhone" | head -n 1 | sed -E 's/^[[:space:]]*([^(]+)[[:space:]]*\(.*/\1/' | xargs || true)
        fi
    fi
    echo "--> Booting ${TARGET_DEVICE:-iPhone 15}..."
    xcrun simctl boot "${TARGET_DEVICE:-iPhone 15}" || true
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

CONFIG="${IOS_CONFIGURATION:-Release}"
APP_PATH="${IOS_DIR}/build/Build/Products/${CONFIG}-iphonesimulator/HeadlessWebviewExample.app"

if [ ! -d "${APP_PATH}" ]; then
    ${BUILD_CMD} \
        -scheme HeadlessWebviewExample \
        -configuration "${CONFIG}" \
        -destination "generic/platform=iOS Simulator" \
        -derivedDataPath build \
        CODE_SIGNING_ALLOWED=NO \
        CODE_SIGN_IDENTITY="" \
        CODE_SIGNING_REQUIRED=NO \
        build
fi
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
