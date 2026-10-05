import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer";
import { describe, expect, test } from "vitest";
import { resolveChromeExecutable } from "../helpers/browser.js";
import {
	Handler,
	Previewer,
	createRenderer,
	pageViewsPlugin,
	polyfill,
	registerHandlers,
	singlePageViewPlugin,
	spreadPageViewPlugin,
	standardPreset,
} from "../../packages/minimal/src/index.js";

describe("@printedjs/minimal (full compact bundle)", () => {
	test("exports core rendering functions and compatibility classes", () => {
		expect(typeof createRenderer).toBe("function");
		expect(typeof standardPreset).toBe("function");
		expect(typeof polyfill).toBe("function");
		expect(typeof registerHandlers).toBe("function");
		expect(typeof Previewer).toBe("function");
		expect(typeof Handler).toBe("function");
		expect(typeof singlePageViewPlugin).toBe("function");
		expect(typeof spreadPageViewPlugin).toBe("function");
		expect(typeof pageViewsPlugin).toBe("function");
	});

	test("index.min.global.js bundle exists and is compact", () => {
		const minBundlePath = resolve(
			__dirname,
			"../../packages/minimal/dist/index.min.global.js",
		);

		expect(existsSync(minBundlePath)).toBe(true);

		const stats = readFileSync(minBundlePath);
		// Compact bundle should be under 350KB uncompressed (drastic reduction from unminified)
		expect(stats.length).toBeLessThan(350 * 1024);
		expect(stats.length).toBeGreaterThan(100 * 1024);
	});

	test.runIf(Boolean(resolveChromeExecutable()))(
		"executes minimal bundle in browser and auto-paginates document",
		async () => {
			const tempHtmlPath = resolve(__dirname, "../fixtures/temp-minimal-test.html");

			const bundlePath = resolve(
				__dirname,
				"../../packages/minimal/dist/index.min.global.js",
			);

			const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 15mm;
      @bottom-center { content: counter(page); }
    }
    .page-break { break-before: page; }
  </style>
</head>
<body>
  <div class="section">Page 1 Content</div>
  <div class="page-break">Page 2 Content</div>
  <script src="${bundlePath}"></script>
</body>
</html>`;

			writeFileSync(tempHtmlPath, htmlContent, "utf-8");

			const executablePath = resolveChromeExecutable();

			const browser = await puppeteer.launch({
				headless: true,
				...(executablePath ? { executablePath } : {}),
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});

			try {
				const page = await browser.newPage();
				await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });

				await page.waitForFunction(
					() =>
						(window as unknown as { __printedjsRenderFinished?: boolean })
							.__printedjsRenderFinished === true ||
						document.querySelectorAll(".printedjs_page").length >= 2,
					{ timeout: 10000 },
				);

				const evalResult = await page.evaluate(() => {
					const win = window as unknown as {
						Printedjs?: { polyfill?: unknown };
						Paged?: { polyfill?: unknown };
						PrintedjsMinimal?: { polyfill?: unknown };
						__printedjsRenderFinished?: boolean;
						__pagedPageCount?: number;
					};

					const pagesContainer = document.querySelector(".printedjs_pages");

					return {
						hasPrintedjsGlobal: !!win.Printedjs,
						hasPagedGlobal: !!win.Paged,
						hasPrintedjsMinimalGlobal: !!win.PrintedjsMinimal,
						renderFinished: win.__printedjsRenderFinished === true,
						pagesCount: document.querySelectorAll(".printedjs_page").length,
						viewMode: pagesContainer?.getAttribute("data-view-mode"),
					};
				});

				expect(evalResult.hasPrintedjsGlobal).toBe(true);
				expect(evalResult.hasPagedGlobal).toBe(true);
				expect(evalResult.hasPrintedjsMinimalGlobal).toBe(true);
				expect(evalResult.renderFinished).toBe(true);
				expect(evalResult.pagesCount).toBe(2);
				expect(evalResult.viewMode).toBe("single");
			} finally {
				await browser.close();

				if (existsSync(tempHtmlPath)) {
					unlinkSync(tempHtmlPath);
				}
			}
		},
		20000,
	);

	test.runIf(Boolean(resolveChromeExecutable()))(
		"executes all 5 Paged.Handler lifecycle hooks and PagedConfig callbacks",
		async () => {
			const tempHtmlPath = resolve(__dirname, "../fixtures/temp-lifecycle-test.html");

			const bundlePath = resolve(
				__dirname,
				"../../packages/minimal/dist/index.min.global.js",
			);

			const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script>
    window.hookLogs = [];
    window.addEventListener("printedjs:rendered", function(e) {
      window.hookLogs.push("event.pageCount:" + (e.detail ? e.detail.pageCount : 0));
      window.hookLogs.push("event.totalPages:" + (e.detail ? e.detail.totalPages : 0));
    });
    window.PagedConfig = {
      before: function() {
        window.hookLogs.push("PagedConfig.before");
      },
      after: function(flow) {
        window.hookLogs.push("PagedConfig.after:" + (flow.pages ? flow.pages.length : 0));
        window.hookLogs.push("PagedConfig.after.total:" + (flow.total || 0));
      }
    };
  </script>
  <style>
    @page { size: A4; margin: 10mm; }
  </style>
</head>
<body>
  <div id="content">Lifecycle test content</div>
  <script src="${bundlePath}"></script>
  <script>
    class TestHandler extends Paged.Handler {
      beforeParsed(content) {
        window.hookLogs.push("beforeParsed");
      }
      afterParsed(parsed) {
        window.hookLogs.push("afterParsed");
      }
      beforePageLayout(page, index) {
        window.hookLogs.push("beforePageLayout:" + index);
      }
      afterPageLayout(pageElement, page) {
        window.hookLogs.push("afterPageLayout:" + page.number);
      }
      afterRendered(pages) {
        window.hookLogs.push("afterRendered:" + pages.length);
      }
    }
    Paged.registerHandlers(TestHandler);
  </script>
</body>
</html>`;

			writeFileSync(tempHtmlPath, htmlContent, "utf-8");

			const executablePath = resolveChromeExecutable();

			const browser = await puppeteer.launch({
				headless: true,
				...(executablePath ? { executablePath } : {}),
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});

			try {
				const page = await browser.newPage();
				await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });

				await page.waitForFunction(
					() =>
						(window as unknown as { __printedjsRenderFinished?: boolean })
							.__printedjsRenderFinished === true,
					{ timeout: 10000 },
				);

				const logs = await page.evaluate(() => {
					return (window as unknown as { hookLogs: string[] }).hookLogs;
				});

				expect(logs).toContain("PagedConfig.before");
				expect(logs).toContain("beforeParsed");
				expect(logs).toContain("afterParsed");
				expect(logs).toContain("beforePageLayout:0");
				expect(logs).toContain("afterPageLayout:1");
				expect(logs).toContain("afterRendered:1");
				expect(logs).toContain("PagedConfig.after:1");
				expect(logs).toContain("PagedConfig.after.total:1");
				expect(logs).toContain("event.pageCount:1");
				expect(logs).toContain("event.totalPages:1");
			} finally {
				await browser.close();

				if (existsSync(tempHtmlPath)) {
					unlinkSync(tempHtmlPath);
				}
			}
		},
		20000,
	);

	test.runIf(Boolean(resolveChromeExecutable()))(
		"honors PagedConfig.content and PagedConfig.renderTo custom options",
		async () => {
			const tempHtmlPath = resolve(__dirname, "../fixtures/temp-config-test.html");

			const bundlePath = resolve(
				__dirname,
				"../../packages/minimal/dist/index.min.global.js",
			);

			const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script>
    window.PagedConfig = {
      content: "<p class='custom-injected'>Injected Content via PagedConfig</p>",
      renderTo: "#output-container"
    };
  </script>
  <style>
    @page { size: A4; margin: 10mm; }
  </style>
</head>
<body>
  <div id="original-body">Original content</div>
  <div id="output-container"></div>
  <script src="${bundlePath}"></script>
</body>
</html>`;

			writeFileSync(tempHtmlPath, htmlContent, "utf-8");

			const executablePath = resolveChromeExecutable();

			const browser = await puppeteer.launch({
				headless: true,
				...(executablePath ? { executablePath } : {}),
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});

			try {
				const page = await browser.newPage();
				await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });

				await page.waitForFunction(
					() =>
						(window as unknown as { __printedjsRenderFinished?: boolean })
							.__printedjsRenderFinished === true,
					{ timeout: 10000 },
				);

				const result = await page.evaluate(() => {
					const container = document.getElementById("output-container");
					const customP = container?.querySelector(".custom-injected");
					const pages = container?.querySelectorAll(".printedjs_page");

					return {
						hasPagesInContainer: (pages?.length ?? 0) > 0,
						hasInjectedContent: !!customP,
					};
				});

				expect(result.hasPagesInContainer).toBe(true);
				expect(result.hasInjectedContent).toBe(true);
			} finally {
				await browser.close();

				if (existsSync(tempHtmlPath)) {
					unlinkSync(tempHtmlPath);
				}
			}
		},
		20000,
	);

	test.runIf(Boolean(resolveChromeExecutable()))(
		"renders apps/minimal-demo with single page view mode and centers pages",
		async () => {
			const demoDistPath = resolve(__dirname, "../../apps/minimal-demo/dist/index.html");

			if (!existsSync(demoDistPath)) {
				return;
			}

			const executablePath = resolveChromeExecutable();

			const browser = await puppeteer.launch({
				headless: true,
				...(executablePath ? { executablePath } : {}),
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--allow-file-access-from-files",
				],
			});

			try {
				const page = await browser.newPage();
				await page.goto(`file://${demoDistPath}`, { waitUntil: "networkidle0" });

				await page.waitForFunction(
					() =>
						(window as unknown as { __printedjsRenderFinished?: boolean })
							.__printedjsRenderFinished === true,
					{ timeout: 10000 },
				);

				const result = await page.evaluate(() => {
					const pages = document.querySelectorAll(".printedjs_page");
					const container = document.querySelector(".printedjs_pages");
					const overlay = document.getElementById("loading-overlay");
					const theadCount = document.querySelectorAll(".data-table thead").length;

					const continuationCells = document.querySelectorAll(
						".printedjs-rowspan-continuation",
					).length;

					const nestedTables = document.querySelectorAll(".nested-table").length;

					const tocLinksWithTarget = Array.from(
						document.querySelectorAll(".toc-item a"),
					).filter((a) => a.hasAttribute("data-target-page")).length;

					const colspannedCells = document.querySelectorAll(
						"td[colspan], th[colspan]",
					).length;

					const frontmatterPage = document.querySelector(
						'.printedjs_page[data-page="frontmatter"]',
					);

					const frontmatterStyle = frontmatterPage?.getAttribute("data-page-style");

					const frontmatterFormatted =
						frontmatterPage?.getAttribute("data-page-formatted");

					const execTocTarget = document
						.querySelector('a[href="#sec-executive"]')
						?.getAttribute("data-target-page");

					return {
						pageCount: pages.length,
						viewMode: container?.getAttribute("data-view-mode"),
						overlayHidden: !overlay || overlay.classList.contains("hidden"),
						theadCount,
						continuationCells,
						nestedTables,
						tocLinksWithTarget,
						colspannedCells,
						frontmatterStyle,
						frontmatterFormatted,
						execTocTarget,
					};
				});

				expect(result.pageCount).toBeGreaterThanOrEqual(5);
				expect(result.viewMode).toBe("single");
				expect(result.overlayHidden).toBe(true);
				expect(result.theadCount).toBeGreaterThanOrEqual(2);
				expect(result.continuationCells).toBeGreaterThanOrEqual(1);
				expect(result.nestedTables).toBeGreaterThanOrEqual(1);
				expect(result.tocLinksWithTarget).toBeGreaterThanOrEqual(4);
				expect(result.colspannedCells).toBeGreaterThanOrEqual(4);
				expect(result.frontmatterStyle).toBe("lower-roman");
				expect(result.frontmatterFormatted).toBe("i");
				expect(result.execTocTarget).toBe("i");

				// Verify clicking TOC link navigates across pages to target section
				await page.click('a[href="#sec-nested-tables"]');

				await page.waitForFunction(
					() => {
						const el = document.querySelector("#sec-nested-tables");

						if (!el) {
							return false;
						}

						const rect = el.getBoundingClientRect();

						return Math.abs(rect.top - 115) < 10;
					},
					{ timeout: 5000 },
				);

				const finalScrollY = await page.evaluate(() => window.scrollY);

				expect(finalScrollY).toBeGreaterThan(5000);
			} finally {
				await browser.close();
			}
		},
		20000,
	);
});
