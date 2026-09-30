import { describe, expect, test, vi } from "vitest";
import { PrintedjsStylesheetError } from "@printedjs/core";
import { loadStylesheet, loadStylesheets } from "./stylesheet-loader.js";

describe("styles/stylesheet-loader", () => {
	test("returns inline stylesheet as-is", async () => {
		const result = await loadStylesheet({
			type: "inline",
			content: "body { color: red; }",
		});
		expect(result).toEqual({
			type: "inline",
			css: "body { color: red; }",
		});
	});

	test("loads external stylesheet via fetch", async () => {
		const mockResponse = new Response("p { margin: 0; }", { status: 200 });
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);

		const result = await loadStylesheet({
			type: "url",
			url: "https://example.com/style.css",
		});
		expect(result).toEqual({
			type: "url",
			url: "https://example.com/style.css",
			css: "p { margin: 0; }",
		});
	});

	test("throws PrintedjsStylesheetError when HTTP response is not ok", async () => {
		const mockResponse = new Response("Not Found", {
			status: 404,
			statusText: "Not Found",
		});
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);

		await expect(
			loadStylesheet({
				type: "url",
				url: "https://example.com/missing.css",
			}),
		).rejects.toThrow(PrintedjsStylesheetError);
	});

	test("loads multiple stylesheets in order", async () => {
		const results = await loadStylesheets([
			{ type: "inline", content: "a { color: blue; }" },
			{ type: "inline", content: "b { color: green; }" },
		]);
		expect(results).toHaveLength(2);
		expect(results[0]?.css).toBe("a { color: blue; }");
		expect(results[1]?.css).toBe("b { color: green; }");
	});

	test("unwraps @media print rules and strips @media screen rules", async () => {
		const result = await loadStylesheet({
			type: "inline",
			content: `
				body { margin: 0; }
				@media print {
					.header { display: none; }
					h1 { color: #003366; }
				}
				@media screen {
					.sidebar { width: 200px; }
				}
			`,
		});

		expect(result.css).toContain("body { margin: 0; }");
		expect(result.css).toContain(".header { display: none; }");
		expect(result.css).toContain("h1 { color: #003366; }");
		expect(result.css).not.toContain("@media print");
		expect(result.css).not.toContain(".sidebar { width: 200px; }");
	});
});
