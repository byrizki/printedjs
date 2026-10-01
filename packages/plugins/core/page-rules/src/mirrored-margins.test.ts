import { describe, expect, test } from "vitest";
import { parsePageRules } from "./parser.js";
import { generatePageCss } from "./plugin.js";

describe("Mirrored Margins and Gutter Binding", () => {
	test("parses margin-inside, margin-outside, and gutter declarations", () => {
		const css = `
			@page {
				size: A4;
				margin-inside: 25mm;
				margin-outside: 15mm;
				gutter: 5mm;
			}
		`;
		const rules = parsePageRules(css);
		expect(rules).toHaveLength(1);
		expect(rules[0]?.margin?.inside).toBe("25mm");
		expect(rules[0]?.margin?.outside).toBe("15mm");
		expect(rules[0]?.margin?.gutter).toBe("5mm");
	});

	test("generates mirrored margins and gutter calculations for left and right pages", () => {
		const css = `
			@page {
				size: A4;
				margin-inside: 25mm;
				margin-outside: 15mm;
				gutter: 5mm;
			}
		`;
		const rules = parsePageRules(css);
		const output = generatePageCss(rules);

		// Inside for right page is LEFT edge (spine): inside + gutter
		expect(output).toContain(".printedjs_page.printedjs_right_page {");
		expect(output).toContain("--printedjs-margin-left: calc(25mm + 5mm);");
		expect(output).toContain("--printedjs-margin-right: 15mm;");

		// Inside for left page is RIGHT edge (spine): inside + gutter
		expect(output).toContain(".printedjs_page.printedjs_left_page {");
		expect(output).toContain("--printedjs-margin-right: calc(25mm + 5mm);");
		expect(output).toContain("--printedjs-margin-left: 15mm;");
	});

	test("gutter binding with standard 4-side margin", () => {
		const css = `
			@page {
				size: A4;
				margin: 20mm;
				gutter: 6mm;
			}
		`;
		const rules = parsePageRules(css);
		const output = generatePageCss(rules);

		// Right page has gutter added to left (inside) margin
		expect(output).toContain(".printedjs_page.printedjs_right_page {");
		expect(output).toContain("--printedjs-margin-left: calc(20mm + 6mm);");

		// Left page has gutter added to right (inside) margin
		expect(output).toContain(".printedjs_page.printedjs_left_page {");
		expect(output).toContain("--printedjs-margin-right: calc(20mm + 6mm);");
	});

	test("named page rules with mirrored margins", () => {
		const css = `
			@page {
				size: A4;
				margin: 20mm;
			}
			@page chapter {
				margin-inside: 30mm;
				margin-outside: 10mm;
				gutter: 4mm;
			}
		`;
		const rules = parsePageRules(css);
		const output = generatePageCss(rules);

		expect(output).toContain(".printedjs_chapter_page.printedjs_right_page {");
		expect(output).toContain("--printedjs-margin-left: calc(30mm + 4mm);");
		expect(output).toContain("--printedjs-margin-right: 10mm;");

		expect(output).toContain(".printedjs_chapter_page.printedjs_left_page {");
		expect(output).toContain("--printedjs-margin-right: calc(30mm + 4mm);");
		expect(output).toContain("--printedjs-margin-left: 10mm;");
	});

	test("pagedjs compatibility emits both printedjs and pagedjs custom properties", () => {
		const css = `
			@page {
				margin-inside: 20mm;
				margin-outside: 10mm;
				gutter: 3mm;
			}
		`;
		const rules = parsePageRules(css);
		const output = generatePageCss(rules, true);

		expect(output).toContain("--printedjs-margin-inside: 20mm;");
		expect(output).toContain("--pagedjs-margin-inside: 20mm;");
		expect(output).toContain("--printedjs-margin-outside: 10mm;");
		expect(output).toContain("--pagedjs-margin-outside: 10mm;");
		expect(output).toContain("--printedjs-gutter: 3mm;");
		expect(output).toContain("--pagedjs-gutter: 3mm;");
	});
});
