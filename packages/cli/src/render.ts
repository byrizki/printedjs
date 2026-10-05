import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import type { PagedjsCompatibilityOptions } from "@printedjs/core";
import { injectAndPaginate } from "./browser-injection.js";
import { resolveChromeExecutable } from "./chrome-resolver.js";
import { renderPdfWithPuppeteer } from "./puppeteer-bridge.js";

export interface CliRenderOptions extends PagedjsCompatibilityOptions {
	readonly input: string;
	readonly output: string;
	readonly format?: string | undefined;
	readonly bleed?: string | undefined;
	readonly printBackground?: boolean | undefined;
	readonly timeoutMs?: number | undefined;
	readonly signal?: AbortSignal | undefined;
	readonly engine?: "playwright" | "puppeteer" | undefined;
}

export interface CliRenderResult {
	readonly outputPath: string;
	readonly pageCount: number;
	readonly durationMs: number;
}

interface PlaywrightLaunchConfig {
	headless: boolean;
	args: string[];
	executablePath?: string;
}

interface PlaywrightNavigationResponse {
	readonly ok: () => boolean;
	readonly status: () => number;
}

interface PlaywrightElementHandle {
	readonly dispose?: () => Promise<void>;
}

interface ChromiumBrowser {
	launch(options?: { headless?: boolean; args?: string[] }): Promise<{
		newContext(): Promise<{
			newPage(): Promise<{
				goto(
					url: string,
					options?: { waitUntil?: string; timeout?: number },
				): Promise<PlaywrightNavigationResponse | null>;
				evaluate<T, A = void>(fn: (arg: A) => T | Promise<T>, arg?: A): Promise<T>;
				waitForSelector(
					selector: string,
					options?: { timeout?: number },
				): Promise<PlaywrightElementHandle | null>;
				waitForFunction(
					fn: () => boolean,
					options?: { timeout?: number },
				): Promise<PlaywrightElementHandle | null>;
				addStyleTag(options: {
					content: string;
				}): Promise<PlaywrightElementHandle | null>;
				addScriptTag(options: {
					content: string;
				}): Promise<PlaywrightElementHandle | null>;
				pdf(options: {
					path?: string;
					format?: string;
					printBackground?: boolean;
					preferCSSPageSize?: boolean;
				}): Promise<Buffer>;
			}>;
		}>;
		close(): Promise<void>;
	}>;
}

async function getChromium(): Promise<ChromiumBrowser> {
	// SAFETY: playwright test exports chromium launcher compatible with ChromiumBrowser interface
	const pw = (await import("@playwright/test")) as { readonly chromium: ChromiumBrowser };

	return pw.chromium;
}

export async function renderPdf(options: CliRenderOptions): Promise<CliRenderResult> {
	if (options.engine === "puppeteer") {
		return renderPdfWithPuppeteer(options);
	}

	const startTime = performance.now();
	const chromium = await getChromium();

	let targetUrl: string;

	if (options.input.startsWith("http://") || options.input.startsWith("https://")) {
		targetUrl = options.input;
	} else {
		const fullInputPath = resolve(process.cwd(), options.input);

		if (!existsSync(fullInputPath)) {
			throw new Error(`Input file does not exist: ${fullInputPath}`);
		}

		targetUrl = pathToFileURL(fullInputPath).href;
	}

	const resolvedExecutablePath = resolveChromeExecutable();

	const launchConfig: PlaywrightLaunchConfig = {
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	};

	if (resolvedExecutablePath) {
		launchConfig.executablePath = resolvedExecutablePath;
	}

	const browser = await chromium.launch(launchConfig);

	try {
		const context = await browser.newContext();
		const page = await context.newPage();

		const timeout = options.timeoutMs ?? 30000;
		await page.goto(targetUrl, { waitUntil: "load", timeout });

		// Inject bleed override if requested
		if (options.bleed) {
			await page.addStyleTag({
				content: `@page { bleed: ${options.bleed}; marks: crop cross; }`,
			});
		}

		// Ensure font rendering is complete
		await page.evaluate(async () => {
			if (document.fonts?.ready) {
				await document.fonts.ready;
			}
		});

		await injectAndPaginate(page, {
			pagedjsCompatible: options.pagedjsCompatible ?? false,
		});

		// Wait for pagination completion via global flag or selector with stabilization
		try {
			await page.waitForFunction(
				() => {
					interface WindowWithRenderFinished extends Window {
						__printedjsRenderFinished?: boolean;
						__pagedRenderFinished?: boolean;
					}

					// SAFETY: window in browser evaluation context holds render completion flags
					const win = window as WindowWithRenderFinished;

					return (
						win.__printedjsRenderFinished === true || win.__pagedRenderFinished === true
					);
				},
				{ timeout },
			);
		} catch {
			// Fallback: wait for at least one pagebox
			await page.waitForSelector(".printedjs_page, .pagedjs_page", { timeout });
		}

		await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));

		const pageCount = await page.evaluate(
			() => document.querySelectorAll(".printedjs_page, .pagedjs_page").length,
		);

		const outputPath = resolve(process.cwd(), options.output);
		const outDir = dirname(outputPath);

		if (!existsSync(outDir)) {
			mkdirSync(outDir, { recursive: true });
		}

		await page.pdf({
			path: outputPath,
			format: options.format ?? "A4",
			printBackground: options.printBackground ?? true,
			preferCSSPageSize: true,
		});

		const durationMs = performance.now() - startTime;

		return {
			outputPath,
			pageCount,
			durationMs,
		};
	} finally {
		await browser.close();
	}
}
