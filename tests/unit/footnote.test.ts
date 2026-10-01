import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer";
import { describe, expect, test } from "vitest";
import { resolveChromeExecutable } from "../helpers/browser.js";

const executablePath = resolveChromeExecutable();

describe.runIf(Boolean(executablePath))("Footnotes rendering", () => {
	test("properly renders in-text footnote call, bottom area, and footnote marker", async () => {
		const tempHtmlPath = resolve(__dirname, "../fixtures/temp-footnote-test.html");
		const template = `<style>
@page {
  size: 6in 9in;
  margin: 1in;
  @footnote {
    border-top: 1px solid #94a3b8;
    padding-top: 8px;
  }
}
body {
  font-family: Georgia, serif;
  color: #1e293b;
  line-height: 1.7;
  margin: 0;
}
span.footnote {
  float: footnote;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 11px;
  color: #475569;
}
p {
  color: #1e293b;
  font-size: 15px;
}
</style>
<p>
Printedjs supports standard CSS Paged Media
footnotes<span class="footnote">Refer to CSS Paged Media Module Level 3 specification for footnote-policy and float rules.</span> seamlessly integrated with pagination flow.
</p>`;

		const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<div id="app"></div>
<script src="${resolve(__dirname, "../../packages/browser/dist/index.global.js")}"></script>
<script src="${resolve(__dirname, "../../packages/plugins/core/preset/dist/index.global.js")}"></script>
<script>
window.addEventListener("DOMContentLoaded", async () => {
    const plugins = PrintedjsPlugins.standardPreset();
    const renderer = Printedjs.createRenderer({
        target: document.getElementById("app"),
        isolation: "root",
        plugins: plugins,
    });
    await renderer.render({ content: { html: ${JSON.stringify(template)} } });
    window.__rendered = true;
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
				() => (window as unknown as { __rendered?: boolean }).__rendered === true,
			);

			const footnoteData = await page.evaluate(() => {
				const area = document.querySelector(".printedjs_footnote_area") as HTMLElement;
				const content = document.querySelector(
					".printedjs_footnote_content",
				) as HTMLElement;
				const call = document.querySelector(".printedjs_footnote_call") as HTMLElement;
				const note = document.querySelector(".footnote") as HTMLElement;
				const pseudoBefore = window.getComputedStyle(note, "::before");
				const pageEl = document.querySelector(".printedjs_page") as HTMLElement;

				return {
					areaDisplay: window.getComputedStyle(area).display,
					areaBorderTopWidth: window.getComputedStyle(area).borderTopWidth,
					areaPaddingTop: window.getComputedStyle(area).paddingTop,
					contentDisplay: window.getComputedStyle(content).display,
					callVerticalAlign: window.getComputedStyle(call).verticalAlign,
					callText: call.textContent?.trim(),
					noteText: note.textContent?.trim(),
					noteMarkerContent: pseudoBefore.content,
					noteHeight: note.getBoundingClientRect().height,
					footnoteHeightVar: pageEl.style.getPropertyValue(
						"--printedjs-footnotes-height",
					),
					areaScrollHeight: area.scrollHeight,
					areaClientHeight: area.clientHeight,
					noteBottom: note.getBoundingClientRect().bottom,
					areaBottom: area.getBoundingClientRect().bottom,
				};
			});

			// 1. Callout should be superscript and contain note index
			expect(footnoteData.callText).toBe("1");
			expect(footnoteData.callVerticalAlign).toBe("super");

			// 2. Footnote area should be visible with dynamic height and @footnote styles
			expect(footnoteData.areaDisplay).toBe("block");
			expect(footnoteData.contentDisplay).toBe("block");
			expect(footnoteData.areaBorderTopWidth).toBe("1px");
			expect(footnoteData.areaPaddingTop).toBe("8px");
			expect(parseInt(footnoteData.footnoteHeightVar, 10)).toBeGreaterThan(0);

			// 3. Footnote note should be visible and prefixed with marker
			expect(footnoteData.noteHeight).toBeGreaterThan(0);
			expect(footnoteData.noteMarkerContent).toContain("1");
			expect(footnoteData.noteText).toContain("CSS Paged Media Module Level 3");

			// 4. Footnote area must not truncate footnote text
			expect(footnoteData.areaClientHeight).toBeGreaterThanOrEqual(
				footnoteData.areaScrollHeight,
			);
			expect(footnoteData.noteBottom).toBeLessThanOrEqual(footnoteData.areaBottom + 0.5);
		} finally {
			await browser.close();
			if (existsSync(tempHtmlPath)) {
				unlinkSync(tempHtmlPath);
			}
		}
	}, 25000);
});
