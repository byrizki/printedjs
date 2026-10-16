#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CRATES_DIR="${PACKAGE_DIR}/crates/headless-webview-core"
ANDROID_JNI="${PACKAGE_DIR}/android/src/main/jniLibs"
IOS_FRAMEWORKS="${PACKAGE_DIR}/ios/Frameworks"

echo "=== Building prebuilt native libraries for HeadlessWebView ==="

mkdir -p "${ANDROID_JNI}/arm64-v8a"
mkdir -p "${ANDROID_JNI}/x86_64"
mkdir -p "${IOS_FRAMEWORKS}"

# 1. Android aarch64 (arm64-v8a)
if rustup target list --installed | grep -q "aarch64-linux-android"; then
    echo "--> Compiling for Android aarch64 (arm64-v8a)..."
    cargo build --manifest-path "${CRATES_DIR}/Cargo.toml" --release --target aarch64-linux-android || true
    TARGET_SO="${PACKAGE_DIR}/crates/target/aarch64-linux-android/release/libheadless_webview_core.so"
    if [ -f "${TARGET_SO}" ]; then
        cp "${TARGET_SO}" "${ANDROID_JNI}/arm64-v8a/libheadless_webview_core.so"
        echo "    Copied to ${ANDROID_JNI}/arm64-v8a/libheadless_webview_core.so"
    fi
fi

# 2. iOS aarch64
if rustup target list --installed | grep -q "aarch64-apple-ios"; then
    echo "--> Compiling for iOS aarch64..."
    cargo build --manifest-path "${CRATES_DIR}/Cargo.toml" --release --target aarch64-apple-ios || true
    TARGET_A="${PACKAGE_DIR}/crates/target/aarch64-apple-ios/release/libheadless_webview_core.a"
    if [ -f "${TARGET_A}" ]; then
        cp "${TARGET_A}" "${IOS_FRAMEWORKS}/libheadless_webview_core.a"
        echo "    Copied to ${IOS_FRAMEWORKS}/libheadless_webview_core.a"
    fi
fi

echo "=== Prebuilt library bundling completed successfully ==="
