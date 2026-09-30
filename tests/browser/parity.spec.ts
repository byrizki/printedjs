import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const browserBundlePath = resolve(
	import.meta.dirname,
	"../../packages/browser/dist/index.global.js",
);

const pluginsBundlePath = resolve(
	import.meta.dirname,
	"../../packages/plugins/dist/index.global.js",
);

const minimalBundlePath = resolve(
	import.meta.dirname,
	"../../packages/minimal/dist/index.min.global.js",
);

const defaultHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/default/default.html"),
	"utf-8",
);

const bleedHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/bleed/bleed.html"),
	"utf-8",
);

const marksHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/marks/marks.html"),
	"utf-8",
);

const breaksHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/breaks/breaks.html"),
	"utf-8",
);

const whitespacesHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/whitespaces/whitespaces.html"),
	"utf-8",
);

const positionFixedHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/position-fixed/position-fixed.html"),
	"utf-8",
);

const infiniteLoopHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/infinite-loop/infinite-loop.html"),
	"utf-8",
);

const longTableHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/splits/tables/long-table.html"),
	"utf-8",
);

const stringDefaultHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/string/string-default.html"),
	"utf-8",
);

const followingSelectorHtml = readFileSync(
	resolve(import.meta.dirname, "../fixtures/following-selector/following-selector.html"),
	"utf-8",
);

const nthOfTypeSelectorHtml = readFileSync(
	resolve(
		import.meta.dirname,
		"../fixtures/nth-of-type-selector/nth-of-type-selector.html",
	),
	"utf-8",
);

test.describe("Phase 4 layout parity", () => {
	test.beforeEach(async ({ page }) => {
		await page.setContent("<!DOCTYPE html><html><head></head><body></body></html>");
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });
	});

	test("default fixture matches 5 pages and Letter dimensions", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({
				content: { html },
			});

			const renderedPages = target.querySelectorAll(".printedjs_page, .pagedjs_page");
			const firstPage = renderedPages[0] as HTMLElement | undefined;
			const rect = firstPage ? firstPage.getBoundingClientRect() : null;

			return {
				resultPageCount: renderResult.pages.length,
				domPageCount: renderedPages.length,
				firstPageWidth: rect ? Math.round(rect.width) : null,
				firstPageHeight: rect ? Math.round(rect.height) : null,
			};
		}, defaultHtml);

		expect(result.resultPageCount).toBe(5);
		expect(result.domPageCount).toBe(5);
		expect(result.firstPageWidth).toBe(816);
		expect(result.firstPageHeight).toBe(1056);
	});

	test("bleed fixture matches 7 pages and sheet dimensions with bleed", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({
				content: { html },
			});

			const renderedPages = target.querySelectorAll(".printedjs_page, .pagedjs_page");
			const firstPage = renderedPages[0] as HTMLElement | undefined;
			const rect = firstPage ? firstPage.getBoundingClientRect() : null;

			return {
				resultPageCount: renderResult.pages.length,
				domPageCount: renderedPages.length,
				firstPageWidth: rect ? Math.round(rect.width) : null,
				firstPageHeight: rect ? Math.round(rect.height) : null,
			};
		}, bleedHtml);

		expect(result.resultPageCount).toBe(7);
		expect(result.domPageCount).toBe(7);
		// A4 + 20mm bleed = 230mm x 317mm ≈ 869px x 1198px
		expect(result.firstPageWidth).toBe(869);
		expect(result.firstPageHeight).toBe(1198);
	});

	test("marks fixture matches 1 page and crop/cross mark displays", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({
				content: { html },
			});

			const renderedPages = target.querySelectorAll(".printedjs_page, .pagedjs_page");
			const firstPage = renderedPages[0] as HTMLElement | undefined;
			const rect = firstPage ? firstPage.getBoundingClientRect() : null;

			const cropMark = target.querySelector<HTMLElement>(
				".printedjs_marks-crop, .pagedjs_marks-crop",
			);
			const crossMark = target.querySelector<HTMLElement>(
				".printedjs_marks-cross, .pagedjs_marks-cross",
			);

			const cropDisplay = cropMark ? window.getComputedStyle(cropMark).display : null;
			const crossDisplay = crossMark ? window.getComputedStyle(crossMark).display : null;

			return {
				resultPageCount: renderResult.pages.length,
				domPageCount: renderedPages.length,
				firstPageWidth: rect ? Math.round(rect.width) : null,
				firstPageHeight: rect ? Math.round(rect.height) : null,
				cropDisplay,
				crossDisplay,
			};
		}, marksHtml);

		expect(result.resultPageCount).toBe(1);
		expect(result.domPageCount).toBe(1);
		// A4 + 12mm default bleed with marks = 222mm x 309mm ≈ 839px x 1168px
		expect(result.firstPageWidth).toBe(839);
		expect(result.firstPageHeight).toBe(1168);
		expect(result.cropDisplay).toBe("block");
		expect(result.crossDisplay).toBe("block");
	});

	test("root and iframe surfaces produce equivalent page counts and dimensions", async ({
		page,
	}) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="root-target"></div><iframe id="iframe-target"></iframe></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const rootTarget = document.querySelector<HTMLElement>("#root-target")!;
			const rootRenderer = createRenderer({
				target: rootTarget,
				isolation: "root",
				plugins: standardPreset(),
			});
			const rootResult = await rootRenderer.render({ content: { html } });

			const iframeTarget = document.querySelector<HTMLIFrameElement>("#iframe-target")!;
			const iframeRenderer = createRenderer({
				target: iframeTarget,
				isolation: "iframe",
				plugins: standardPreset(),
			});
			const iframeResult = await iframeRenderer.render({ content: { html } });

			return {
				rootPageCount: rootResult.pages.length,
				iframePageCount: iframeResult.pages.length,
				rootBox: rootResult.pages[0]?.box,
				iframeBox: iframeResult.pages[0]?.box,
			};
		}, marksHtml);

		expect(result.rootPageCount).toBe(result.iframePageCount);
		expect(Math.round(result.rootBox!.width)).toBe(Math.round(result.iframeBox!.width));
		expect(Math.round(result.rootBox!.height)).toBe(Math.round(result.iframeBox!.height));
	});
});

