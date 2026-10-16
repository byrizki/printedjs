#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CRATES_DIR="${ROOT_DIR}/packages/headless-webview/crates/headless-webview-core"
CLI_BIN_DIR="${ROOT_DIR}/packages/cli/bin"

echo "=== Bundling desktop prebuilt headless webview binaries into @printedjs/cli ==="
echo "Note: Desktop platforms only (Linux, macOS, Windows). Mobile (Android, iOS) is excluded."

mkdir -p "${CLI_BIN_DIR}"

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
        ;;
    darwin*)
        PLATFORM="darwin"
        BINARY_NAME="headless-webview"
        ;;
    msys*|mingw*|cygwin*|windows*)
        PLATFORM="win32"
        BINARY_NAME="headless-webview.exe"
        ;;
    *)
        PLATFORM="${OS}"
        BINARY_NAME="headless-webview"
        ;;
esac

PLATFORM_TAG="${PLATFORM}-${TARGET_ARCH}"
PLATFORM_DIR="${CLI_BIN_DIR}/${PLATFORM_TAG}"
mkdir -p "${PLATFORM_DIR}"

echo "--> Detected host platform: ${PLATFORM_TAG}"

# Build current host desktop binary if toolchain and OS webview libraries are available
if cargo --version >/dev/null 2>&1; then
    echo "--> Compiling native headless-webview desktop binary..."
    if cargo build --manifest-path "${CRATES_DIR}/Cargo.toml" --bin headless-webview --features os-webview --release 2>/dev/null; then
        TARGET_BIN="${ROOT_DIR}/packages/headless-webview/crates/target/release/${BINARY_NAME}"
        if [ ! -f "${TARGET_BIN}" ]; then
            TARGET_BIN="${ROOT_DIR}/target/release/${BINARY_NAME}"
        fi

        if [ -f "${TARGET_BIN}" ]; then
            cp "${TARGET_BIN}" "${PLATFORM_DIR}/${BINARY_NAME}"
            cp "${TARGET_BIN}" "${CLI_BIN_DIR}/${BINARY_NAME}"
            chmod +x "${PLATFORM_DIR}/${BINARY_NAME}" "${CLI_BIN_DIR}/${BINARY_NAME}"
            echo "✓ Bundled desktop binary to ${PLATFORM_DIR}/${BINARY_NAME}"
            echo "✓ Bundled desktop binary to ${CLI_BIN_DIR}/${BINARY_NAME}"
        fi
    else
        echo "ℹ Host system libraries for native desktop compilation not fully present; preserving existing bundled prebuilts."
    fi
fi

# Summary of bundled binaries
echo "Current bundled desktop binaries in @printedjs/cli:"
find "${CLI_BIN_DIR}" -type f || true
echo "=== Bundling completed ==="
