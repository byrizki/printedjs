import { describe, expect, test } from "vitest";
import { parsePageRules } from "./parser.js";

describe("parsePageRules", () => {
	test("parses default letter size and margin with single quotes", () => {
		const css = `
			@page {
				size: 'letter';
				margin: 1.2in;
			}
		`;

		const rules = parsePageRules(css);
		expect(rules).toHaveLength(1);
		expect(rules[0]?.size).toEqual({ width: "8.5in", height: "11in" });
		expect(rules[0]?.margin).toEqual({
			top: "1.2in",
			right: "1.2in",
			bottom: "1.2in",
			left: "1.2in",
		});
	});

	test("parses A4 size with bleed", () => {
		const css = `
			@page {
				size: A4;
				margin: 8mm;
				bleed: 10mm;
			}
		`;

		const rules = parsePageRules(css);
		expect(rules).toHaveLength(1);
		expect(rules[0]?.size).toEqual({ width: "210mm", height: "297mm" });
		expect(rules[0]?.bleed).toEqual({
			top: "10mm",
			right: "10mm",
			bottom: "10mm",
			left: "10mm",
		});
	});

	test("parses marks and defaults bleed to 6mm", () => {
		const css = `
			@page {
				size: A4;
				margin: 8mm;
				marks: crop cross;
			}
		`;

		const rules = parsePageRules(css);
		expect(rules).toHaveLength(1);
		expect(rules[0]?.marks).toEqual(["crop", "cross"]);
		expect(rules[0]?.bleed).toEqual({
			top: "6mm",
			right: "6mm",
			bottom: "6mm",
			left: "6mm",
		});
	});

	test("parses landscape orientation", () => {
		const css = `
			@page {
				size: A4 landscape;
			}
		`;

		const rules = parsePageRules(css);
		expect(rules).toHaveLength(1);
		expect(rules[0]?.size).toEqual({
			width: "297mm",
			height: "210mm",
			orientation: "landscape",
		});
	});
});