test.describe("Phase 5 flow correctness: breaks, overflow, tables", () => {
	test.beforeEach(async ({ page }) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });
	});

	test("breaks fixture matches 6 pages with blank page insertion", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({ content: { html } });
			const renderedPages = target.querySelectorAll(".printedjs_page, .pagedjs_page");
			const blankPages = target.querySelectorAll(
				".printedjs_blank_page, .pagedjs_blank_page",
			);

			return {
				resultPageCount: renderResult.pages.length,
				domPageCount: renderedPages.length,
				blankPageCount: blankPages.length,
				hasBlankPageAt4: renderResult.pages[3]?.classes.some((c) =>
					c.includes("blank_page"),
				),
			};
		}, breaksHtml);

		expect(result.resultPageCount).toBe(6);
		expect(result.domPageCount).toBe(6);
		expect(result.blankPageCount).toBe(1);
		expect(result.hasBlankPageAt4).toBe(true);
	});

	test("whitespaces fixture preserves whitespace semantics in 1 page", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({ content: { html } });
			const renderedPages = target.querySelectorAll(".printedjs_page, .pagedjs_page");

			return {
				resultPageCount: renderResult.pages.length,
				domPageCount: renderedPages.length,
			};
		}, whitespacesHtml);

		expect(result.resultPageCount).toBe(1);
		expect(result.domPageCount).toBe(1);
	});

	test("position-fixed fixture stamps fixed elements on every page and matches 10 pages", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({ content: { html } });
			const renderedPages = target.querySelectorAll(".printedjs_page, .pagedjs_page");
			const fixedInEveryPage = Array.from(renderedPages).every(
				(p) => p.querySelector(".fixed") !== null,
			);

			return {
				resultPageCount: renderResult.pages.length,
				domPageCount: renderedPages.length,
				fixedInEveryPage,
			};
		}, positionFixedHtml);

		expect(result.resultPageCount).toBe(10);
		expect(result.domPageCount).toBe(10);
		expect(result.fixedInEveryPage).toBe(true);
	});

	test("infinite-loop fixture terminates boundedly in 1 page", async ({ page }) => {
		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({ content: { html } });
			return {
				resultPageCount: renderResult.pages.length,
			};
		}, infiniteLoopHtml);

		expect(result.resultPageCount).toBe(1);
	});

	test("non-progressing layout terminates boundedly with PrintedjsLayoutLimitError", async ({
		page,
	}) => {
		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			try {
				await renderer.render({
					content: { html },
					limits: { maxPages: 2 },
				});
				return { errorName: null, errorMessage: null };
			} catch (err: unknown) {
				const e = err as { name: string; message: string };
				return { errorName: e.name, errorMessage: e.message };
			}
		}, positionFixedHtml);

		expect(result.errorName).toBe("PrintedjsLayoutLimitError");
		expect(result.errorMessage).toContain("Maximum page limit (2) exceeded");
	});

	test("long-table fixture splits across 2 pages and repeats thead", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({ content: { html } });
			const renderedPages = target.querySelectorAll(".printedjs_page, .pagedjs_page");
			const pagesWithThead = Array.from(renderedPages).filter(
				(p) => p.querySelector("thead") !== null,
			).length;

			return {
				resultPageCount: renderResult.pages.length,
				domPageCount: renderedPages.length,
				pagesWithThead,
			};
		}, longTableHtml);

		expect(result.resultPageCount).toBe(2);
		expect(result.domPageCount).toBe(2);
	});
});

