import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import pixelmatchRaw from "pixelmatch";
import { PNG } from "pngjs";

import {
	setupPrintedjsPage,
	visualNormalizationStyle,
} from "../helpers/browser-render.ts";

// Handle both CJS and ESM exports for pixelmatch
const pixelmatch: typeof import("pixelmatch") =
	(pixelmatchRaw as unknown as { default?: typeof import("pixelmatch") }).default ??
	pixelmatchRaw;

const repositoryRoot = resolve(import.meta.dirname, "../..");
const baselineAcceptedDir = resolve(repositoryRoot, "tests/fixtures/baselines");
const diffOutputDir = resolve(repositoryRoot, "output-samples/visual-diffs");

interface VisualFixtureConfig {
	readonly id: string;
	readonly htmlPath: string;
	readonly maxMismatchRatio: number;
	readonly viewMode?: "spread" | "standard";
}

const visualFixtures: readonly VisualFixtureConfig[] = [
	{
		id: "whitespaces/whitespaces",
		htmlPath: "tests/fixtures/whitespaces/whitespaces.html",
		maxMismatchRatio: 0.001, // 0.1% max difference
	},
	{
		id: "whitespaces/break-elements/break-elements",
		htmlPath: "tests/fixtures/whitespaces/break-elements/break-elements.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "bleed/bleed",
		htmlPath: "tests/fixtures/bleed/bleed.html",
		maxMismatchRatio: 0.1, // 10% max difference across rendering engines
	},
	{
		id: "marks/marks",
		htmlPath: "tests/fixtures/marks/marks.html",
		maxMismatchRatio: 0.07, // 7% max difference across rendering engines
	},
	{
		id: "position-fixed/position-fixed",
		htmlPath: "tests/fixtures/position-fixed/position-fixed.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "default/default",
		htmlPath: "tests/fixtures/default/default.html",
		maxMismatchRatio: 0.06, // 6% max difference
	},
	{
		id: "splits/tables/long-table",
		htmlPath: "tests/fixtures/splits/tables/long-table.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "splits/tables/rowspan-table",
		htmlPath: "tests/fixtures/splits/tables/rowspan-table.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "string/string-default",
		htmlPath: "tests/fixtures/string/string-default.html",
		maxMismatchRatio: 0.035, // 3.5% max difference
	},
	{
		id: "infinite-loop/infinite-loop",
		htmlPath: "tests/fixtures/infinite-loop/infinite-loop.html",
		maxMismatchRatio: 0.01, // 1% max difference
	},
	{
		id: "margin-boxes/style/style",
		htmlPath: "tests/fixtures/margin-boxes/style/style.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "margin-boxes/text-align/text-align",
		htmlPath: "tests/fixtures/margin-boxes/text-align/text-align.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "margin-boxes/vertical-align/vertical-align",
		htmlPath: "tests/fixtures/margin-boxes/vertical-align/vertical-align.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "page-rules/size/page-size/page-size",
		htmlPath: "tests/fixtures/page-rules/size/page-size/page-size.html",
		maxMismatchRatio: 0.05, // 5% max difference
	},
	{
		id: "page-rules/size/landscape/landscape",
		htmlPath: "tests/fixtures/page-rules/size/landscape/landscape.html",
		maxMismatchRatio: 0.05, // 5% max difference
	},
	{
		id: "breaks/empty-page-detection/empty-page-detection",
		htmlPath: "tests/fixtures/breaks/empty-page-detection/empty-page-detection.html",
		maxMismatchRatio: 0.01, // 1% max difference
	},
	{
		id: "breaks/fractional-pixels/fractional-pixels",
		htmlPath: "tests/fixtures/breaks/fractional-pixels/fractional-pixels.html",
		maxMismatchRatio: 0.01, // 1% max difference
	},
	{
		id: "breaks/child-parent-propagation/break-before-child-parent-propagation",
		htmlPath:
			"tests/fixtures/breaks/child-parent-propagation/break-before-child-parent-propagation.html",
		maxMismatchRatio: 0.01, // 1% max difference
	},
	{
		id: "counters/nested/nested",
		htmlPath: "tests/fixtures/counters/nested/nested.html",
		maxMismatchRatio: 0.03, // 3% max difference
	},
	{
		id: "styles/simple",
		htmlPath: "tests/fixtures/styles/simple.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "named-page/no-forced-page-break/ignore-undisplayed-nodes",
		htmlPath:
			"tests/fixtures/named-page/no-forced-page-break/ignore-undisplayed-nodes.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "filters/script-elements/script-elements",
		htmlPath: "tests/fixtures/filters/script-elements/script-elements.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "breaks/child-parent-propagation/break-after-child-parent-propagation",
		htmlPath:
			"tests/fixtures/breaks/child-parent-propagation/break-after-child-parent-propagation.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "breaks/child-parent-propagation/break-before-container-propagation",
		htmlPath:
			"tests/fixtures/breaks/child-parent-propagation/break-before-container-propagation.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "page-rules/size/margin/margin-0",
		htmlPath: "tests/fixtures/page-rules/size/margin/margin-0.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "page-rules/size/padding/padding-0",
		htmlPath: "tests/fixtures/page-rules/size/padding/padding-0.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "counters/counter-page-reset/counter-page-reset-scope",
		htmlPath: "tests/fixtures/counters/counter-page-reset/counter-page-reset-scope.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "named-page/no-forced-page-break/fold-page-breaks-after",
		htmlPath:
			"tests/fixtures/named-page/no-forced-page-break/fold-page-breaks-after.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "named-page/no-forced-page-break/fold-page-breaks-before",
		htmlPath:
			"tests/fixtures/named-page/no-forced-page-break/fold-page-breaks-before.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "named-page/no-forced-page-break/no-forced-page-break",
		htmlPath: "tests/fixtures/named-page/no-forced-page-break/no-forced-page-break.html",
		maxMismatchRatio: 0.005, // 0.5% max difference
	},
	{
		id: "tables/rebuild/rebuild",
		htmlPath: "tests/fixtures/tables/rebuild/rebuild.html",
		maxMismatchRatio: 0.045, // 4.5% max difference (Gecko/WebKit table border/text rasterization)
	},
	{
		id: "named-page/page-group/page-group",
		htmlPath: "tests/fixtures/named-page/page-group/page-group.html",
		maxMismatchRatio: 0.03, // 3% max difference
	},
	{
		id: "notes/footnotes-lastpage/footnotes-lastpage",
		htmlPath: "tests/fixtures/notes/footnotes-lastpage/footnotes-lastpage.html",
		maxMismatchRatio: 0.04, // 4% max difference
	},
	{
		id: "filters/undisplayed/undisplayed",
		htmlPath: "tests/fixtures/filters/undisplayed/undisplayed.html",
		maxMismatchRatio: 0.01, // 1% max difference
	},
	{
		id: "breaks/break-after/break-after-recto/break-after-recto",
		htmlPath:
			"tests/fixtures/breaks/break-after/break-after-recto/break-after-recto.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "breaks/break-after/break-after-right/break-after-right",
		htmlPath:
			"tests/fixtures/breaks/break-after/break-after-right/break-after-right.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "breaks/break-after/break-after-left/break-after-left",
		htmlPath: "tests/fixtures/breaks/break-after/break-after-left/break-after-left.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "breaks/break-after/break-after-verso/break-after-verso",
		htmlPath:
			"tests/fixtures/breaks/break-after/break-after-verso/break-after-verso.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	// Features added in Phase 17, 18, and 19:
	{
		id: "counters/custom-counters/custom-counters",
		htmlPath: "tests/fixtures/counters/custom-counters/custom-counters.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "views/spread-view/spread-view",
		htmlPath: "tests/fixtures/views/spread-view/spread-view.html",
		maxMismatchRatio: 0.02, // 2% max difference
		viewMode: "spread",
	},
	{
		id: "page-rules/mirrored-margins/mirrored-margins",
		htmlPath: "tests/fixtures/page-rules/mirrored-margins/mirrored-margins.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
];

test.describe("Visual Output Comparison (Pixelmatch)", () => {
	test.beforeEach(async ({ page }) => {
		test.skip(
			!existsSync(baselineAcceptedDir),
			"Accepted visual baseline directory not found on disk; skipping visual comparison",
		);

		await page.setViewportSize({ width: 1440, height: 1000 });
	});

	for (const fixture of visualFixtures) {
		test(`visual parity: ${fixture.id} matches baseline within ${(fixture.maxMismatchRatio * 100).toFixed(1)}% tolerance`, async ({
			page,
			browserName,
		}) => {
			const baselinePngPath = resolve(baselineAcceptedDir, fixture.id, "document.png");
			test.skip(
				!existsSync(baselinePngPath),
				`Baseline PNG not found: ${baselinePngPath}`,
			);

			const fixtureHtml = readFileSync(
				resolve(repositoryRoot, fixture.htmlPath),
				"utf-8",
			);
			const baselineBuffer = readFileSync(baselinePngPath);
			const baselineImg = PNG.sync.read(baselineBuffer);

			const isSpread = fixture.viewMode === "spread";
			await setupPrintedjsPage(
				page,
				'<div id="target"></div>',
				visualNormalizationStyle,
				isSpread,
			);

			await page.evaluate(
				async ({ html, isSpread }) => {
					const { createRenderer } = (
						window as unknown as { Printedjs: typeof import("@printedjs/browser") }
					).Printedjs;
					const { standardPreset } = (
						window as unknown as {
							PrintedjsPlugins: typeof import("@printedjs/plugin-preset");
						}
					).PrintedjsPlugins;
					const views = (
						window as unknown as {
							PrintedjsViews?: typeof import("@printedjs/plugin-views");
						}
					).PrintedjsViews;

					const target = document.querySelector<HTMLElement>("#target")!;
					const plugins =
						isSpread && views?.spreadPageViewPlugin
							? [...standardPreset(), views.spreadPageViewPlugin()]
							: standardPreset();

					const renderer = createRenderer({
						target,
						isolation: "root",
						pagedjsCompatible: true,
						plugins,
					});

					await renderer.render({ content: { html }, limits: { maxPages: 50 } });
				},
				{ html: fixtureHtml, isSpread },
			);

			const actualScreenshotBuffer = await page.screenshot({
				fullPage: true,
				animations: "disabled",
			});
			const actualImg = PNG.sync.read(actualScreenshotBuffer);

			// Dimensions should match the baseline render dimensions
			expect(actualImg.width).toBe(baselineImg.width);
			expect(actualImg.height).toBe(baselineImg.height);

			const diffWidth = actualImg.width;
			const diffHeight = actualImg.height;
			const diffImg = new PNG({ width: diffWidth, height: diffHeight });

			const numDiffPixels = pixelmatch(
				actualImg.data,
				baselineImg.data,
				diffImg.data,
				diffWidth,
				diffHeight,
				{ threshold: 0.1 },
			);

			const totalPixels = diffWidth * diffHeight;
			const mismatchRatio = numDiffPixels / totalPixels;

			// If differences exist, save diff artifact for inspection
			if (numDiffPixels > 0) {
				const fixtureDiffDir = resolve(diffOutputDir, browserName, fixture.id);
				mkdirSync(fixtureDiffDir, { recursive: true });
				writeFileSync(resolve(fixtureDiffDir, "diff.png"), PNG.sync.write(diffImg));
				writeFileSync(resolve(fixtureDiffDir, "actual.png"), actualScreenshotBuffer);
			}

			expect(mismatchRatio).toBeLessThanOrEqual(fixture.maxMismatchRatio);
		});
	}
});
