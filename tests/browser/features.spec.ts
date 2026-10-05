import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

import {
	setupPrintedjsPage,
	visualNormalizationStyle,
} from "../helpers/browser-render.ts";

const repoRoot = resolve(import.meta.dirname, "../..");

const customCountersHtml = readFileSync(
	resolve(repoRoot, "tests/fixtures/counters/custom-counters/custom-counters.html"),
	"utf-8",
);

const spreadViewHtml = readFileSync(
	resolve(repoRoot, "tests/fixtures/views/spread-view/spread-view.html"),
	"utf-8",
);

const mirroredMarginsHtml = readFileSync(
	resolve(repoRoot, "tests/fixtures/page-rules/mirrored-margins/mirrored-margins.html"),
	"utf-8",
);

test.describe("Phase 17, 18, and 19 Features Specification", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
	});

	test("Phase 17: multi-section pagination with roman numerals, decimal restarts, and alpha appendices", async ({
		page,
	}) => {
		await setupPrintedjsPage(page, '<div id="target"></div>', visualNormalizationStyle);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;

			const { standardPreset } = (
				window as unknown as {
					PrintedjsPlugins: typeof import("@printedjs/plugin-preset");
				}
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;

			const renderer = createRenderer({
				target,
				isolation: "root",
				pagedjsCompatible: true,
				plugins: standardPreset(),
			});

			const renderRes = await renderer.render({
				content: { html },
				limits: { maxPages: 20 },
			});

			const pages = Array.from(target.querySelectorAll<HTMLElement>(".printedjs_page"));

			return {
				pageCount: renderRes.pages.length,
				pagesMeta: pages.map((p, idx) => ({
					index: idx + 1,
					physicalPage: p.getAttribute("data-physical-page-number"),
					logicalPage: p.getAttribute("data-page-number"),
					pageStyle: p.getAttribute("data-page-style"),
					pageFormatted: p.getAttribute("data-page-formatted"),
					classes: Array.from(p.classList),
					bottomRight:
						p.querySelector(".printedjs_margin-bottom-right")?.textContent?.trim() ?? "",
				})),
			};
		}, customCountersHtml);

		expect(result.pageCount).toBe(7);

		// Page 1: Cover (initial default decimal)
		expect(result.pagesMeta[0]?.physicalPage).toBe("1");
		expect(result.pagesMeta[0]?.logicalPage).toBe("1");
		expect(result.pagesMeta[0]?.pageFormatted).toBe("1");

		// Page 2: Frontmatter TOC (lower-roman: i)
		expect(result.pagesMeta[1]?.physicalPage).toBe("2");
		expect(result.pagesMeta[1]?.logicalPage).toBe("1");
		expect(result.pagesMeta[1]?.pageStyle).toBe("lower-roman");
		expect(result.pagesMeta[1]?.pageFormatted).toBe("i");

		// Page 3: Frontmatter Preface (lower-roman: ii)
		expect(result.pagesMeta[2]?.physicalPage).toBe("3");
		expect(result.pagesMeta[2]?.logicalPage).toBe("2");
		expect(result.pagesMeta[2]?.pageStyle).toBe("lower-roman");
		expect(result.pagesMeta[2]?.pageFormatted).toBe("ii");

		// Page 4: Body Chapter 1 (restarts counter to decimal 1)
		expect(result.pagesMeta[3]?.physicalPage).toBe("4");
		expect(result.pagesMeta[3]?.logicalPage).toBe("1");
		expect(result.pagesMeta[3]?.pageStyle).toBe("decimal");
		expect(result.pagesMeta[3]?.pageFormatted).toBe("1");

		// Page 5: Body Chapter 2 (decimal 2)
		expect(result.pagesMeta[4]?.physicalPage).toBe("5");
		expect(result.pagesMeta[4]?.logicalPage).toBe("2");
		expect(result.pagesMeta[4]?.pageFormatted).toBe("2");

		// Page 6: Appendix A (restarts counter to upper-alpha A)
		expect(result.pagesMeta[5]?.physicalPage).toBe("6");
		expect(result.pagesMeta[5]?.logicalPage).toBe("1");
		expect(result.pagesMeta[5]?.pageStyle).toBe("upper-alpha");
		expect(result.pagesMeta[5]?.pageFormatted).toBe("A");

		// Page 7: Appendix B (upper-alpha B)
		expect(result.pagesMeta[6]?.physicalPage).toBe("7");
		expect(result.pagesMeta[6]?.logicalPage).toBe("2");
		expect(result.pagesMeta[6]?.pageStyle).toBe("upper-alpha");
		expect(result.pagesMeta[6]?.pageFormatted).toBe("B");
	});

	test("Phase 18: spread page view pairs facing verso/recto pages and formats cover recto", async ({
		page,
	}) => {
		await setupPrintedjsPage(
			page,
			'<div id="target"></div>',
			visualNormalizationStyle,
			true,
		);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;

			const { standardPreset } = (
				window as unknown as {
					PrintedjsPlugins: typeof import("@printedjs/plugin-preset");
				}
			).PrintedjsPlugins;

			const { spreadPageViewPlugin } = (
				window as unknown as { PrintedjsViews: typeof import("@printedjs/plugin-views") }
			).PrintedjsViews;

			const target = document.querySelector<HTMLElement>("#target")!;

			const renderer = createRenderer({
				target,
				isolation: "root",
				pagedjsCompatible: true,
				plugins: [...standardPreset(), spreadPageViewPlugin()],
			});

			const renderRes = await renderer.render({
				content: { html },
				limits: { maxPages: 20 },
			});

			const pages = Array.from(target.querySelectorAll<HTMLElement>(".printedjs_page"));

			return {
				pageCount: renderRes.pages.length,
				pagesMeta: pages.map((p, idx) => ({
					index: idx + 1,
					classes: Array.from(p.classList),
					spreadSide: p.getAttribute("data-spread-side") ?? "",
				})),
			};
		}, spreadViewHtml);

		expect(result.pageCount).toBe(4);
		// Page 1 is right-hand recto (cover)
		expect(result.pagesMeta[0]?.classes).toContain("printedjs_right_page");
		// Page 2 is left-hand verso
		expect(result.pagesMeta[1]?.classes).toContain("printedjs_left_page");
		// Page 3 is right-hand recto
		expect(result.pagesMeta[2]?.classes).toContain("printedjs_right_page");
		// Page 4 is left-hand verso
		expect(result.pagesMeta[3]?.classes).toContain("printedjs_left_page");
	});

	test("Phase 19: mirrored margins and gutter binding allocate spine margins dynamically", async ({
		page,
	}) => {
		await setupPrintedjsPage(page, '<div id="target"></div>', visualNormalizationStyle);

		const result = await page.evaluate(async (html) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;

			const { standardPreset } = (
				window as unknown as {
					PrintedjsPlugins: typeof import("@printedjs/plugin-preset");
				}
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>("#target")!;

			const renderer = createRenderer({
				target,
				isolation: "root",
				pagedjsCompatible: true,
				plugins: standardPreset(),
			});

			const renderRes = await renderer.render({
				content: { html },
				limits: { maxPages: 20 },
			});

			const pages = Array.from(target.querySelectorAll<HTMLElement>(".printedjs_page"));

			return {
				pageCount: renderRes.pages.length,
				pagesMeta: pages.map((p, idx) => {
					const style = window.getComputedStyle(p);

					return {
						index: idx + 1,
						isRight: p.classList.contains("printedjs_right_page"),
						isLeft: p.classList.contains("printedjs_left_page"),
						marginLeftVar: style.getPropertyValue("--printedjs-margin-left").trim(),
						marginRightVar: style.getPropertyValue("--printedjs-margin-right").trim(),
					};
				}),
			};
		}, mirroredMarginsHtml);

		expect(result.pageCount).toBe(4);

		// Page 1: Right page -> inside margin on LEFT: calc(25mm + 5mm) = 30mm; outside on RIGHT: 15mm
		expect(result.pagesMeta[0]?.isRight).toBe(true);
		expect(result.pagesMeta[0]?.marginLeftVar).toBe("calc(25mm + 5mm)");
		expect(result.pagesMeta[0]?.marginRightVar).toBe("15mm");

		// Page 2: Left page -> inside margin on RIGHT: calc(25mm + 5mm) = 30mm; outside on LEFT: 15mm
		expect(result.pagesMeta[1]?.isLeft).toBe(true);
		expect(result.pagesMeta[1]?.marginRightVar).toBe("calc(25mm + 5mm)");
		expect(result.pagesMeta[1]?.marginLeftVar).toBe("15mm");

		// Page 3: Right page -> inside margin on LEFT: calc(25mm + 5mm)
		expect(result.pagesMeta[2]?.isRight).toBe(true);
		expect(result.pagesMeta[2]?.marginLeftVar).toBe("calc(25mm + 5mm)");
		expect(result.pagesMeta[2]?.marginRightVar).toBe("15mm");

		// Page 4: Left page -> inside margin on RIGHT: calc(25mm + 5mm)
		expect(result.pagesMeta[3]?.isLeft).toBe(true);
		expect(result.pagesMeta[3]?.marginRightVar).toBe("calc(25mm + 5mm)");
		expect(result.pagesMeta[3]?.marginLeftVar).toBe("15mm");
	});
});