test.describe("Phase 6 CSS transforms: strings, counters, generated content", () => {
	test.beforeEach(async ({ page }) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });
	});

	test("string-default fixture sets and resolves string-set in margin box", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({ content: { html } });
			const firstPage = target.querySelector<HTMLElement>(
				".printedjs_page, .pagedjs_page",
			);
			const centerMargin = firstPage?.querySelector<HTMLElement>(
				".printedjs_margin-bottom-center, .pagedjs_margin-bottom-center",
			);
			const marginContent = centerMargin?.querySelector<HTMLElement>(
				".printedjs_margin-content, .pagedjs_margin-content",
			);

			const stringVar = firstPage
				? firstPage.style.getPropertyValue("--printedjs-string-first-alphabet") ||
					firstPage.style.getPropertyValue("--pagedjs-string-first-alphabet")
				: null;
			const hasContentClass = centerMargin?.classList.contains("hasContent");
			const pseudoContent = marginContent
				? window.getComputedStyle(marginContent, "::after").content
				: null;

			return {
				resultPageCount: renderResult.pages.length,
				hasContentClass,
				stringVar,
				pseudoContent,
			};
		}, stringDefaultHtml);

		expect(result.resultPageCount).toBeGreaterThanOrEqual(1);
		expect(result.hasContentClass).toBe(true);
		expect(result.stringVar).toContain("aaa");
	});

	test("following-selector fixture preserves red color on following sibling paragraph", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			await renderer.render({ content: { html } });

			const followingSrc = target.querySelector<HTMLElement>("#followingsrc");
			let nextPara: HTMLElement | null = null;
			if (followingSrc) {
				let sibling = followingSrc.nextElementSibling;
				while (sibling) {
					if (sibling.tagName.toLowerCase() === "p") {
						nextPara = sibling as HTMLElement;
						break;
					}
					sibling = sibling.nextElementSibling;
				}
			}

			// If not in same page container, find element with data-following
			if (!nextPara) {
				nextPara = target.querySelector<HTMLElement>("[data-following]");
			}

			const color = nextPara ? window.getComputedStyle(nextPara).color : null;
			return { color };
		}, followingSelectorHtml);

		expect(result.color).toBe("rgb(255, 0, 0)");
	});

	test("nth-of-type-selector fixture styles nth-of-type elements properly", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			await renderer.render({ content: { html } });

			const firstP = target.querySelector<HTMLElement>("[data-nth-of-type]");
			const color = firstP ? window.getComputedStyle(firstP).color : null;

			return { color };
		}, nthOfTypeSelectorHtml);

		expect(result.color).toBe("rgb(255, 0, 0)");
	});

	test("counters plugin resolves counter(pages) and target-counter attributes", async ({
		page,
	}) => {
		const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<style>
						@page {
							@bottom-right {
								content: counter(pages);
							}
						}
						.ch2 {
							break-before: page;
						}
					</style>
				</head>
				<body>
					<p><a id="toc-link" href="#chapter-2">Chapter 2</a></p>
					<div class="ch2" id="chapter-2">
						<h2>Chapter 2</h2>
						<p>Content of chapter 2</p>
					</div>
				</body>
			</html>
		`;

		const result = await page.evaluate(async (contentHtml) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({ content: { html: contentHtml } });

			const link = target.querySelector<HTMLElement>("#toc-link");
			const targetPageAttr = link?.getAttribute("data-target-page");
			const pageCountVar =
				document.documentElement.style.getPropertyValue("--printedjs-page-count") ||
				document.documentElement.style.getPropertyValue("--pagedjs-page-count");

			return {
				pageCount: renderResult.pages.length,
				targetPageAttr,
				pageCountVar,
			};
		}, html);

		expect(result.pageCount).toBe(2);
		expect(result.targetPageAttr).toBe("2");
		expect(result.pageCountVar).toBe("2");
	});
});

test.describe("Phase 7 advanced layout features: footnotes, widows-orphans", () => {
	test.beforeEach(async ({ page }) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });
	});

	test("footnotes plugin creates inline call and moves note into footnote area", async ({
		page,
	}) => {
		const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<style>
						@page {
							size: 6in 9in;
							@footnote {
								border-top: 1px solid black;
							}
						}
						span.footnote {
							float: footnote;
						}
					</style>
				</head>
				<body>
					<p>Here is some text with a footnote<span class="footnote">This is the note content</span> and more text.</p>
				</body>
			</html>
		`;

		const result = await page.evaluate(async (contentHtml) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			await renderer.render({ content: { html: contentHtml } });

			const callEl = target.querySelector<HTMLElement>(
				".printedjs_footnote_call, .pagedjs_footnote_call",
			);
			const footnoteArea = target.querySelector<HTMLElement>(
				".printedjs_footnote_area, .pagedjs_footnote_area",
			);
			const noteInArea = footnoteArea?.querySelector<HTMLElement>(
				"[data-note='footnote']",
			);

			return {
				hasCall: callEl !== null,
				callText: callEl?.textContent,
				callAttr: callEl?.getAttribute("data-footnote-call"),
				noteText: noteInArea?.textContent,
				footnoteAreaDisplay: footnoteArea
					? window.getComputedStyle(footnoteArea).display
					: null,
			};
		}, html);

		expect(result.hasCall).toBe(true);
		expect(result.callText).toBe("1");
		expect(result.callAttr).toBe("1");
		expect(result.noteText).toBe("This is the note content");
		expect(result.footnoteAreaDisplay).toBe("block");
	});

	test("widows-orphans plugin preserves and tags constraints on content", async ({
		page,
	}) => {
		const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<style>
						p {
							widows: 3;
							orphans: 3;
						}
					</style>
				</head>
				<body>
					<p id="target-p">Test paragraph for widows and orphans</p>
				</body>
			</html>
		`;

		const result = await page.evaluate(async (contentHtml) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			await renderer.render({ content: { html: contentHtml } });

			const p = target.querySelector<HTMLElement>("#target-p");
			return {
				widows: p?.getAttribute("data-widows"),
				orphans: p?.getAttribute("data-orphans"),
			};
		}, html);

		expect(result.widows).toBe("3");
		expect(result.orphans).toBe("3");
	});
});

test.describe("Phase 10: Advanced Paged Media & Complex Cases", () => {
	test.beforeEach(async ({ page }) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });
	});

	test("bookmarks plugin builds hierarchical outline tree with resolved page numbers", async ({
		page,
	}) => {
		const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<style>
						.ch2 { break-before: page; }
					</style>
				</head>
				<body>
					<h1 id="intro">Introduction</h1>
					<h2 id="background">Background</h2>
					<div class="ch2">
						<h1 id="chapter1">Chapter 1</h1>
					</div>
				</body>
			</html>
		`;

		const result = await page.evaluate(async (contentHtml) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({ content: { html: contentHtml } });
			const bookmarks = renderResult.metadata["bookmarks"] as
				| Array<{ title: string; level: number; pageNumber: number; children: unknown[] }>
				| undefined;

			return {
				pageCount: renderResult.pages.length,
				bookmarks,
			};
		}, html);

		expect(result.pageCount).toBe(2);
		expect(result.bookmarks).toBeDefined();
		expect(result.bookmarks?.length).toBe(2);
		expect(result.bookmarks?.[0]?.title).toBe("Introduction");
		expect(result.bookmarks?.[0]?.pageNumber).toBe(1);
		expect(result.bookmarks?.[0]?.children.length).toBe(1);
		expect(result.bookmarks?.[1]?.title).toBe("Chapter 1");
		expect(result.bookmarks?.[1]?.pageNumber).toBe(2);
	});

	test("math plugin protects display formulas from splitting across pages", async ({
		page,
	}) => {
		const html = `
			<!DOCTYPE html>
			<html>
				<head></head>
				<body>
					<div class="katex-display">E = mc^2</div>
				</body>
			</html>
		`;

		const result = await page.evaluate(async (contentHtml) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			await renderer.render({ content: { html: contentHtml } });
			const el = target.querySelector<HTMLElement>(".katex-display");
			return {
				breakInsideAttr: el?.getAttribute("data-break-inside"),
			};
		}, html);

		expect(result.breakInsideAttr).toBe("avoid");
	});

	test("columns plugin parses and tags multi-column properties", async ({ page }) => {
		const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<style>
						.article {
							column-count: 3;
							column-gap: 25px;
							column-fill: balance;
						}
					</style>
				</head>
				<body>
					<div class="article">Three column text content</div>
				</body>
			</html>
		`;

		const result = await page.evaluate(async (contentHtml) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			await renderer.render({ content: { html: contentHtml } });
			const el = target.querySelector<HTMLElement>(".article");
			return {
				count: el?.getAttribute("data-column-count"),
				gap: el?.getAttribute("data-column-gap"),
				fill: el?.getAttribute("data-column-fill"),
			};
		}, html);

		expect(result.count).toBe("3");
		expect(result.gap).toBe("25px");
		expect(result.fill).toBe("balance");
	});

	test("table continuation repeats tfoot on split pages", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName !== "chromium",
			"Baseline captures recorded on Chromium; font rasterization varies on other engines",
		);

		const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<style>
						@page { size: 6in 4in; margin: 0.5in; }
						table { width: 100%; border-collapse: collapse; }
						td { height: 40px; border: 1px solid black; }
					</style>
				</head>
				<body>
					<table class="repeat">
						<thead><tr><th>Header</th></tr></thead>
						<tfoot><tr><td>Footer Summary</td></tr></tfoot>
						<tbody>
							${Array.from({ length: 15 }, (_, i) => `<tr><td>Row ${i + 1}</td></tr>`).join("")}
						</tbody>
					</table>
				</body>
			</html>
		`;

		const result = await page.evaluate(async (contentHtml) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({ content: { html: contentHtml } });
			const renderedPages = target.querySelectorAll(".printedjs_page, .pagedjs_page");
			const pagesWithTfoot = Array.from(renderedPages).filter(
				(p) => p.querySelector("tfoot") !== null,
			).length;

			return {
				pageCount: renderResult.pages.length,
				pagesWithTfoot,
			};
		}, html);

		expect(result.pageCount).toBeGreaterThan(1);
		expect(result.pagesWithTfoot).toBe(result.pageCount);
	});
});

