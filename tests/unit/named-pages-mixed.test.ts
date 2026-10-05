import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer";
import { describe, expect, test } from "vitest";
import { FIXTURE_CATALOG } from "../../apps/playground/src/fixtures/index.js";
import { compileTemplate } from "../../apps/playground/src/services/template-service.js";
import { resolveChromeExecutable } from "../helpers/browser.js";

const executablePath = resolveChromeExecutable();

describe.runIf(Boolean(executablePath))(
	"Mixed Orientations & Named Pages rendering",
	() => {
		test("renders Page 1 as Portrait and Page 2 as Landscape with correct dimensions", async () => {
			const fixture = FIXTURE_CATALOG.find((f) => f.id === "named-pages-mixed")!;
			const compiled = compileTemplate(fixture.html, fixture.data ?? {});
			expect(compiled.error).toBeNull();

			const tempHtmlPath = resolve(__dirname, "../fixtures/temp-named-pages.html");

			const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
</head>
<body>
    ${compiled.html}
    <script src="${resolve(__dirname, "../../packages/browser/dist/index.global.js")}"></script>
    <script src="${resolve(__dirname, "../../packages/plugins/core/preset/dist/index.global.js")}"></script>
    <script>
        window.addEventListener("DOMContentLoaded", async () => {
            const content = document.body.innerHTML;
            document.body.replaceChildren();
            const renderer = Printedjs.createRenderer({
                target: document.body,
                isolation: "root",
                plugins: PrintedjsPlugins.standardPreset(),
            });
            await renderer.render({ content: { html: content } });
            window.__printedjsReady = true;
        });
    </script>
</body>
</html>`;

			writeFileSync(tempHtmlPath, htmlContent, "utf-8");

			const browser = await puppeteer.launch({
				executablePath,
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});

			try {
				const page = await browser.newPage();
				await page.setViewport({ width: 1400, height: 1000 });
				await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });
				await page.waitForFunction(
					() =>
						(window as unknown as { __printedjsReady?: boolean }).__printedjsReady ===
						true,
					{
						timeout: 10000,
					},
				);

				const pageMetrics = await page.evaluate(() => {
					const pages = Array.from(
						document.querySelectorAll<HTMLElement>(".printedjs_page"),
					);

					return pages.map((p, idx) => ({
						pageIndex: idx + 1,
						dataPage: p.getAttribute("data-page"),
						className: p.className,
						offsetWidth: p.offsetWidth,
						offsetHeight: p.offsetHeight,
						pageboxWidth: (p.querySelector(".printedjs_pagebox") as HTMLElement | null)
							?.offsetWidth,
						pageboxHeight: (p.querySelector(".printedjs_pagebox") as HTMLElement | null)
							?.offsetHeight,
						headerText: (
							p.querySelector(".printedjs_margin-top-right") as HTMLElement | null
						)?.textContent?.trim(),
					}));
				});

				console.log("pageMetrics in Puppeteer:", JSON.stringify(pageMetrics, null, 2));

				expect(pageMetrics.length).toBeGreaterThanOrEqual(2);

				// Page 1 should be portrait (width < height)
				expect(pageMetrics[0]?.dataPage).toBeNull();
				expect(pageMetrics[0]?.offsetWidth).toBeLessThan(
					pageMetrics[0]?.offsetHeight ?? 0,
				);

				// Page 2 should be landscape (width > height) and have data-page="landscape-sheet"
				expect(pageMetrics[1]?.dataPage).toBe("landscape-sheet");
				expect(pageMetrics[1]?.offsetWidth).toBeGreaterThan(
					pageMetrics[1]?.offsetHeight ?? 0,
				);
				expect(pageMetrics[1]?.className).toContain("printedjs_landscape-sheet_page");
			} finally {
				await browser.close();

				if (existsSync(tempHtmlPath)) {
					unlinkSync(tempHtmlPath);
				}
			}
		}, 25000);
	},
);
