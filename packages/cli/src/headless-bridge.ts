import { spawn } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { CliRenderOptions, CliRenderResult } from "./render.js";

/**
 * Resolves an available desktop headless webview binary bundled into the CLI,
 * in platform-specific bin directories, environment variables, or system PATH.
 */
export function resolveWebviewBinary(): string | undefined {
	const envPath =
		process.env.PRINTEDJS_WEBVIEW_PATH || process.env.PRINTEDJS_HEADLESS_WEBVIEW_PATH;

	if (envPath && existsSync(envPath)) {
		return envPath;
	}

	const binaryName =
		process.platform === "win32" ? "headless-webview.exe" : "headless-webview";

	const platformArch = `${process.platform}-${process.arch}`;
	const currentFile = fileURLToPath(import.meta.url);
	const cliPackageRoot = resolve(dirname(currentFile), "..");
	const cwd = process.cwd();

	// Check bundled binary within the CLI package (desktop targets only: linux-x64, darwin-arm64, darwin-x64, win32-x64)
	const bundledCandidates = [
		resolve(cliPackageRoot, "bin", platformArch, binaryName),
		resolve(cliPackageRoot, "bin", binaryName),
		resolve(cwd, "packages/cli/bin", platformArch, binaryName),
		resolve(cwd, "packages/cli/bin", binaryName),
		resolve(cwd, "packages/headless-webview/bin", binaryName),
		resolve(cwd, "packages/headless-webview/crates/target/release", binaryName),
		resolve(cwd, "target/release", binaryName),
	];

	for (const candidate of bundledCandidates) {
		if (existsSync(candidate)) {
			if (process.platform !== "win32") {
				try {
					chmodSync(candidate, 0o755);
				} catch {
					// Ignore permission errors if on read-only mount
				}
			}

			return candidate;
		}
	}

	const pathDirs = (process.env.PATH ?? "").split(delimiter);

	for (const dir of pathDirs) {
		if (!dir) {
			continue;
		}

		const fullPath = join(dir, binaryName);

		if (existsSync(fullPath)) {
			return fullPath;
		}
	}

	return undefined;
}

/**
 * Backwards-compatible alias for resolveWebviewBinary.
 */
export const resolveHeadlessWebviewBinary = resolveWebviewBinary;

/**
 * Checks whether a bundled or system desktop webview binary is available.
 */
export function isWebviewAvailable(): boolean {
	return resolveWebviewBinary() !== undefined;
}

/**
 * Backwards-compatible alias for isWebviewAvailable.
 */
export const isHeadlessWebviewAvailable = isWebviewAvailable;

/**
 * Renders HTML to PDF using the native bundled HeadlessWebView binary.
 */
export async function executeWebviewBinary(
	binaryPath: string,
	options: CliRenderOptions,
): Promise<CliRenderResult> {
	const startTime = performance.now();
	const outputPath = resolve(process.cwd(), options.output);

	const args = [
		options.input,
		"-o",
		outputPath,
		"--wait-for",
		"Boolean(window.__printedjsRenderFinished || window.__pagedRenderFinished || document.querySelector('.printedjs_page, .pagedjs_page'))",
	];

	if (options.format) {
		args.push("--format", options.format);
	}

	if (options.timeoutMs) {
		args.push("--wait-timeout", String(options.timeoutMs));
	}

	return new Promise((resolveResult, reject) => {
		const child = spawn(binaryPath, args, {
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stderr = "";

		child.stderr?.on("data", (chunk: Buffer) => {
			stderr += chunk.toString("utf-8");
		});

		child.on("error", (err) => {
			reject(err);
		});

		child.on("close", (code) => {
			if (code !== 0) {
				reject(
					new Error(
						`headless-webview exited with code ${code}: ${stderr.trim() || "Unknown error"}`,
					),
				);

				return;
			}

			const durationMs = performance.now() - startTime;

			resolveResult({
				outputPath,
				pageCount: 1,
				durationMs,
			});
		});
	});
}

/**
 * Backwards-compatible alias for executeWebviewBinary.
 */
export const executeHeadlessWebviewBinary = executeWebviewBinary;
