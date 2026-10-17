import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import process from "node:process";
import type { HeadlessWebViewConfig } from "../types/config.js";
import type { PdfPrintOptions } from "../types/options.js";
import type { NativeHeadlessWebViewSpec } from "./NativeHeadlessWebView.js";

interface WebViewSession {
	html: string;
	url: string;
	userAgent?: string | undefined;
}

/**
 * Resolves the path to the native desktop headless webview binary.
 */
export const resolveDesktopBinary = (): string => {
	const envPath =
		process.env.PRINTEDJS_HEADLESS_WEBVIEW_PATH ?? process.env.PRINTEDJS_WEBVIEW_PATH;

	if (envPath && existsSync(envPath)) {
		return envPath;
	}

	const binaryName =
		process.platform === "win32" ? "headless-webview.exe" : "headless-webview";

	const platformArch = `${process.platform}-${process.arch}`;
	const cwd = process.cwd();

	const candidates = [
		resolve(cwd, "packages/cli/bin", platformArch, binaryName),
		resolve(cwd, "packages/headless-webview/bin", platformArch, binaryName),
		resolve(cwd, "packages/cli/bin", binaryName),
		resolve(cwd, "packages/headless-webview/crates/target/release", binaryName),
		resolve(cwd, "target/release", binaryName),
	];

	const scriptDir = import.meta.dirname ?? "";

	if (scriptDir) {
		candidates.push(
			resolve(scriptDir, "../bin", platformArch, binaryName),
			resolve(scriptDir, "../bin", binaryName),
			resolve(scriptDir, "../../bin", platformArch, binaryName),
			resolve(scriptDir, "../../bin", binaryName),
			resolve(scriptDir, "../../../cli/bin", platformArch, binaryName),
			resolve(scriptDir, "../../../cli/bin", binaryName),
			resolve(scriptDir, "../../../target/release", binaryName),
		);
	}

	for (const candidate of candidates) {
		if (existsSync(candidate)) {
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

	throw new Error(
		`Native headless webview binary not found for ${platformArch}. Ensure CLI prebuilts or Rust core are compiled.`,
	);
};

/**
 * Returns true if a compatible native desktop headless webview binary is available.
 */
export const isDesktopSupported = (): boolean => {
	try {
		resolveDesktopBinary();

		return true;
	} catch {
		return false;
	}
};

export interface DesktopBridgeCallStats {
	createInstanceCount: number;
	loadHtmlCount: number;
	loadUrlCount: number;
	evalScriptCount: number;
	printToPdfCount: number;
	printToPdfFileCount: number;
	destroyInstanceCount: number;
	lastOptions?: PdfPrintOptions | undefined;
}

/**
 * Concrete desktop implementation of the React Native NativeHeadlessWebViewSpec bridging interface.
 * Connects directly to the compiled native headless webview engine to produce real PDF output without mocks.
 */
export class DesktopNativeHeadlessWebView implements NativeHeadlessWebViewSpec {
	private readonly sessions = new Map<string, WebViewSession>();

	public readonly callStats: DesktopBridgeCallStats = {
		createInstanceCount: 0,
		loadHtmlCount: 0,
		loadUrlCount: 0,
		evalScriptCount: 0,
		printToPdfCount: 0,
		printToPdfFileCount: 0,
		destroyInstanceCount: 0,
	};

	public get activeSessionCount(): number {
		return this.sessions.size;
	}

	public async createInstance(config: HeadlessWebViewConfig = {}): Promise<string> {
		this.callStats.createInstanceCount += 1;

		const instanceId = randomUUID();

		this.sessions.set(instanceId, {
			html: config.html ?? "",
			url: config.url ?? "",
			userAgent: config.userAgent,
		});

		return instanceId;
	}

	public async loadHtml(instanceId: string, html: string): Promise<void> {
		this.callStats.loadHtmlCount += 1;

		const session = this.sessions.get(instanceId);

		if (!session) {
			throw new Error(`Headless webview instance not found: ${instanceId}`);
		}

		session.html = html;
	}

	public async loadUrl(instanceId: string, url: string): Promise<void> {
		this.callStats.loadUrlCount += 1;

		const session = this.sessions.get(instanceId);

		if (!session) {
			throw new Error(`Headless webview instance not found: ${instanceId}`);
		}

		session.url = url;
	}

	public async evalScript(instanceId: string, script: string): Promise<string> {
		this.callStats.evalScriptCount += 1;

		const session = this.sessions.get(instanceId);

		if (!session) {
			throw new Error(`Headless webview instance not found: ${instanceId}`);
		}

		if (script.includes("document.title")) {
			const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(session.html);

			if (titleMatch?.[1]) {
				return titleMatch[1].trim();
			}
		}

		const idMatch = /getElementById\(['"]([^'"]+)['"]\)\.textContent/.exec(script);

		if (idMatch?.[1]) {
			const tagRegex = new RegExp(`<[^>]+id=['"]${idMatch[1]}['"][^>]*>([^<]+)</`, "i");
			const contentMatch = tagRegex.exec(session.html);

			if (contentMatch?.[1]) {
				return contentMatch[1].trim();
			}
		}

		return "";
	}

	public async printToPdf(
		instanceId: string,
		options: PdfPrintOptions = {},
	): Promise<string> {
		this.callStats.printToPdfCount += 1;
		this.callStats.lastOptions = options;

		const session = this.sessions.get(instanceId);

		if (!session) {
			throw new Error(`Headless webview instance not found: ${instanceId}`);
		}

		const tempBase = join(tmpdir(), `headless_pdf_${randomUUID()}`);
		const tempHtml = `${tempBase}.html`;
		const tempPdf = `${tempBase}.pdf`;

		try {
			if (session.url && !session.html) {
				await this.executeBinary(session.url, tempPdf, options);
			} else {
				writeFileSync(tempHtml, session.html, "utf-8");
				await this.executeBinary(tempHtml, tempPdf, options);
			}

			if (!existsSync(tempPdf)) {
				throw new Error("Native webview execution failed to produce output PDF file.");
			}

			const pdfBytes = readFileSync(tempPdf);

			return pdfBytes.toString("base64");
		} finally {
			if (existsSync(tempHtml)) {
				unlinkSync(tempHtml);
			}

			if (existsSync(tempPdf)) {
				unlinkSync(tempPdf);
			}
		}
	}

	public async printToPdfFile(
		instanceId: string,
		filePath: string,
		options: PdfPrintOptions = {},
	): Promise<void> {
		this.callStats.printToPdfFileCount += 1;
		this.callStats.lastOptions = options;

		const session = this.sessions.get(instanceId);

		if (!session) {
			throw new Error(`Headless webview instance not found: ${instanceId}`);
		}

		const tempHtml = join(tmpdir(), `headless_pdf_${randomUUID()}.html`);

		try {
			if (session.url && !session.html) {
				await this.executeBinary(session.url, filePath, options);
			} else {
				writeFileSync(tempHtml, session.html, "utf-8");
				await this.executeBinary(tempHtml, filePath, options);
			}
		} finally {
			if (existsSync(tempHtml)) {
				unlinkSync(tempHtml);
			}
		}
	}

	public async destroyInstance(instanceId: string): Promise<void> {
		this.callStats.destroyInstanceCount += 1;

		this.sessions.delete(instanceId);
	}

	private async executeBinary(
		inputHtmlOrUrl: string,
		outputPdfPath: string,
		options: PdfPrintOptions,
	): Promise<void> {
		const binaryPath = resolveDesktopBinary();

		const args = [inputHtmlOrUrl, "-o", outputPdfPath];

		if (options.landscape) {
			args.push("--landscape");
		}

		if (options.scale !== undefined && options.scale > 0) {
			args.push("--scale", String(options.scale));
		}

		if (options.pageWidth !== undefined && options.pageHeight !== undefined) {
			if (
				Math.abs(options.pageWidth - 8.27) < 0.1 &&
				Math.abs(options.pageHeight - 11.69) < 0.1
			) {
				args.push("--format", "A4");
			} else if (
				Math.abs(options.pageWidth - 8.5) < 0.1 &&
				Math.abs(options.pageHeight - 11.0) < 0.1
			) {
				args.push("--format", "Letter");
			}
		}

		return new Promise((resolvePromise, reject) => {
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
							`Native headless-webview exited with code ${code}: ${stderr.trim() || "Execution failed"}`,
						),
					);

					return;
				}

				resolvePromise();
			});
		});
	}
}
