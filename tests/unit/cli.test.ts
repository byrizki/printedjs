import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test, vi } from "vitest";
import {
	printedjsPuppeteerBridge,
	renderPdf,
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
		expect(consoleLogSpy).toHaveBeenCalledWith("printedjs 0.0.0");
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
});
