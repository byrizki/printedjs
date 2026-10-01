import { resolve } from "node:path";
import type { Page } from "@playwright/test";

export const browserBundlePath = resolve(
	import.meta.dirname,
	"../../packages/browser/dist/index.global.js",
);

export const pluginsBundlePath = resolve(
	import.meta.dirname,
	"../../packages/plugins/core/preset/dist/index.global.js",
);

export const viewsBundlePath = resolve(
	import.meta.dirname,
	"../../packages/plugins/core/views/dist/index.global.js",
);

export interface RenderFixtureOptions {
	targetSelector?: string;
	isolation?: "root" | "iframe";
	limits?: { maxPages?: number };
}

export interface RenderFixtureResult {
	resultPageCount: number;
	domPageCount: number;
	firstPageWidth: number | null;
	firstPageHeight: number | null;
}

export const visualNormalizationStyle = `
	body, p, section, article {
		font-family: "Liberation Serif", serif;
		line-height: 1.125;
	}
	h1, h2, h3, h4, h5, h6 {
		font-family: "Liberation Serif", serif;
		line-height: 1.15;
	}
`;

/**
 * Initializes a page with standard test target DOM and loads the Printedjs bundles.
 */
export async function setupPrintedjsPage(
	page: Page,
	bodyHtml = '<div id="target"></div>',
	styleCss?: string,
	includeViews = false,
): Promise<void> {
	await page.setContent(
		`<!DOCTYPE html><html><head>${styleCss ? `<style>${styleCss}</style>` : ""}</head><body>${bodyHtml}</body></html>`,
	);
	await page.addScriptTag({ path: browserBundlePath });
	await page.addScriptTag({ path: pluginsBundlePath });
	if (includeViews) {
		await page.addScriptTag({ path: viewsBundlePath });
	}
}

/**
 * Renders an HTML fixture with the standard preset and returns page measurements.
 */
export async function renderFixture(
	page: Page,
	html: string,
	options: RenderFixtureOptions = {},
): Promise<RenderFixtureResult> {
	await setupPrintedjsPage(page);

	return await page.evaluate(
		async ({ fixtureHtml, targetSelector, isolation, limits }) => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const { standardPreset } = (
				window as unknown as {
					PrintedjsPlugins: typeof import("@printedjs/plugin-preset");
				}
			).PrintedjsPlugins;

			const target = document.querySelector<HTMLElement>(targetSelector ?? "#target")!;
			const renderer = createRenderer({
				target,
				isolation: isolation ?? "root",
				plugins: standardPreset(),
			});

			const renderResult = await renderer.render({
				content: { html: fixtureHtml },
				...(limits ? { limits } : {}),
			});

			const renderedPages = target.querySelectorAll<HTMLElement>(
				".printedjs_page, .pagedjs_page",
			);
			const firstPage = renderedPages[0];
			const rect = firstPage ? firstPage.getBoundingClientRect() : null;

			return {
				resultPageCount: renderResult.pages.length,
				domPageCount: renderedPages.length,
				firstPageWidth: rect ? Math.round(rect.width) : null,
				firstPageHeight: rect ? Math.round(rect.height) : null,
			};
		},
		{
			fixtureHtml: html,
			targetSelector: options.targetSelector,
			isolation: options.isolation,
			limits: options.limits,
		},
	);
}
