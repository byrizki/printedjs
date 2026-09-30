import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer";
import { describe, expect, test } from "vitest";
import { resolveChromeExecutable } from "../helpers/browser.js";

const executablePath = resolveChromeExecutable();

describe.runIf(Boolean(executablePath))("Table header repeat control", () => {
	test("does not repeat thead or tfoot by default on standard tables", async () => {
		const tempHtmlPath = resolve(
			__dirname,
			"../fixtures/temp-table-default-no-repeat.html",
		);

		const rows = Array.from({ length: 40 })
			.map(
				(_, i) =>
					`<tr><td style="padding: 18px; border: 1px solid #ccc;">Row ${i + 1}</td></tr>`,
			)
			.join("\n");

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page { size: A5; margin: 15mm; }
        body { font-family: sans-serif; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #eee; padding: 12px; border: 1px solid #999; }
    </style>
</head>
<body>
    <table>
        <thead>
            <tr><th>Standard Table Header</th></tr>
        </thead>
        <tfoot>
            <tr><td>Standard Table Footer</td></tr>
        </tfoot>
        <tbody>
            ${rows}
        </tbody>
    </table>
    <script src="${resolve(__dirname, "../../packages/browser/dist/index.global.js")}"></script>
    <script src="${resolve(__dirname, "../../packages/plugins/dist/index.global.js")}"></script>
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

		const browser = await puppeteer.launch({
			headless: true,
			...(executablePath ? { executablePath } : {}),
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});

		try {
			const page = await browser.newPage();
			await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });

			await page.waitForFunction(
				() => document.querySelectorAll(".printedjs_page").length >= 2,
				{ timeout: 10000 },
			);

			const theadOnPage1 = await page.evaluate(() => {
				const page1 = document.querySelectorAll(".printedjs_page")[0];
				return page1 ? page1.querySelectorAll("thead").length : 0;
			});
			const theadOnPage2 = await page.evaluate(() => {
				const page2 = document.querySelectorAll(".printedjs_page")[1];
				return page2 ? page2.querySelectorAll("thead").length : 0;
			});
			expect(theadOnPage1).toBe(1);
			expect(theadOnPage2).toBe(0);

			const tfootOnPage1 = await page.evaluate(() => {
				const page1 = document.querySelectorAll(".printedjs_page")[0];
				return page1 ? page1.querySelectorAll("tfoot").length : 0;
			});
			expect(tfootOnPage1).toBe(0);
		} finally {
			await browser.close();
			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 20000);

	test("repeats thead on subsequent pages when special classname repeat-header is added", async () => {
		const tempHtmlPath = resolve(__dirname, "../fixtures/temp-table-repeat-class.html");

		const rows = Array.from({ length: 40 })
			.map(
				(_, i) =>
					`<tr><td style="padding: 18px; border: 1px solid #ccc;">Row ${i + 1}</td></tr>`,
			)
			.join("\n");

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page { size: A5; margin: 15mm; }
        body { font-family: sans-serif; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #eee; padding: 12px; border: 1px solid #999; }
    </style>
</head>
<body>
    <table class="repeat-header">
        <thead>
            <tr><th>Repeating Header via repeat-header class</th></tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    <script src="${resolve(__dirname, "../../packages/browser/dist/index.global.js")}"></script>
    <script src="${resolve(__dirname, "../../packages/plugins/dist/index.global.js")}"></script>
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

		const browser = await puppeteer.launch({
			headless: true,
			...(executablePath ? { executablePath } : {}),
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});

		try {
			const page = await browser.newPage();
			await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });

			await page.waitForFunction(
				() => document.querySelectorAll(".printedjs_page").length >= 2,
				{ timeout: 10000 },
			);

			const theadOnPage1 = await page.evaluate(() => {
				const page1 = document.querySelectorAll(".printedjs_page")[0];
				return page1 ? page1.querySelectorAll("thead").length : 0;
			});
			const theadOnPage2 = await page.evaluate(() => {
				const page2 = document.querySelectorAll(".printedjs_page")[1];
				return page2 ? page2.querySelectorAll("thead").length : 0;
			});
			expect(theadOnPage1).toBe(1);
			expect(theadOnPage2).toBe(1);
		} finally {
			await browser.close();
			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 20000);
});
