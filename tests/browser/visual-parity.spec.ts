import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";
import pixelmatchRaw from "pixelmatch";

// Handle both CJS and ESM exports for pixelmatch
const pixelmatch: typeof import("pixelmatch") =
	(pixelmatchRaw as unknown as { default?: typeof import("pixelmatch") }).default ??
	pixelmatchRaw;

const repositoryRoot = resolve(import.meta.dirname, "../..");
const baselineAcceptedDir = resolve(
	repositoryRoot,
	"tests/baseline/accepted/2026-07-16T11-10-09-563Z",
);
const browserBundlePath = resolve(
	repositoryRoot,
	"packages/browser/dist/index.global.js",
);
const pluginsBundlePath = resolve(
	repositoryRoot,
	"packages/plugins/dist/index.global.js",
);
const diffOutputDir = resolve(repositoryRoot, "output-samples/visual-diffs");

interface VisualFixtureConfig {
	readonly id: string;
	readonly htmlPath: string;
	readonly maxMismatchRatio: number;
}

const visualFixtures: readonly VisualFixtureConfig[] = [
	{
		id: "whitespaces/whitespaces",
		htmlPath: "tests/fixtures/whitespaces/whitespaces.html",
		maxMismatchRatio: 0.001, // 0.1% max difference
	},
	{
		id: "bleed/bleed",
		htmlPath: "tests/fixtures/bleed/bleed.html",
		maxMismatchRatio: 0.02, // 2% max difference
	},
	{
		id: "marks/marks",
		htmlPath: "tests/fixtures/marks/marks.html",
		maxMismatchRatio: 0.02, // 2% max difference
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
];

test.describe("Visual Output Comparison (Pixelmatch)", () => {
	test.beforeEach(async ({ page, browserName }) => {
		test.skip(
			browserName !== "chromium",
			"Visual baseline screenshots were recorded on Chromium; font rasterization varies on other browser engines",
		);
		test.skip(
			!existsSync(baselineAcceptedDir),
			"Accepted visual baseline directory not found on disk; skipping visual comparison",
		);

		await page.setViewportSize({ width: 1440, height: 1000 });
	});

	for (const fixture of visualFixtures) {
		test(`visual parity: ${fixture.id} matches baseline within ${(fixture.maxMismatchRatio * 100).toFixed(1)}% tolerance`, async ({
			page,
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
			const browserBundle = readFileSync(browserBundlePath, "utf-8");
			const pluginsBundle = readFileSync(pluginsBundlePath, "utf-8");
			const baselineBuffer = readFileSync(baselinePngPath);
			const baselineImg = PNG.sync.read(baselineBuffer);

			await page.setContent(
				'<!DOCTYPE html><html><head></head><body><div id="target"></div></body></html>',
			);
			await page.addScriptTag({ content: browserBundle });
			await page.addScriptTag({ content: pluginsBundle });

			await page.evaluate(async (html) => {
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
					pagedjsCompatible: true,
					plugins: standardPreset(),
				});

				await renderer.render({ content: { html } });
			}, fixtureHtml);

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
				const fixtureDiffDir = resolve(diffOutputDir, fixture.id);
				mkdirSync(fixtureDiffDir, { recursive: true });
				writeFileSync(resolve(fixtureDiffDir, "diff.png"), PNG.sync.write(diffImg));
				writeFileSync(resolve(fixtureDiffDir, "actual.png"), actualScreenshotBuffer);
			}

			expect(mismatchRatio).toBeLessThanOrEqual(fixture.maxMismatchRatio);
		});
	}
});
