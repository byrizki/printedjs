import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));

const repoRoot = resolve(__dirname, "..");

import { legacyFixtureManifest } from "../tests/fixtures/manifest.ts";
import {
	setupPrintedjsPage,
	visualNormalizationStyle,
} from "../tests/helpers/browser-render.ts";

const args = process.argv.slice(2);

const promoteFlag = args.includes("--promote");

const filterArg = args.find((a) => a.startsWith("--filter="))?.split("=")[1];

const outDirArg = args.find((a) => a.startsWith("--outDir="))?.split("=")[1];

const targetArg = args.find((a) => a.startsWith("--target="))?.split("=")[1];

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

// Determine output directory: default to tests/fixtures/baselines unless explicitly directed elsewhere
let outputDir: string;

if (outDirArg) {
	outputDir = resolve(repoRoot, outDirArg);
} else if (targetArg === "printedjs-accepted" || promoteFlag) {
	const outDirName = promoteFlag ? "latest" : timestamp;
	outputDir = resolve(repoRoot, "tests/baseline/printedjs-accepted", outDirName);
} else {
	outputDir = resolve(repoRoot, "tests/fixtures/baselines");
}

mkdirSync(outputDir, { recursive: true });

function computeSha256(buffer: Buffer): string {
	return createHash("sha256").update(buffer).digest("hex");
}

export const VISUAL_FIXTURE_IDS = [
	"whitespaces/whitespaces",
	"whitespaces/break-elements/break-elements",
	"bleed/bleed",
	"marks/marks",
	"position-fixed/position-fixed",
	"default/default",
	"splits/tables/long-table",
	"splits/tables/rowspan-table",
	"string/string-default",
	"infinite-loop/infinite-loop",
	"margin-boxes/style/style",
	"margin-boxes/text-align/text-align",
	"margin-boxes/vertical-align/vertical-align",
	"page-rules/size/page-size/page-size",
	"page-rules/size/landscape/landscape",
	"breaks/empty-page-detection/empty-page-detection",
	"breaks/fractional-pixels/fractional-pixels",
	"breaks/child-parent-propagation/break-before-child-parent-propagation",
	"counters/nested/nested",
	"styles/simple",
	"named-page/no-forced-page-break/ignore-undisplayed-nodes",
	"filters/script-elements/script-elements",
	"breaks/child-parent-propagation/break-after-child-parent-propagation",
	"breaks/child-parent-propagation/break-before-container-propagation",
	"page-rules/size/margin/margin-0",
	"page-rules/size/padding/padding-0",
	"counters/counter-page-reset/counter-page-reset-scope",
	"named-page/no-forced-page-break/fold-page-breaks-after",
	"named-page/no-forced-page-break/fold-page-breaks-before",
	"named-page/no-forced-page-break/no-forced-page-break",
	// Intentional spec improvements and fixed Paged.js bugs:
	"tables/rebuild/rebuild",
	"named-page/page-group/page-group",
	"notes/footnotes-lastpage/footnotes-lastpage",
	"filters/undisplayed/undisplayed",
	"breaks/break-after/break-after-recto/break-after-recto",
	"breaks/break-after/break-after-right/break-after-right",
	"breaks/break-after/break-after-left/break-after-left",
	"breaks/break-after/break-after-verso/break-after-verso",
] as const;

export interface CaptureFixtureItem {
	id: string;
	copiedInputHtmlPath: string;
	viewMode?: "spread" | "standard";
}

export const FEATURE_VISUAL_FIXTURES: readonly CaptureFixtureItem[] = [
	{
		id: "counters/custom-counters/custom-counters",
		copiedInputHtmlPath: "tests/fixtures/counters/custom-counters/custom-counters.html",
	},
	{
		id: "views/spread-view/spread-view",
		copiedInputHtmlPath: "tests/fixtures/views/spread-view/spread-view.html",
		viewMode: "spread",
	},
	{
		id: "page-rules/mirrored-margins/mirrored-margins",
		copiedInputHtmlPath:
			"tests/fixtures/page-rules/mirrored-margins/mirrored-margins.html",
	},
];

