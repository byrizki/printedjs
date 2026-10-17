#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================================"
echo "  Maestro E2E Test: React Native Headless WebView on Android Emulator          "
echo "================================================================================"

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

# 2. Build Android Signed Release APK (if not already built by previous step)
APK_PATH="${EXAMPLE_DIR}/android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "${APK_PATH}" ]; then
    echo "--> Building Android example app signed release APK..."
    cd "${EXAMPLE_DIR}"
    ./android/gradlew -p android :app:assembleRelease -PnewArchEnabled=false
fi

if [ ! -f "${APK_PATH}" ]; then
    echo "❌ Error: APK not found at ${APK_PATH}"
    exit 1
fi

# Optional APK signature verification
ANDROID_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/mnt/development/Android/Sdk}}"
APKSIGNER=$(find "${ANDROID_ROOT}"/build-tools -name apksigner 2>/dev/null | sort -V | tail -n 1 || true)
if [ -n "${APKSIGNER}" ] && [ -x "${APKSIGNER}" ]; then
    echo "--> Verifying APK signature using ${APKSIGNER}..."
    "${APKSIGNER}" verify --verbose "${APK_PATH}" || {
        echo "❌ Error: APK signature verification failed"
        exit 1
    }
fi

# 3. Verify Android device / emulator connectivity
if ! command -v adb &> /dev/null && [ -d "${ANDROID_ROOT}/platform-tools" ]; then
    export PATH="${PATH}:${ANDROID_ROOT}/platform-tools"
fi

if ! command -v adb &> /dev/null; then
    echo "❌ Error: adb not found in PATH."
    exit 1
fi

echo "--> Checking connected Android devices / emulators..."
adb devices -l

DEVICE_COUNT=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)
if [ "${DEVICE_COUNT}" -eq 0 ]; then
    echo "❌ Error: No Android emulator or device found. Boot an emulator before running."
    exit 1
fi

echo "--> Waiting for Android device to be ready..."
adb wait-for-device

echo "--> Waiting for system boot completion..."
BOOT_TIMEOUT=120
BOOT_TIMER=0
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] || [ "${BOOT_TIMER}" -ge "${BOOT_TIMEOUT}" ]; do
    sleep 2
    BOOT_TIMER=$((BOOT_TIMER + 2))
done

echo "--> Dismissing keyguard and waking device..."
adb shell input keyevent 82 || true
adb shell input keyevent 66 || true
adb shell wm dismiss-keyguard || true

# 4. Install the release APK
echo "--> Installing ${APK_PATH} on target device..."
adb install -r "${APK_PATH}"

# 5. Execute Maestro E2E verification flow
echo "--> Running Maestro HTML-to-PDF verification flow..."
cd "${EXAMPLE_DIR}"
maestro test .maestro/html-to-pdf-flow.yaml

echo "================================================================================"
echo "✅ Maestro Android E2E HTML-to-PDF Test Passed Successfully!                    "
echo "================================================================================"
