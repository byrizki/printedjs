import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const browserBundlePath = resolve(
	import.meta.dirname,
	"../../packages/browser/dist/index.global.js",
);

test.describe("browser API and render surfaces", () => {
	test.beforeEach(async ({ page }) => {
		await page.setContent("<!DOCTYPE html><html><head></head><body></body></html>");
		await page.addScriptTag({ path: browserBundlePath });
	});

	test("destroys iframe-owned output without host residue", async ({ page }) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="host-content">preserved</div><iframe id="book"></iframe></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });

		const result = await page.evaluate(async () => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const iframe = document.querySelector<HTMLIFrameElement>("#book")!;
			const renderer = createRenderer({
				target: iframe,
				isolation: "iframe",
			});

			await renderer.render({ content: { html: "<p>chapter</p>" } });

			const hasRootBefore =
				iframe.contentDocument?.querySelector("[data-printedjs-root]") !== null;
			renderer.destroy();
			const hasRootAfter =
				document.querySelector("[data-printedjs-root]") === null &&
				iframe.contentDocument?.querySelector("[data-printedjs-root]") === null;
			const hostPreserved =
				document.querySelector("#host-content")?.textContent === "preserved";

			return { hasRootBefore, hasRootAfter, hostPreserved };
		});

		expect(result.hasRootBefore).toBe(true);
		expect(result.hasRootAfter).toBe(true);
		expect(result.hostPreserved).toBe(true);
	});

	test("renders into root surface and cleans up without host residue", async ({
		page,
	}) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="other">preserved</div><div id="container"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });

		const result = await page.evaluate(async () => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const container = document.querySelector<HTMLElement>("#container")!;
			const renderer = createRenderer({
				target: container,
				isolation: "root",
			});

			await renderer.render({
				content: { html: "<h1>Title</h1>" },
				stylesheets: [{ type: "inline", content: "h1 { color: blue; }" }],
			});

			const hasRootBefore = container.querySelector("[data-printedjs-root]") !== null;
			const hasStylesBefore =
				document.querySelectorAll("style[data-printedjs-style]").length > 0;

			renderer.destroy();

			const hasRootAfter = container.querySelector("[data-printedjs-root]") === null;
			const hasStylesAfter =
				document.querySelectorAll("style[data-printedjs-style]").length === 0;
			const otherPreserved =
				document.querySelector("#other")?.textContent === "preserved";

			return {
				hasRootBefore,
				hasStylesBefore,
				hasRootAfter,
				hasStylesAfter,
				otherPreserved,
			};
		});

		expect(result.hasRootBefore).toBe(true);
		expect(result.hasStylesBefore).toBe(true);
		expect(result.hasRootAfter).toBe(true);
		expect(result.hasStylesAfter).toBe(true);
		expect(result.otherPreserved).toBe(true);
	});

	test("rejects overlapping render calls on the same renderer", async ({ page }) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="container"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });

		const error = await page.evaluate(async () => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const container = document.querySelector<HTMLElement>("#container")!;
			const renderer = createRenderer({ target: container });

			const first = renderer.render({ content: { html: "<p>one</p>" } });
			let secondError = "";
			try {
				await renderer.render({ content: { html: "<p>two</p>" } });
			} catch (err) {
				secondError = err instanceof Error ? err.message : String(err);
			}
			await first;
			renderer.destroy();
			return secondError;
		});

		expect(error).toContain("Render call already active");
	});

	test("rejects render call after renderer is destroyed", async ({ page }) => {
		await page.setContent(
			'<!DOCTYPE html><html><head></head><body><div id="container"></div></body></html>',
		);
		await page.addScriptTag({ path: browserBundlePath });

		const error = await page.evaluate(async () => {
			const { createRenderer } = (
				window as unknown as { Printedjs: typeof import("@printedjs/browser") }
			).Printedjs;
			const container = document.querySelector<HTMLElement>("#container")!;
			const renderer = createRenderer({ target: container });
			renderer.destroy();

			try {
				await renderer.render({ content: { html: "<p>after destroy</p>" } });
				return "";
			} catch (err) {
				return err instanceof Error ? err.message : String(err);
			}
		});

		expect(error).toContain("Renderer has been destroyed");
	});
});
