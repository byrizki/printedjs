#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CRATES_DIR="${ROOT_DIR}/packages/headless-webview/crates/headless-webview-core"
CLI_BIN_DIR="${ROOT_DIR}/packages/cli/bin"
DOTNET_RUNTIMES_DIR="${ROOT_DIR}/packages/headless-webview/dotnet/PrintedJs.HeadlessWebView/runtimes"

echo "=== Bundling desktop prebuilt headless webview binaries & .NET native runtimes ==="
echo "Note: Desktop platforms only (Linux, macOS, Windows). Mobile (Android, iOS) is excluded."

mkdir -p "${CLI_BIN_DIR}"
mkdir -p "${DOTNET_RUNTIMES_DIR}"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "${ARCH}" in
    x86_64|amd64)
        TARGET_ARCH="x64"
        ;;
    aarch64|arm64)
        TARGET_ARCH="arm64"
        ;;
    *)
        TARGET_ARCH="${ARCH}"
        ;;
esac

case "${OS}" in
    linux*)
        PLATFORM="linux"
        BINARY_NAME="headless-webview"
        DOTNET_RID="linux-${TARGET_ARCH}"
        CDYLIB_NAME="libheadless_webview_core.so"
        ;;
    darwin*)
        PLATFORM="darwin"
        BINARY_NAME="headless-webview"
        DOTNET_RID="osx-${TARGET_ARCH}"
        CDYLIB_NAME="libheadless_webview_core.dylib"
        ;;
    msys*|mingw*|cygwin*|windows*)
        PLATFORM="win32"
        BINARY_NAME="headless-webview.exe"
        DOTNET_RID="win-${TARGET_ARCH}"
        CDYLIB_NAME="headless_webview_core.dll"
        ;;
    *)
        PLATFORM="${OS}"
        BINARY_NAME="headless-webview"
        DOTNET_RID="${OS}-${TARGET_ARCH}"
        CDYLIB_NAME="libheadless_webview_core.so"
        ;;
esac

PLATFORM_TAG="${PLATFORM}-${TARGET_ARCH}"
PLATFORM_DIR="${CLI_BIN_DIR}/${PLATFORM_TAG}"
mkdir -p "${PLATFORM_DIR}"

echo "--> Detected host platform: ${PLATFORM_TAG} (.NET RID: ${DOTNET_RID})"

# Build current host desktop binary and cdylib library if toolchain and OS webview libraries are available
if cargo --version >/dev/null 2>&1; then
    echo "--> Compiling native headless-webview desktop prebuilts for ${PLATFORM_TAG}..."
    if cargo build --manifest-path "${CRATES_DIR}/Cargo.toml" --features os-webview --release; then
        TARGET_BIN="${ROOT_DIR}/packages/headless-webview/crates/target/release/${BINARY_NAME}"
        if [ ! -f "${TARGET_BIN}" ]; then
            TARGET_BIN="${ROOT_DIR}/target/release/${BINARY_NAME}"
        fi

        TARGET_CDYLIB="${ROOT_DIR}/packages/headless-webview/crates/target/release/${CDYLIB_NAME}"
        if [ ! -f "${TARGET_CDYLIB}" ]; then
            TARGET_CDYLIB="${ROOT_DIR}/target/release/${CDYLIB_NAME}"
        fi

        if [ -f "${TARGET_BIN}" ]; then
            cp "${TARGET_BIN}" "${PLATFORM_DIR}/${BINARY_NAME}"
            cp "${TARGET_BIN}" "${CLI_BIN_DIR}/${BINARY_NAME}"
            chmod +x "${PLATFORM_DIR}/${BINARY_NAME}" "${CLI_BIN_DIR}/${BINARY_NAME}" || true
            echo "✓ Bundled desktop binary to ${PLATFORM_DIR}/${BINARY_NAME}"
            echo "✓ Bundled desktop binary to ${CLI_BIN_DIR}/${BINARY_NAME}"
        fi

        if [ -f "${TARGET_CDYLIB}" ]; then
            mkdir -p "${DOTNET_RUNTIMES_DIR}/${DOTNET_RID}/native"
            cp "${TARGET_CDYLIB}" "${DOTNET_RUNTIMES_DIR}/${DOTNET_RID}/native/${CDYLIB_NAME}"
            echo "✓ Bundled .NET native runtime to ${DOTNET_RUNTIMES_DIR}/${DOTNET_RID}/native/${CDYLIB_NAME}"
        fi
    else
        echo "ℹ Host system libraries for native desktop compilation not fully present; preserving existing bundled prebuilts."
    fi

    # If running on macOS arm64 and x86_64 target is installed, build darwin-x64 binary and cdylib too
    if [ "${PLATFORM}" = "darwin" ] && [ "${TARGET_ARCH}" = "arm64" ]; then
        if rustup target list 2>/dev/null | grep -q "x86_64-apple-darwin (installed)"; then
            echo "--> Compiling darwin-x64 headless-webview prebuilts for Intel macOS support..."
            if cargo build --manifest-path "${CRATES_DIR}/Cargo.toml" --features os-webview --release --target x86_64-apple-darwin; then
                X64_BIN="${ROOT_DIR}/packages/headless-webview/crates/target/x86_64-apple-darwin/release/${BINARY_NAME}"
                if [ ! -f "${X64_BIN}" ]; then
                    X64_BIN="${ROOT_DIR}/target/x86_64-apple-darwin/release/${BINARY_NAME}"
                fi

                X64_CDYLIB="${ROOT_DIR}/packages/headless-webview/crates/target/x86_64-apple-darwin/release/libheadless_webview_core.dylib"
                if [ ! -f "${X64_CDYLIB}" ]; then
                    X64_CDYLIB="${ROOT_DIR}/target/x86_64-apple-darwin/release/libheadless_webview_core.dylib"
                fi

                if [ -f "${X64_BIN}" ]; then
                    mkdir -p "${CLI_BIN_DIR}/darwin-x64"
                    cp "${X64_BIN}" "${CLI_BIN_DIR}/darwin-x64/${BINARY_NAME}"
                    chmod +x "${CLI_BIN_DIR}/darwin-x64/${BINARY_NAME}" || true
                    echo "✓ Bundled desktop binary to ${CLI_BIN_DIR}/darwin-x64/${BINARY_NAME}"
                fi

                if [ -f "${X64_CDYLIB}" ]; then
                    mkdir -p "${DOTNET_RUNTIMES_DIR}/osx-x64/native"
                    cp "${X64_CDYLIB}" "${DOTNET_RUNTIMES_DIR}/osx-x64/native/libheadless_webview_core.dylib"
                    echo "✓ Bundled .NET native runtime to ${DOTNET_RUNTIMES_DIR}/osx-x64/native/libheadless_webview_core.dylib"
                fi
            fi
        fi
    fi
fi

# Summary of bundled binaries and runtimes
echo "Current bundled desktop binaries in @printedjs/cli:"
find "${CLI_BIN_DIR}" -type f || true
echo "Current bundled .NET desktop runtimes:"
find "${DOTNET_RUNTIMES_DIR}" -type f || true
echo "=== Bundling completed ==="
