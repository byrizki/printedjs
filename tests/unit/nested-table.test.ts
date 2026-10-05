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

	test("splits nested table rows across page boundaries without overflowing or leaving orphan headers", async () => {
		const tempHtmlPath = resolve(__dirname, "../fixtures/temp-nested-table-split.html");

		const rowsHtml = Array.from(
			{ length: 25 },
			(_, i) => `<tr><td>Component ${i + 1}</td><td>Value ${i + 1}</td></tr>`,
		).join("");

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: sans-serif; font-size: 10pt; }
        table.outer { border-collapse: collapse; width: 100%; border: 1px solid #333; }
        table.outer > thead th { background: #222; color: #fff; padding: 8px; }
        table.outer > tbody > tr > td { padding: 10px; border: 1px solid #ccc; vertical-align: top; }
        table.inner { border-collapse: collapse; width: 100%; border: 1px solid #00f; }
        table.inner thead th { background: #00f; color: #fff; padding: 6px; }
        table.inner td { padding: 8px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <p>Introductory paragraph before the table hierarchy.</p>
    <table class="outer" data-repeat="true">
        <thead>
            <tr>
                <th style="width: 30%">Section</th>
                <th style="width: 70%">Nested Specifications</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Category Alpha</td>
                <td>
                    <table class="inner">
                        <thead>
                            <tr>
                                <th>Param</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
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

			const result = await page.evaluate(() => {
				const pages = Array.from(document.querySelectorAll(".printedjs_page"));

				const page1 = pages[0];
				const page2 = pages[1];

				const page1InnerRows = page1
					? page1.querySelectorAll("table.inner tbody tr").length
					: 0;

				const page2InnerRows = page2
					? page2.querySelectorAll("table.inner tbody tr").length
					: 0;

				const page2OuterThead = page2
					? page2.querySelectorAll("table.outer > thead").length
					: 0;

				const page2InnerThead = page2
					? page2.querySelectorAll("table.inner thead").length
					: 0;

				return {
					pageCount: pages.length,
					page1InnerRows,
					page2InnerRows,
					page2OuterThead,
					page2InnerThead,
				};
			});

			expect(result.pageCount).toBeGreaterThanOrEqual(2);
			expect(result.page1InnerRows).toBeGreaterThan(0);
			expect(result.page2InnerRows).toBeGreaterThan(0);
			expect(result.page1InnerRows + result.page2InnerRows).toBe(25);
			expect(result.page2OuterThead).toBe(1);
			expect(result.page2InnerThead).toBe(0);
		} finally {
			await browser.close();

			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 20000);

	test("repeats nested table thead when configured with data-repeat='true' on the nested table", async () => {
		const tempHtmlPath = resolve(__dirname, "../fixtures/temp-nested-table-repeat.html");

		const rowsHtml = Array.from(
			{ length: 25 },
			(_, i) => `<tr><td>Component ${i + 1}</td><td>Value ${i + 1}</td></tr>`,
		).join("");

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: sans-serif; font-size: 10pt; }
        table.outer { border-collapse: collapse; width: 100%; border: 1px solid #333; }
        table.outer > thead th { background: #222; color: #fff; padding: 8px; }
        table.outer > tbody > tr > td { padding: 10px; border: 1px solid #ccc; vertical-align: top; }
        table.inner { border-collapse: collapse; width: 100%; border: 1px solid #00f; }
        table.inner thead th { background: #00f; color: #fff; padding: 6px; }
        table.inner td { padding: 8px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <table class="outer" data-repeat="true">
        <thead>
            <tr>
                <th style="width: 30%">Section</th>
                <th style="width: 70%">Nested Specifications</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Category Alpha</td>
                <td>
                    <table class="inner" data-repeat="true">
                        <thead>
                            <tr>
                                <th>Param</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
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

			const result = await page.evaluate(() => {
				const pages = Array.from(document.querySelectorAll(".printedjs_page"));
				const page2 = pages[1];

				const page2InnerThead = page2
					? page2.querySelectorAll("table.inner thead").length
					: 0;

				return {
					pageCount: pages.length,
					page2InnerThead,
				};
			});

			expect(result.pageCount).toBeGreaterThanOrEqual(2);
			expect(result.page2InnerThead).toBe(1);
		} finally {
			await browser.close();

			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 20000);

	test("splits deep nested table (Level 3 hierarchy) across page boundaries", async () => {
		const tempHtmlPath = resolve(
			__dirname,
			"../fixtures/temp-deep-nested-table-split.html",
		);

		const deepRowsHtml = Array.from(
			{ length: 40 },
			(_, i) => `<tr><td>Sub-Tier ${i + 1}</td><td>Metric ${i + 1}</td></tr>`,
		).join("");

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: sans-serif; font-size: 10pt; }
        table.outer { border-collapse: collapse; width: 100%; border: 1px solid #333; }
        table.inner { border-collapse: collapse; width: 100%; border: 1px solid #00f; }
        table.deep { border-collapse: collapse; width: 100%; border: 1px solid #080; }
        th, td { padding: 10px; border: 1px solid #ccc; }
    </style>
</head>
<body>
    <table class="outer">
        <thead><tr><th>Outer Col 1</th><th>Outer Col 2</th></tr></thead>
        <tbody>
            <tr>
                <td>Parent Section</td>
                <td>
                    <table class="inner">
                        <thead><tr><th>Component</th><th>Deep Specs</th></tr></thead>
                        <tbody>
                            <tr>
                                <td>Deep Subsystem</td>
                                <td>
                                    <table class="deep" data-repeat="true">
                                        <thead><tr><th>Sub-Tier</th><th>Metric</th></tr></thead>
                                        <tbody>
                                            ${deepRowsHtml}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
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

			const result = await page.evaluate(() => {
				const pages = Array.from(document.querySelectorAll(".printedjs_page"));
				const p1 = pages[0];
				const p2 = pages[1];

				const p1DeepRows = p1 ? p1.querySelectorAll("table.deep tbody tr").length : 0;
				const p2DeepRows = p2 ? p2.querySelectorAll("table.deep tbody tr").length : 0;
				const p2DeepThead = p2 ? p2.querySelectorAll("table.deep thead").length : 0;

				const totalDeepRows = pages.reduce(
					(sum, p) => sum + p.querySelectorAll("table.deep tbody tr").length,
					0,
				);

				return {
					pageCount: pages.length,
					p1DeepRows,
					p2DeepRows,
					p2DeepThead,
					totalDeepRows,
				};
			});

			expect(result.pageCount).toBeGreaterThanOrEqual(2);
			expect(result.p1DeepRows).toBeGreaterThan(0);
			expect(result.p2DeepRows).toBeGreaterThan(0);
			expect(result.totalDeepRows).toBe(40);
			expect(result.p2DeepThead).toBe(1);
		} finally {
			await browser.close();

			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 20000);
});