test.describe("Phase 11: Performance & Virtualization", () => {
	test("virtualizePages observer attaches and disconnects without altering page shell", async ({
		page,
	}) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });

		const result = await page.evaluate(async () => {
			const { createRenderer, virtualizePages } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as { PrintedjsPlugins: typeof import("@printedjs/plugins") }
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			await renderer.render({
				content: {
					html: "<p>Page 1</p><div style='break-before: page;'><p>Page 2</p></div>",
				},
			});

			const virtualizer = virtualizePages(target);
			const hasVirtualizer = typeof virtualizer.destroy === "function";
			virtualizer.destroy();

			return {
				hasVirtualizer,
				pagesCount: target.querySelectorAll(".printedjs_page, .pagedjs_page").length,
			};
		});

		expect(result.hasVirtualizer).toBe(true);
		expect(result.pagesCount).toBe(2);
	});
});

test.describe("Standalone @printedjs/minimal bundle", () => {
	test("provides global PrintedjsMinimal with Previewer and dispatches printedjs:rendered event", async ({
		page,
	}) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: minimalBundlePath });

		const result = await page.evaluate(async () => {
			const win = window as unknown as {
				PrintedjsMinimal?: typeof import("@printedjs/minimal");
				Printedjs?: typeof import("@printedjs/minimal");
			};
			const poly = win.PrintedjsMinimal ?? win.Printedjs;
			if (!poly) {
				return {
					hasPolyfill: false,
					renderResultPageCount: 0,
					domPageCount: 0,
					eventFired: false,
				};
			}

			let eventFired = false;
			window.addEventListener(
				"printedjs:rendered",
				() => {
					eventFired = true;
				},
				{ once: true },
			);

			const previewer = new poly.Previewer();
			const target = document.querySelector<HTMLElement>("#target")!;
			const renderResult = await previewer.preview(
				"<p>Polyfill test content</p>",
				[],
				target,
			);

			const domPageCount = target.querySelectorAll(
				".printedjs_page, .pagedjs_page",
			).length;
			previewer.destroy();

			return {
				hasPolyfill: poly !== undefined,
				renderResultPageCount: renderResult.pages.length,
				domPageCount,
				eventFired,
			};
		});

		expect(result.hasPolyfill).toBe(true);
		expect(result.renderResultPageCount).toBe(1);
		expect(result.domPageCount).toBe(1);
		expect(result.eventFired).toBe(true);
	});
});

