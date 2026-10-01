import { describe, expect, test } from "vitest";
import { parseBreakStyles } from "./parser.js";

describe("breaks/parser", () => {
	test("parses break-before and break-after declarations", () => {
		const css = `
			section {
				break-before: right;
				break-after: always;
			}
			h2 {
				break-after: avoid;
			}
		`;
		const rules = parseBreakStyles(css);
		expect(rules).toHaveLength(2);
		expect(rules[0]).toEqual({
			selector: "section",
			breakBefore: "right",
			breakAfter: "page",
		});
		expect(rules[1]).toEqual({
			selector: "h2",
			breakAfter: "avoid",
		});
	});

	test("normalizes legacy page-break-* properties", () => {
		const css = `
			.chapter {
				page-break-before: always;
				page-break-after: left;
				page-break-inside: avoid;
			}
		`;
		const rules = parseBreakStyles(css);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({
			selector: ".chapter",
			breakBefore: "page",
			breakAfter: "left",
			breakInside: "avoid",
		});
	});

	test("detects position: fixed rules", () => {
		const css = `
			.fixed-header {
				position: fixed;
				top: 0;
			}
		`;
		const rules = parseBreakStyles(css);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({
			selector: ".fixed-header",
			isFixed: true,
		});
	});

	test("parses page property for named page rules", () => {
		const css = `
			.landscape-section {
				page: landscape-sheet;
			}
			.portrait-return {
				page: auto;
			}
		`;
		const rules = parseBreakStyles(css);
		expect(rules).toHaveLength(2);
		expect(rules[0]).toEqual({
			selector: ".landscape-section",
			page: "landscape-sheet",
		});
		expect(rules[1]).toEqual({
			selector: ".portrait-return",
			page: "auto",
		});
	});
});
