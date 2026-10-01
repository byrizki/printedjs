import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer";
import { describe, expect, test } from "vitest";
import { resolveChromeExecutable } from "../helpers/browser.js";

const executablePath = resolveChromeExecutable();

describe.runIf(Boolean(executablePath))("Table rowspan continuation across pages", () => {
	test("spans rowspan across page boundaries by inserting continuation cell on next page", async () => {
		const tempHtmlPath = resolve(
			__dirname,
			"../fixtures/temp-table-rowspan-continuation.html",
		);

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page { size: A5; margin: 15mm; }
        body { font-family: sans-serif; font-size: 13px; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #333; padding: 6px; }
        .zcell { background-color: rgb(220, 240, 255); width: 120px; font-weight: bold; }
        .desc-cell { height: 220px; vertical-align: top; }
    </style>
</head>
<body>
    <table>
        <thead>
            <tr>
                <td colspan="2">Jenis Manfaat</td>
                <td>Deskripsi</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td rowspan="6" class="zcell">Comprehensive Multi-Year Protection Package</td>
                <td style="width: 120px;">1. Manfaat Meninggal Penyakit</td>
                <td class="desc-cell">Deskripsi Manfaat 1</td>
            </tr>
            <tr>
                <td style="width: 120px;">2. Manfaat Meninggal Kecelakaan</td>
                <td class="desc-cell">Deskripsi Manfaat 2</td>
            </tr>
            <tr>
                <td style="width: 120px;">3. Manfaat Tahunan</td>
                <td class="desc-cell">Deskripsi Manfaat 3</td>
            </tr>
            <tr>
                <td style="width: 120px;">4. Manfaat Tahapan</td>
                <td class="desc-cell">Deskripsi Manfaat 4</td>
            </tr>
            <tr>
                <td style="width: 120px;">5. Manfaat Pembebasan Premi</td>
                <td class="desc-cell">Deskripsi Manfaat 5</td>
            </tr>
            <tr>
                <td style="width: 120px;">6. Manfaat Penebusan Polis</td>
                <td class="desc-cell">Deskripsi Manfaat 6</td>
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

		const browser = await puppeteer.launch({
			headless: true,
			...(executablePath ? { executablePath } : {}),
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});

		try {
			const page = await browser.newPage();
			page.on("pageerror", (err) => console.error("PAGE ERROR 1:", err));
			page.on("console", (msg) => console.log("PAGE LOG 1:", msg.text()));
			await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });

			await page.waitForFunction(
				() => document.querySelectorAll(".printedjs_page").length >= 2,
				{ timeout: 10000 },
			);

			const pageCount = await page.evaluate(
				() => document.querySelectorAll(".printedjs_page").length,
			);
			expect(pageCount).toBe(2);

			// Page 1: first row has the original zcell, clamped to 3 rows
			const page1ZCell = await page.evaluate(() => {
				const p1 = document.querySelectorAll(".printedjs_page")[0];
				const firstRow = p1?.querySelector("tbody tr");
				const cell = firstRow?.children[0] as HTMLElement | undefined;
				return {
					tagName: cell?.tagName,
					rowspan: cell?.getAttribute("rowspan"),
					className: cell?.className,
					hasContinuationClass: cell?.classList.contains(
						"printedjs-rowspan-continuation",
					),
					text: cell?.textContent?.trim(),
				};
			});
			expect(page1ZCell.tagName).toBe("TD");
			expect(page1ZCell.rowspan).toBe("3");
			expect(page1ZCell.className).toContain("zcell");
			expect(page1ZCell.hasContinuationClass).toBe(false);
			expect(page1ZCell.text).toBe("Comprehensive Multi-Year Protection Package");

			// Page 2: first row must have 3 cells: continuation zcell (col 0), benefit 4 (col 1), desc 4 (col 2)
			const page2FirstRowDetails = await page.evaluate(() => {
				const p2 = document.querySelectorAll(".printedjs_page")[1];
				const firstRow = p2?.querySelector("tbody tr");
				const cells = Array.from(firstRow?.children ?? []) as HTMLElement[];
				const continuationCell = cells[0];
				return {
					cellCount: cells.length,
					continuation: {
						tagName: continuationCell?.tagName,
						rowspan: continuationCell?.getAttribute("rowspan"),
						className: continuationCell?.className,
						hasContinuationClass: continuationCell?.classList.contains(
							"printedjs-rowspan-continuation",
						),
						hasSplitFrom: continuationCell?.hasAttribute("data-split-from"),
						innerHTML: continuationCell?.innerHTML,
					},
					benefitCellText: cells[1]?.textContent?.trim(),
					descCellText: cells[2]?.textContent?.trim(),
				};
			});

			expect(page2FirstRowDetails.cellCount).toBe(3);
			expect(page2FirstRowDetails.continuation.tagName).toBe("TD");
			expect(page2FirstRowDetails.continuation.rowspan).toBe("3");
			expect(page2FirstRowDetails.continuation.className).toContain("zcell");
			expect(page2FirstRowDetails.continuation.hasContinuationClass).toBe(true);
			expect(page2FirstRowDetails.continuation.hasSplitFrom).toBe(true);
			expect(page2FirstRowDetails.continuation.innerHTML).toBe("&nbsp;");

			// Column alignment verification:
			expect(page2FirstRowDetails.benefitCellText).toBe("4. Manfaat Tahapan");
			expect(page2FirstRowDetails.descCellText).toBe("Deskripsi Manfaat 4");

			// Page 2: rows 2 and 3 should have 2 cells each (covered by the continuation rowspan)
			const page2OtherRows = await page.evaluate(() => {
				const p2 = document.querySelectorAll(".printedjs_page")[1];
				const rows = Array.from(p2?.querySelectorAll("tbody tr") ?? []);
				return rows.slice(1).map((r) => ({
					cellCount: r.children.length,
					firstCellText: r.children[0]?.textContent?.trim(),
				}));
			});

			expect(page2OtherRows).toEqual([
				{ cellCount: 2, firstCellText: "5. Manfaat Pembebasan Premi" },
				{ cellCount: 2, firstCellText: "6. Manfaat Penebusan Polis" },
			]);
		} finally {
			await browser.close();
			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 25000);

	test("repeats content in continuation cell when data-repeat-content='true'", async () => {
		const tempHtmlPath = resolve(
			__dirname,
			"../fixtures/temp-table-rowspan-repeat-content.html",
		);

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page { size: A5; margin: 15mm; }
        body { font-family: sans-serif; font-size: 13px; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        td { border: 1px solid #333; padding: 6px; }
        .desc-cell { height: 250px; vertical-align: top; }
    </style>
</head>
<body>
    <table>
        <tbody>
            <tr>
                <td rowspan="4" data-repeat-content="true" class="spanned-header">Repeated Label</td>
                <td>Row 1</td>
                <td class="desc-cell">Content 1</td>
            </tr>
            <tr>
                <td>Row 2</td>
                <td class="desc-cell">Content 2</td>
            </tr>
            <tr>
                <td>Row 3</td>
                <td class="desc-cell">Content 3</td>
            </tr>
            <tr>
                <td>Row 4</td>
                <td class="desc-cell">Content 4</td>
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

		const browser = await puppeteer.launch({
			headless: true,
			...(executablePath ? { executablePath } : {}),
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});

		try {
			const page = await browser.newPage();
			page.on("pageerror", (err) => console.error("PAGE ERROR 2:", err));
			page.on("console", (msg) => console.log("PAGE LOG 2:", msg.text()));
			await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });

			await page.waitForFunction(
				() => document.querySelectorAll(".printedjs_page").length >= 2,
				{ timeout: 10000 },
			);

			const continuationContent = await page.evaluate(() => {
				const p2 = document.querySelectorAll(".printedjs_page")[1];
				const contCell = p2?.querySelector(".printedjs-rowspan-continuation");
				return contCell?.textContent?.trim();
			});

			expect(continuationContent).toBe("Repeated Label");
		} finally {
			await browser.close();
			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 25000);

	test("does not continue or replicate rowspans across pages by default on standard tables", async () => {
		const tempHtmlPath = resolve(
			__dirname,
			"../fixtures/temp-table-rowspan-default-no-repeat.html",
		);

		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page { size: A5; margin: 15mm; }
        body { font-family: sans-serif; font-size: 13px; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        td { border: 1px solid #333; padding: 6px; }
        .tall-row { height: 250px; }
    </style>
</head>
<body>
    <table>
        <tbody>
            <tr>
                <td rowspan="4">Standard Unrepeated Rowspan</td>
                <td>Item A1</td>
                <td class="tall-row">Content 1</td>
            </tr>
            <tr>
                <td>Item A2</td>
                <td class="tall-row">Content 2</td>
            </tr>
            <tr>
                <td>Item A3</td>
                <td class="tall-row">Content 3</td>
            </tr>
            <tr>
                <td>Item A4</td>
                <td class="tall-row">Content 4</td>
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

			const continuationCount = await page.evaluate(() => {
				return document.querySelectorAll(".printedjs-rowspan-continuation").length;
			});

			expect(continuationCount).toBe(0);
		} finally {
			await browser.close();
			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 25000);
});
