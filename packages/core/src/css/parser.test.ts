import { describe, expect, test } from "vitest";
import { generateCss, parseCss } from "./parser.js";

describe("css/parser", () => {
	test("parses standard CSS rules with selectors and declarations", () => {
		const css = `
			h1 {
				color: red;
				font-size: 24px;
			}
		`;

		const ast = parseCss(css, "style.css");
		expect(ast.rules).toHaveLength(1);
		expect(ast.rules[0]?.selector).toBe("h1");
		expect(ast.rules[0]?.declarations).toHaveLength(2);
		expect(ast.rules[0]?.declarations[0]?.property).toBe("color");
		expect(ast.rules[0]?.declarations[0]?.value).toBe("red");
		expect(ast.rules[0]?.loc?.source).toBe("style.css");
		expect(ast.rules[0]?.loc?.startLine).toBeDefined();
	});

	test("parses page rules and margin boxes", () => {
		const css = `
			@page :left {
				size: A4;
				@bottom-left {
					content: counter(page);
				}
			}
		`;

		const ast = parseCss(css);
		expect(ast.pageRules).toHaveLength(1);
		expect(ast.pageRules[0]?.selector).toBe(":left");
		expect(ast.pageRules[0]?.declarations[0]?.property).toBe("size");
		expect(ast.pageRules[0]?.declarations[0]?.value).toBe("A4");
		expect(ast.pageRules[0]?.marginBoxes).toHaveLength(1);
		expect(ast.pageRules[0]?.marginBoxes[0]?.marginBox).toBe("bottom-left");
		expect(ast.pageRules[0]?.marginBoxes[0]?.declarations[0]?.property).toBe("content");
		expect(ast.pageRules[0]?.marginBoxes[0]?.declarations[0]?.value).toBe(
			"counter(page)",
		);
	});

	test("generates CSS back from AST", () => {
		const css = `h1 {\n  color: red;\n}`;
		const ast = parseCss(css);
		const generated = generateCss(ast);
		expect(generated).toContain("h1 {");
		expect(generated).toContain("color: red;");
	});
});
