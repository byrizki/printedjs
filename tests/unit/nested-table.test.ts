import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer";
import { describe, expect, test } from "vitest";
import { resolveChromeExecutable } from "../helpers/browser.js";

const executablePath = resolveChromeExecutable();

describe.runIf(Boolean(executablePath))("Nested table thead isolation", () => {
	test("does not leak nested table thead to outer table", async () => {
		const tempHtmlPath = resolve(__dirname, "../fixtures/temp-nested-table.html");

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page { size: A4; margin: 10mm; }
        table.outer { border: 1px solid black; width: 100%; }
        table.inner { border: 1px solid blue; }
        thead { background: yellow; }
    </style>
</head>
<body>
    <table class="outer">
        <tbody>
            <tr>
                <td>Outer Col 1</td>
                <td>
                    <table class="inner">
                        <thead>
                            <tr><th>Inner Header</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Inner Cell</td></tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
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
        });
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
				() => document.querySelectorAll(".printedjs_page").length > 0,
				{ timeout: 10000 },
			);

			const outerDirectTheadCount = await page.evaluate(() => {
				const outer = document.querySelector("table.outer");

				if (!outer) return -1;

				return Array.from(outer.children).filter((c) => c.tagName === "THEAD").length;
			});

			const innerDirectTheadCount = await page.evaluate(() => {
				const inner = document.querySelector("table.inner");

				if (!inner) return -1;

				return Array.from(inner.children).filter((c) => c.tagName === "THEAD").length;
			});

			expect(outerDirectTheadCount).toBe(0);
			expect(innerDirectTheadCount).toBe(1);
		} finally {
			await browser.close();

			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 20000);
});
