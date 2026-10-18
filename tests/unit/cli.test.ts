import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, test, vi } from "vitest";
import {
	executeWebviewBinary,
	isWebviewAvailable,
	printedjsPuppeteerBridge,
	renderPdf,
	resolveWaitExpression,
	resolveWebviewBinary,
	runCli,
	type PuppeteerPageLike,
} from "../../packages/cli/src/index.js";

describe("@printedjs/cli", () => {
	test("displays help message when called with --help", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		await runCli(["--help"]);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Printedjs CLI — Headless PDF generation"),
		);
		consoleLogSpy.mockRestore();
	});

	test("displays version when called with --version", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		await runCli(["--version"]);
		expect(consoleLogSpy).toHaveBeenCalledWith("printedjs 0.2.1");
		consoleLogSpy.mockRestore();
	});

	test("help text displays webview as default engine", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		await runCli(["--help"]);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("webview | playwright | puppeteer (default: webview)"),
		);
		consoleLogSpy.mockRestore();
	});

	test("printedjsPuppeteerBridge interacts with page-like object and generates PDF", async () => {
		let evaluatedCount = 0;
		let pdfCalled = false;

		const mockPage: PuppeteerPageLike = {
			goto: async () => {},
			evaluate: (async () => {
				evaluatedCount++;

				if (evaluatedCount === 1) {
					// document.fonts.ready
					return true;
				}

				if (evaluatedCount === 2) {
					// hasPages check
					return true;
				}

				// page count check
				return 3;
			}) as PuppeteerPageLike["evaluate"],
			waitForSelector: async () => {},
			waitForFunction: async () => {},
			addStyleTag: async () => {},
			addScriptTag: async () => {},
			pdf: async () => {
				pdfCalled = true;

				return Buffer.from("%PDF-1.4 mock");
			},
		};

		const bridgeResult = await printedjsPuppeteerBridge(mockPage, {
			format: "Letter",
			bleed: "3mm",
			output: "test-output.pdf",
		});

		expect(bridgeResult.pageCount).toBe(3);
		expect(bridgeResult.durationMs).toBeGreaterThanOrEqual(0);
		expect(pdfCalled).toBe(true);
	});

	test("renders HTML fixture to valid PDF file using renderPdf", async () => {
		const fixturePath = resolve(__dirname, "../fixtures/marks/marks.html");
		const outputPath = resolve(__dirname, "../fixtures/marks/test-marks-output.pdf");

		try {
			const result = await renderPdf({
				input: fixturePath,
				output: outputPath,
				format: "A4",
				timeoutMs: 15000,
			});

			expect(result.pageCount).toBeGreaterThan(0);
			expect(result.outputPath).toBe(outputPath);
			expect(existsSync(outputPath)).toBe(true);

			// Verify PDF magic bytes
			const fileBuffer = readFileSync(outputPath);
			const header = fileBuffer.subarray(0, 5).toString("utf-8");
			expect(header).toBe("%PDF-");
		} finally {
			if (existsSync(outputPath)) {
				unlinkSync(outputPath);
			}
		}
	}, 20000);

	test("resolveWebviewBinary respects custom PRINTEDJS_WEBVIEW_PATH env var", () => {
		const originalEnv = process.env.PRINTEDJS_WEBVIEW_PATH;
		const mockBinaryPath = resolve(__dirname, "../fixtures/marks/marks.html");

		try {
			process.env.PRINTEDJS_WEBVIEW_PATH = mockBinaryPath;
			expect(resolveWebviewBinary()).toBe(mockBinaryPath);
			expect(isWebviewAvailable()).toBe(true);
		} finally {
			if (originalEnv !== undefined) {
				process.env.PRINTEDJS_WEBVIEW_PATH = originalEnv;
			} else {
				delete process.env.PRINTEDJS_WEBVIEW_PATH;
			}
		}
	});

	test("resolveWebviewBinary ignores non-existent PRINTEDJS_WEBVIEW_PATH", () => {
		const originalEnv = process.env.PRINTEDJS_WEBVIEW_PATH;

		try {
			process.env.PRINTEDJS_WEBVIEW_PATH = "/non/existent/path/to/binary";
			expect(resolveWebviewBinary()).not.toBe("/non/existent/path/to/binary");
		} finally {
			if (originalEnv !== undefined) {
				process.env.PRINTEDJS_WEBVIEW_PATH = originalEnv;
			} else {
				delete process.env.PRINTEDJS_WEBVIEW_PATH;
			}
		}
	});

	test("executeWebviewBinary fails cleanly when given an invalid binary path", async () => {
		await expect(
			executeWebviewBinary("/non/existent/path/to/binary", {
				input: "test.html",
				output: "out.pdf",
			}),
		).rejects.toThrow();
	});

	test("resolves bundled native headless webview binary on host", () => {
		const resolvedBinary = resolveWebviewBinary();

		if (resolvedBinary) {
			expect(existsSync(resolvedBinary)).toBe(true);
		} else {
			expect(resolvedBinary).toBeUndefined();
		}
	});

	test("resolveWaitExpression returns explicit waitFor", () => {
		expect(resolveWaitExpression({ waitFor: "window.isReady === true" })).toBe(
			"window.isReady === true",
		);
	});

	test("resolveWaitExpression returns printedjs condition when waitPrintedjs is set", () => {
		expect(resolveWaitExpression({ waitPrintedjs: true })).toBe(
			"Boolean(window.__printedjsRenderFinished || document.querySelector('.printedjs_page'))",
		);
	});

	test("resolveWaitExpression returns pagedjs condition when waitPagedjs is set", () => {
		expect(resolveWaitExpression({ waitPagedjs: true })).toBe(
			"Boolean(window.__pagedRenderFinished || document.querySelector('.pagedjs_page'))",
		);
	});

	test("resolveWaitExpression returns dual condition when both are set", () => {
		expect(resolveWaitExpression({ waitPrintedjs: true, waitPagedjs: true })).toBe(
			"Boolean(window.__printedjsRenderFinished || window.__pagedRenderFinished || document.querySelector('.printedjs_page, .pagedjs_page'))",
		);
	});

	test("resolveWaitExpression returns undefined when no wait options are set", () => {
		expect(resolveWaitExpression({})).toBeUndefined();
	});
});
