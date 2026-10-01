import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer";
import { describe, expect, test } from "vitest";
import { COMPLEX_MATRIX_FIXTURE } from "../../apps/playground/src/fixtures/complex-matrix-fixture.js";
import { compileTemplate } from "../../apps/playground/src/services/template-service.js";
import { resolveChromeExecutable } from "../helpers/browser.js";

const executablePath = resolveChromeExecutable();

describe.runIf(Boolean(executablePath))("Complex Matrix table rendering", () => {
	test("renders multi-page complex matrix table", async () => {
		const tempHtmlPath = resolve(__dirname, "../fixtures/temp-complex-matrix.html");
		const compiled = compileTemplate(
			COMPLEX_MATRIX_FIXTURE.html,
			COMPLEX_MATRIX_FIXTURE.data ?? {},
		);
		expect(compiled.error).toBeNull();

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

			const pageCount = await page.evaluate(
				() => document.querySelectorAll(".printedjs_page").length,
			);
			expect(pageCount).toBeGreaterThanOrEqual(2);

			// 1. Verify non-repeating table header: exactly 1 thead across all pages, located on page 1
			const theadCountOnPage1 = await page.evaluate(() => {
				const p1 = document.querySelectorAll(".printedjs_page")[0];
				return p1 ? p1.querySelectorAll("thead").length : 0;
			});
			const theadCountOnPage2 = await page.evaluate(() => {
				const p2 = document.querySelectorAll(".printedjs_page")[1];
				return p2 ? p2.querySelectorAll("thead").length : 0;
			});
			expect(theadCountOnPage1).toBe(1);
			expect(theadCountOnPage2).toBe(0);

			// 2. Verify non-repeating table footer: tfoot displays once on final page only, never repeated on intermediate split pages
			const tfootCounts = await page.evaluate(() => {
				const pages = Array.from(document.querySelectorAll(".printedjs_page"));
				return pages.map((p) => p.querySelectorAll("tfoot").length);
			});
			expect(tfootCounts[0]).toBe(0);
			expect(tfootCounts[1]).toBe(0);
			expect(tfootCounts[2]).toBe(1);

			// 3. Verify no continuation cell is repeated to next pages
			const hasContinuationCell = await page.evaluate(() => {
				return Boolean(document.querySelector(".printedjs-rowspan-continuation"));
			});
			expect(hasContinuationCell).toBe(false);

			const cellWidthsPerPage = await page.evaluate(() => {
				const pages = Array.from(document.querySelectorAll(".printedjs_page"));
				return pages.map((p, idx) => {
					const dataRows = Array.from(p.querySelectorAll("tbody tr")).filter(
						(r) =>
							!r.classList.contains("region-banner-row") &&
							!r.classList.contains("section-divider-row") &&
							!r.classList.contains("audit-row") &&
							!r.classList.contains("executive-row"),
					);
					const sample = dataRows[dataRows.length - 1];
					return {
						pageIndex: idx + 1,
						cellCount: sample?.children.length,
						widths: sample
							? Array.from(sample.children).map((c) =>
									Math.round(c.getBoundingClientRect().width),
								)
							: [],
						texts: sample
							? Array.from(sample.children).map((c) => c.textContent?.trim().slice(0, 15))
							: [],
					};
				});
			});

			// 3. Verify column widths remain consistent across pages (within 1.5px sub-pixel tolerance)
			const p1Sample = cellWidthsPerPage.find(
				(p) => p.pageIndex === 1 && p.widths.length === 8,
			);
			const p2Sample = cellWidthsPerPage.find(
				(p) => p.pageIndex === 2 && p.widths.length === 8,
			);
			expect(p1Sample).toBeDefined();
			expect(p2Sample).toBeDefined();
			if (p1Sample && p2Sample) {
				for (let i = 0; i < p1Sample.widths.length; i++) {
					expect(Math.abs(p1Sample.widths[i]! - p2Sample.widths[i]!)).toBeLessThanOrEqual(
						1.5,
					);
				}
			}

			// 3. Verify Colspan split page case: multi-row colspan section splits across pages
			const colspanCase = await page.evaluate(() => {
				const pages = Array.from(document.querySelectorAll(".printedjs_page"));
				return pages.map((p, idx) => ({
					pageIndex: idx + 1,
					colspans: Array.from(p.querySelectorAll("td[colspan]")).map((c) =>
						c.getAttribute("colspan"),
					),
					banners: Array.from(p.querySelectorAll(".region-banner-row")).map((r) =>
						r.textContent?.trim(),
					),
					hasSectionTwo: Boolean(
						p.querySelector(".section-divider-row") ||
						Array.from(p.querySelectorAll("tr")).some((r) =>
							r.textContent?.includes("Section II"),
						),
					),
					auditRowCount: p.querySelectorAll(".audit-row").length,
				}));
			});

			// Verify region banners flow across pages
			const page1Banners = colspanCase[0]?.banners ?? [];
			expect(page1Banners.length).toBeGreaterThanOrEqual(1);

			// Verify Section II starts on Page 2 (utilizing available space) and splits onto Page 3
			expect(colspanCase[1]?.hasSectionTwo).toBe(true);
			expect(colspanCase[1]?.auditRowCount).toBeGreaterThanOrEqual(1);
			expect(colspanCase[2]?.auditRowCount).toBeGreaterThanOrEqual(1);

			const pagesWithColspan = colspanCase.filter((p) => p.colspans.length > 0);
			expect(pagesWithColspan.length).toBeGreaterThanOrEqual(2);
			const allColspans = colspanCase.flatMap((p) => p.colspans);
			expect(allColspans).toContain("9");
			expect(allColspans).toContain("5");
			expect(allColspans).toContain("2");

			// 4. Verify after render event emits positive page count (never 0)
			const eventDetail = await page.evaluate(
				async (): Promise<{
					pageCount?: number;
					totalPages?: number;
					total?: number;
				} | null> => {
					let captured: {
						pageCount?: number;
						totalPages?: number;
						total?: number;
					} | null = null;
					window.addEventListener(
						"printedjs:rendered",
						(e: Event) => {
							const ce = e as CustomEvent;
							captured = {
								pageCount: ce.detail?.pageCount,
								totalPages: ce.detail?.totalPages,
								total: ce.detail?.total,
							};
						},
						{ once: true },
					);

					const container = document.createElement("div");
					const win = window as unknown as {
						Printedjs: {
							createRenderer: (opts: unknown) => {
								render: (arg: unknown) => Promise<void>;
								destroy: () => void;
							};
						};
						PrintedjsPlugins: { standardPreset: () => unknown };
					};
					const renderer = win.Printedjs.createRenderer({
						target: container,
						isolation: "root",
						plugins: win.PrintedjsPlugins.standardPreset(),
					});
					await renderer.render({
						content: { html: "<p>Render event verification</p>" },
					});
					renderer.destroy();
					return captured;
				},
			);

			expect(eventDetail).not.toBeNull();
			expect(eventDetail?.pageCount).toBe(1);
			expect(eventDetail?.totalPages).toBe(1);
			expect(eventDetail?.total).toBe(1);
		} finally {
			await browser.close();
			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 25000);

	test("synchronizes table column widths across pages automatically without explicit css table-layout or colgroup", async () => {
		const tempHtmlPath = resolve(__dirname, "../fixtures/temp-auto-table.html");
		const tableHtml = `
		<style>
			@page { size: A4 portrait; margin: 20mm; }
			table.auto-table { width: 100%; border-collapse: collapse; }
			table.auto-table th, table.auto-table td { border: 1px solid #ccc; padding: 6px; }
			thead.no-repeat { display: table-row-group; }
		</style>
		<table class="auto-table">
			<thead class="no-repeat" data-repeat="false">
				<tr>
					<th>Wide Column Name With Lots Of Text For Headers</th>
					<th>Short</th>
					<th>Another Medium Header</th>
				</tr>
			</thead>
			<tbody>
				${Array.from({ length: 45 })
					.map(
						(_, i) => `
					<tr>
						<td>Col1 Row ${i}</td>
						<td>Col2 Value With Very Long Content On Page 2 Rows That Would Otherwise Stretch Column Two In Auto Layout</td>
						<td>Col3 Row ${i}</td>
					</tr>
				`,
					)
					.join("")}
			</tbody>
		</table>
		`;

		const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
    ${tableHtml}
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
            window.__rendered = true;
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
			await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });
			await page.waitForFunction(
				() => (window as unknown as { __rendered?: boolean }).__rendered === true,
			);

			const widthsPerPage = await page.evaluate(() => {
				const pages = Array.from(document.querySelectorAll(".printedjs_page"));
				return pages.map((p, idx) => {
					const row = p.querySelector("tbody tr");
					return {
						pageIndex: idx + 1,
						widths: row
							? Array.from(row.children).map((c) =>
									Math.round(c.getBoundingClientRect().width),
								)
							: [],
					};
				});
			});

			expect(widthsPerPage.length).toBeGreaterThanOrEqual(2);
			const p1 = widthsPerPage[0];
			const p2 = widthsPerPage[1];
			expect(p1).toBeDefined();
			expect(p2).toBeDefined();
			if (p1 && p2) {
				expect(p1.widths.length).toBe(3);
				expect(p2.widths.length).toBe(3);
				for (let i = 0; i < p1.widths.length; i++) {
					expect(Math.abs(p1.widths[i]! - p2.widths[i]!)).toBeLessThanOrEqual(2);
				}
			}
		} finally {
			await browser.close();
			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 25000);

	test("honors standard CSS break-after: avoid on table rows when subsequent row overflows", async () => {
		const tempHtmlPath = resolve(__dirname, "../fixtures/temp-plain-colspan.html");
		const tableHtml = `
		<style>
			@page { size: A4 portrait; margin: 20mm; }
			table { width: 100%; border-collapse: collapse; }
			th, td { border: 1px solid #ccc; padding: 12px; }
			tr.avoid-break { break-after: avoid; page-break-after: avoid; }
		</style>
		<table>
			<thead>
				<tr>
					<th>Header 1</th>
					<th>Header 2</th>
					<th>Header 3</th>
				</tr>
			</thead>
			<tbody>
				${Array.from({ length: 14 })
					.map(
						(_, i) => `
					<tr>
						<td>Group 1 Row ${i}</td>
						<td>Description ${i}</td>
						<td>Value ${i}</td>
					</tr>
				`,
					)
					.join("")}
				<tr class="avoid-break" id="target-banner">
					<td colspan="3">Section Two Colspan Title With Explicit CSS break-after: avoid</td>
				</tr>
				${Array.from({ length: 15 })
					.map(
						(_, i) => `
					<tr>
						<td>Group 2 Row ${i}</td>
						<td>Description ${i}</td>
						<td>Value ${i}</td>
					</tr>
				`,
					)
					.join("")}
			</tbody>
		</table>
		`;

		const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
    ${tableHtml}
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
            window.__rendered = true;
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
			await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" });
			await page.waitForFunction(
				() => (window as unknown as { __rendered?: boolean }).__rendered === true,
			);

			const bannerPage = await page.evaluate(() => {
				const pages = Array.from(document.querySelectorAll(".printedjs_page"));
				for (let idx = 0; idx < pages.length; idx++) {
					const banner = pages[idx]!.querySelector("#target-banner");
					if (banner) {
						const rows = Array.from(pages[idx]!.querySelectorAll("tbody tr"));
						const bannerRowIndex = rows.findIndex((r) => r.contains(banner));
						const hasRowsAfterBanner =
							bannerRowIndex >= 0 && bannerRowIndex < rows.length - 1;
						return {
							pageIndex: idx + 1,
							isOrphanAtBottom: bannerRowIndex === rows.length - 1,
							hasRowsAfterBanner,
						};
					}
				}
				return null;
			});

			expect(bannerPage).not.toBeNull();
			expect(bannerPage?.isOrphanAtBottom).toBe(false);
			expect(bannerPage?.hasRowsAfterBanner).toBe(true);
		} finally {
			await browser.close();
			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 25000);
});
