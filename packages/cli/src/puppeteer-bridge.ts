import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { injectAndPaginate } from "./browser-injection.js";
import { resolveChromeExecutable } from "./chrome-resolver.js";
import type { CliRenderOptions, CliRenderResult } from "./render.js";

export interface PuppeteerPageLike {
	goto(
		url: string,
		options?: { waitUntil?: string | string[]; timeout?: number },
	): Promise<void>;
	evaluate<T, A = void>(fn: (arg: A) => T | Promise<T>, arg?: A | undefined): Promise<T>;
	waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>;
	waitForFunction(fn: () => boolean, options?: { timeout?: number }): Promise<void>;
	addStyleTag?(options: { content: string }): Promise<void>;
	addScriptTag?(options: { content: string }): Promise<void>;
	pdf(options: {
		path?: string;
		format?: string;
		printBackground?: boolean;
		preferCSSPageSize?: boolean;
	}): Promise<Uint8Array | Buffer>;
}

export interface PuppeteerBridgeOptions {
	readonly bleed?: string | undefined;
	readonly format?: string | undefined;
	readonly printBackground?: boolean | undefined;
	readonly timeoutMs?: number | undefined;
	readonly output?: string | undefined;
}

export interface PuppeteerBridgeResult {
	readonly pageCount: number;
	readonly outputPath?: string | undefined;
	readonly durationMs: number;
}

interface MutablePuppeteerBridgeResult {
	pageCount: number;
	durationMs: number;
	outputPath?: string;
}

interface PuppeteerLaunchConfig {
	headless: boolean;
	args: readonly string[];
	executablePath?: string;
}

export async function printedjsPuppeteerBridge(
	page: PuppeteerPageLike,
	options?: PuppeteerBridgeOptions,
): Promise<PuppeteerBridgeResult> {
	const startTime = performance.now();
	const timeout = options?.timeoutMs ?? 30000;

	// Inject bleed override if requested
	if (options?.bleed && page.addStyleTag) {
		await page.addStyleTag({
			content: `@page { bleed: ${options.bleed}; marks: crop cross; }`,
		});
	}

	// Ensure fonts are ready
	await page.evaluate(async () => {
		if (document.fonts?.ready) {
			await document.fonts.ready;
		}
	});

	await injectAndPaginate(page);

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
		await page.waitForSelector(".printedjs_page, .pagedjs_page", { timeout });
	}

	await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));

	const pageCount = await page.evaluate(
		() => document.querySelectorAll(".printedjs_page, .pagedjs_page").length,
	);

	let outputPath: string | undefined;

	if (options?.output) {
		outputPath = resolve(process.cwd(), options.output);
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
	}

	const durationMs = performance.now() - startTime;

	const result: MutablePuppeteerBridgeResult = {
		pageCount,
		durationMs,
	};

	if (outputPath) {
		result.outputPath = outputPath;
	}

	return result;
}

interface PuppeteerLauncher {
	launch(options?: PuppeteerLaunchConfig): Promise<{
		newPage(): Promise<PuppeteerPageLike>;
		close(): Promise<void>;
	}>;
}

interface PuppeteerModuleNamespace {
	readonly default?: PuppeteerLauncher | undefined;
	readonly launch?: PuppeteerLauncher["launch"] | undefined;
}

export async function renderPdfWithPuppeteer(
	options: CliRenderOptions,
): Promise<CliRenderResult> {
	// Dynamically import puppeteer
	const moduleName = "puppeteer";

	// SAFETY: dynamic import of optional puppeteer package
	const puppeteerModule = (await import(/* @vite-ignore */ moduleName).catch(
		() => null,
	)) as PuppeteerModuleNamespace | null;

	const launchFn = puppeteerModule?.default?.launch ?? puppeteerModule?.launch;

	if (!launchFn) {
		throw new Error(
			"Puppeteer is not installed. Please install puppeteer via 'pnpm add -D puppeteer'.",
		);
	}

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

	const launchConfig: PuppeteerLaunchConfig = {
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	};

	if (resolvedExecutablePath) {
		launchConfig.executablePath = resolvedExecutablePath;
	}

	const browser = await launchFn(launchConfig);

	try {
		const page = await browser.newPage();
		await page.goto(targetUrl, {
			waitUntil: "load",
			timeout: options.timeoutMs ?? 30000,
		});

		const bridgeResult = await printedjsPuppeteerBridge(page, {
			output: options.output,
			format: options.format,
			bleed: options.bleed,
			printBackground: options.printBackground,
			timeoutMs: options.timeoutMs,
		});

		return {
			outputPath: bridgeResult.outputPath ?? resolve(process.cwd(), options.output),
			pageCount: bridgeResult.pageCount,
			durationMs: bridgeResult.durationMs,
		};
	} finally {
		await browser.close();
	}
}