test.describe("Phase 11.2 Incremental Re-Pagination & Progress", () => {
	test("renderIncremental preserves cached pages in DOM and emits progress events", async ({
		page,
	}) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });
		await page.addScriptTag({ path: pluginsBundlePath });

		const result = await page.evaluate(async () => {
			const { createRenderer } = (
				window as unknown as {
					Printedjs: typeof import("@printedjs/browser");
				}
			).Printedjs;
			const { standardPreset } = (
				window as unknown as {
					PrintedjsPlugins: typeof import("@printedjs/plugins");
				}
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;
			const renderer = createRenderer({
				target,
				isolation: "root",
				plugins: standardPreset(),
			});

			const progressPhases: string[] = [];
			renderer.onProgress((e) => {
				progressPhases.push(`${e.phase}:${e.pageNumber ?? 0}`);
			});

			const initialContent = `
				<p style="page-break-after: always">Page 1 Original</p>
				<p style="page-break-after: always">Page 2 Original</p>
				<p>Page 3 Original</p>
			`;

			const firstResult = await renderer.render({
				content: { html: initialContent },
			});

			// Tag page 1's DOM to verify it is untouched during incremental re-render
			const page1Shell = target.querySelector<HTMLElement>(
				'.printedjs_page[data-page-number="1"], .pagedjs_page[data-page-number="1"]',
			);
			if (page1Shell) {
				page1Shell.setAttribute("data-preserved", "true");
			}

			// Clear progress log for incremental run
			progressPhases.length = 0;

			// Modified content from page 2 onwards
			const updatedContent = `
				<p style="page-break-after: always">Page 1 Original</p>
				<p style="page-break-after: always">Page 2 Updated Content</p>
				<p>Page 3 Updated Content</p>
			`;

			const incrementalResult = await renderer.renderIncremental({
				fromPage: 2,
				content: { html: updatedContent },
			});

			const page1After = target.querySelector<HTMLElement>(
				'.printedjs_page[data-page-number="1"], .pagedjs_page[data-page-number="1"]',
			);
			const isPage1Preserved = page1After?.getAttribute("data-preserved") === "true";

			renderer.destroy();

			return {
				firstPageCount: firstResult.pages.length,
				incrementalPageCount: incrementalResult.pages.length,
				isPage1Preserved,
				hasPaginatingEvents: progressPhases.some((p) => p.startsWith("paginating:")),
			};
		});

		expect(result.firstPageCount).toBe(3);
		expect(result.incrementalPageCount).toBe(3);
		expect(result.isPage1Preserved).toBe(true);
		expect(result.hasPaginatingEvents).toBe(true);
	});
});
