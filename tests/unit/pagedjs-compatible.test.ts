import { describe, expect, test, vi } from "vitest";
import { generatePageCss } from "../../packages/plugins/core/page-rules/src/plugin.js";
import { parsePageRules } from "../../packages/plugins/core/page-rules/src/parser.js";
import {
	PAGE_SHELL_CSS,
	createPageShell,
} from "../../packages/browser/src/dom/page-shell.js";
import { runCli } from "../../packages/cli/src/cli.js";

describe("Paged.js Compatible Configuration", () => {
	const sampleCss = `
		@page {
			size: A4;
			margin: 20mm;
			bleed: 5mm;
		}
		@page :first {
			margin-top: 40mm;
		}
	`;

	test("defaults to pagedjsCompatible=false emitting only printedjs properties and selectors", () => {
		const rules = parsePageRules(sampleCss);
		const css = generatePageCss(rules);

		expect(css).toContain("--printedjs-pagebox-width: 210mm");
		expect(css).not.toContain("--pagedjs-pagebox-width");
		expect(css).toContain("--printedjs-height: calc(var(--printedjs-pagebox-height)");
		expect(css).not.toContain("--pagedjs-height");
		expect(css).toContain(".printedjs_page {");
		expect(css).not.toContain(".pagedjs_page");
		expect(css).toContain(".printedjs_page.printedjs_first_page");
		expect(css).not.toContain(".pagedjs_first_page");
	});

	test("when pagedjsCompatible=true emits both printedjs and pagedjs properties and selectors", () => {
		const rules = parsePageRules(sampleCss);
		const css = generatePageCss(rules, true);

		// CSS custom properties with compatibility enabled
		expect(css).toContain("--printedjs-pagebox-width: 210mm");
		expect(css).toContain("--pagedjs-pagebox-width: 210mm");
		expect(css).toContain("--printedjs-height: calc(var(--printedjs-pagebox-height)");
		expect(css).toContain("--pagedjs-height: calc(var(--pagedjs-pagebox-height)");
		expect(css).toContain("--printedjs-bleed-top: 5mm");
		expect(css).toContain("--pagedjs-bleed-top: 5mm");

		// Selectors with compatibility enabled
		expect(css).toContain(".printedjs_page, .pagedjs_page");
		expect(css).toContain(
			".printedjs_page.printedjs_first_page, .pagedjs_page.pagedjs_first_page",
		);
	});

	test("createPageShell defaults to pagedjsCompatible=false", () => {
		// Mock minimal DOM document
		const fakeDoc = {
			createElement: () => {
				const el = {
					id: "",
					className: "",
					attributes: {} as Record<string, string>,
					innerHTML: "",
					setAttribute(k: string, v: string) {
						this.attributes[k] = v;
					},
				};

				return el as unknown as HTMLElement;
			},
		} as unknown as Document;

		const shellPure = createPageShell(1, fakeDoc);
		expect(shellPure.className).toContain("printedjs_page");
		expect(shellPure.className).not.toContain("pagedjs_page");
		expect(shellPure.className).toContain("printedjs_first_page");
		expect(shellPure.className).not.toContain("pagedjs_first_page");
		expect(shellPure.innerHTML).not.toContain("pagedjs_");

		const shellCompat = createPageShell(1, fakeDoc, true);
		expect(shellCompat.className).toContain("printedjs_page");
		expect(shellCompat.className).toContain("pagedjs_page");
		expect(shellCompat.className).toContain("printedjs_first_page");
		expect(shellCompat.className).toContain("pagedjs_first_page");
	});

	test("PAGE_SHELL_CSS declares primary printedjs tokens and pagedjs aliases", () => {
		expect(PAGE_SHELL_CSS).toContain("--printedjs-width: 8.5in;");
		expect(PAGE_SHELL_CSS).toContain("--pagedjs-width: var(--printedjs-width);");
		expect(PAGE_SHELL_CSS).toContain(":is(.printedjs_page, .pagedjs_page)");
		expect(PAGE_SHELL_CSS).toContain(":is(.printedjs_pages, .pagedjs_pages)");
		expect(PAGE_SHELL_CSS).toContain(":is(.printedjs_sheet, .pagedjs_sheet)");
	});

	test("CLI help lists --pagedjs-compatible and --no-pagedjs-compatible flags", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		await runCli(["--help"]);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("--pagedjs-compatible"),
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("--no-pagedjs-compatible"),
		);
		consoleLogSpy.mockRestore();
	});

	test("named page rules emit dedicated data-page selectors and pagebox dimensions", () => {
		const mixedCss = `
			@page {
				size: A4 portrait;
			}
			@page landscape-sheet {
				size: A4 landscape;
				margin: 15mm;
			}
		`;

		const rules = parsePageRules(mixedCss);
		const css = generatePageCss(rules, true);

		expect(css).toContain('[data-page="landscape-sheet"]');
		expect(css).toContain(".printedjs_landscape-sheet_page");
		expect(css).toContain("--printedjs-pagebox-width: 297mm");
		expect(css).toContain("--printedjs-pagebox-height: 210mm");
		expect(css).toContain("@page landscape-sheet { size: 297mm 210mm; margin: 0; }");
	});
});