async function run() {
	console.log(`Starting Printedjs baseline capture into: ${outputDir}`);
	const browser = await chromium.launch();

	const page = await browser.newPage({
		viewport: { width: 1440, height: 1000 },
		deviceScaleFactor: 1,
	});

	const fixturesArg = args.find((a) => a.startsWith("--fixtures="))?.split("=")[1];

	let targetFixtures: CaptureFixtureItem[];

	if (fixturesArg === "visual" || (!filterArg && !args.includes("--all"))) {
		targetFixtures = [
			...legacyFixtureManifest.filter((f) =>
				(VISUAL_FIXTURE_IDS as readonly string[]).includes(f.id),
			),
			...FEATURE_VISUAL_FIXTURES,
		];
	} else if (filterArg) {
		const all = [...legacyFixtureManifest, ...FEATURE_VISUAL_FIXTURES];
		targetFixtures = all.filter((f) => f.id.includes(filterArg));
	} else {
		targetFixtures = [...legacyFixtureManifest, ...FEATURE_VISUAL_FIXTURES];
	}

	console.log(`Found ${targetFixtures.length} fixtures to capture.`);

	const outcomes = [];

	for (let i = 0; i < targetFixtures.length; i++) {
		const fixture = targetFixtures[i];
		const htmlPath = resolve(repoRoot, fixture.copiedInputHtmlPath);

		if (!existsSync(htmlPath)) {
			console.warn(`[SKIP] Missing fixture HTML: ${fixture.id}`);
			continue;
		}

		const fixtureHtml = readFileSync(htmlPath, "utf8");
		const fixtureDir = resolve(outputDir, fixture.id);
		mkdirSync(fixtureDir, { recursive: true });

		const isSpread = fixture.viewMode === "spread";
		await setupPrintedjsPage(
			page,
			'<div id="target"></div>',
			visualNormalizationStyle,
			isSpread,
		);

		try {
			const renderResult = await page.evaluate(
				async ({ html, isSpread }) => {
					const { createRenderer } = (
						window as unknown as { Printedjs: typeof import("@printedjs/browser") }
					).Printedjs;

					const { standardPreset } = (
						window as unknown as {
							PrintedjsPlugins: typeof import("@printedjs/plugins");
						}
					).PrintedjsPlugins;

					const views = (
						window as unknown as {
							PrintedjsViews?: typeof import("@printedjs/plugin-views");
						}
					).PrintedjsViews;

					const target = document.querySelector("#target")!;

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

					const res = await renderer.render({
						content: { html },
						limits: { maxPages: 50 },
					});

					const pageElements = Array.from(
						target.querySelectorAll(".pagedjs_page, .printedjs_page"),
					);

					const pages = pageElements.map((p, idx) => {
						const rect = p.getBoundingClientRect();

						return {
							pageNumber: idx + 1,
							width: rect.width,
							height: rect.height,
							classes: Array.from(p.classList),
						};
					});

					return {
						pageCount: res.pages.length,
						domCount: pageElements.length,
						pages,
					};
				},
				{ html: fixtureHtml, isSpread },
			);

			const docScreenshot = await page.screenshot({
				fullPage: true,
				animations: "disabled",
			});

			const docSha256 = computeSha256(docScreenshot);
			writeFileSync(resolve(fixtureDir, "document.png"), docScreenshot);

			const captureMeta = {
				fixtureId: fixture.id,
				capturedAt: new Date().toISOString(),
				pageCount: renderResult.domCount,
				pages: renderResult.pages,
				documentPngSha256: docSha256,
			};

			const captureJson = JSON.stringify(captureMeta, null, 2);
			writeFileSync(resolve(fixtureDir, "capture.json"), captureJson);

			outcomes.push({
				fixtureId: fixture.id,
				outcome: "passed",
				pageCount: renderResult.domCount,
				documentPngSha256: docSha256,
			});

			process.stdout.write(
				`\rCaptured [${i + 1}/${targetFixtures.length}] ${fixture.id} (${renderResult.domCount} pages)`,
			);
		} catch (err) {
			console.error(`\n[FAIL] Fixture ${fixture.id}:`, err.message);
			outcomes.push({
				fixtureId: fixture.id,
				outcome: "failed",
				error: err.message,
			});
		}
	}

	await browser.close();
	console.log("\nCapture run complete!");

	const manifest = {
		harnessVersion: "printedjs-native-capture/v1",
		createdAt: new Date().toISOString(),
		totalFixtures: targetFixtures.length,
		passed: outcomes.filter((o) => o.outcome === "passed").length,
		failed: outcomes.filter((o) => o.outcome === "failed").length,
		fixtures: outcomes,
	};

	writeFileSync(resolve(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
	console.log(`Manifest written to: ${resolve(outputDir, "manifest.json")}`);
}

const isMain =
	import.meta.url === `file://${process.argv[1]}` ||
	Boolean(process.argv[1]?.endsWith("capture-printedjs-baselines.ts"));

if (isMain) {
	run().catch((err: unknown) => {
		console.error(err);
		process.exit(1);
	});
}
