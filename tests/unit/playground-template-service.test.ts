import { describe, expect, test } from "vitest";
import { FIXTURE_CATALOG } from "../../apps/playground/src/fixtures/index.js";
import {
	compileTemplate,
	formatCurrencyValue,
	formatJsonString,
	parseJsonData,
	playgroundTemplateHelpers,
} from "../../apps/playground/src/services/template-service.js";

describe("Playground Template Service", () => {
	describe("parseJsonData", () => {
		test("parses valid JSON string", () => {
			const json = '{"name": "Alice", "score": 95}';
			const result = parseJsonData(json);
			expect(result.error).toBeNull();
			expect(result.data).toEqual({ name: "Alice", score: 95 });
		});

		test("returns empty object for empty or whitespace-only string", () => {
			expect(parseJsonData("").data).toEqual({});
			expect(parseJsonData("   ").data).toEqual({});
		});

		test("reports error for invalid JSON", () => {
			const result = parseJsonData('{"name": "Alice",');
			expect(result.error).not.toBeNull();
		});

		test("reports error if root is not an object", () => {
			const result = parseJsonData("[1, 2, 3]");
			expect(result.error).toContain("must be a JSON object");
		});
	});

	describe("formatJsonString", () => {
		test("formats unformatted JSON with 2 spaces indentation", () => {
			const unformatted = '{"a":1,"b":[2,3]}';
			const { formatted, error } = formatJsonString(unformatted);
			expect(error).toBeNull();
			expect(formatted).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
		});

		test("returns error for invalid JSON without breaking", () => {
			const invalid = "{ broken }";
			const { formatted, error } = formatJsonString(invalid);
			expect(error).not.toBeNull();
			expect(formatted).toBe(invalid);
		});
	});

	describe("formatCurrencyValue", () => {
		test("formats USD correctly", () => {
			expect(formatCurrencyValue(1250, "USD")).toBe("$1,250");
			expect(formatCurrencyValue(1250.5, "USD")).toBe("$1,250.50");
		});

		test("formats IDR correctly", () => {
			expect(formatCurrencyValue(5000000, "IDR")).toContain("5.000.000");
		});
	});

	describe("playgroundTemplateHelpers", () => {
		test("provides expected helper functions", () => {
			expect(playgroundTemplateHelpers.currency).toBeDefined();
			expect(playgroundTemplateHelpers.uppercase("hello")).toBe("HELLO");
			expect(playgroundTemplateHelpers.lowercase("WORLD")).toBe("world");
			expect(playgroundTemplateHelpers.sum([1, 2, 3])).toBe(6);
			expect(playgroundTemplateHelpers.sum([{ v: 10 }, { v: 20 }], "v")).toBe(30);
		});
	});

	describe("compileTemplate", () => {
		test("evaluates expressions and interpolates variables", () => {
			const template = "<h1>Hello <%= user.name %>!</h1>";
			const data = { user: { name: "Bob" } };
			const result = compileTemplate(template, data);

			expect(result.error).toBeNull();
			expect(result.html).toBe("<h1>Hello Bob!</h1>");
			expect(result.durationMs).toBeGreaterThanOrEqual(0);
		});

		test("supports loops and built-in helper functions", () => {
			const template = `
				<div>
					<% items.forEach(function(item) { %>
						<span><%= uppercase(item.name) %>: <%= currency(item.price, "USD") %></span>
					<% }); %>
					<p>Total: <%= currency(sum(items, "price"), "USD") %></p>
				</div>
			`.trim();

			const data = {
				items: [
					{ name: "Widget A", price: 100 },
					{ name: "Widget B", price: 250 },
				],
			};

			const result = compileTemplate(template, data);
			expect(result.error).toBeNull();
			expect(result.html).toContain("WIDGET A: $100");
			expect(result.html).toContain("WIDGET B: $250");
			expect(result.html).toContain("Total: $350");
		});

		test("handles syntax errors gracefully without throwing", () => {
			const brokenTemplate = "<h1><%= unclosed";
			const result = compileTemplate(brokenTemplate, {});
			expect(result.error).not.toBeNull();
			expect(result.error).toContain("Template compilation error");
		});

		test("seamlessly handles BigInt data without throwing", () => {
			const result = compileTemplate("Amount: <%= amount %>", { amount: 1000000n });
			expect(result.error).toBeNull();
			expect(result.html).toBe("Amount: 1000000");
		});

		test("accesses JSON data via it and locals like EJS", () => {
			const template = `
				<p>Direct: <%= name %></p>
				<p>Via it: <%= it.name %></p>
				<p>Via locals: <%= locals.name %></p>
			`.trim();
			const result = compileTemplate(template, { name: "Printedjs" });
			expect(result.error).toBeNull();
			expect(result.html).toContain("Direct: Printedjs");
			expect(result.html).toContain("Via it: Printedjs");
			expect(result.html).toContain("Via locals: Printedjs");
		});
	});

	describe("FIXTURE_CATALOG", () => {
		test("all fixtures in the catalog compile without template error", () => {
			for (const fixture of FIXTURE_CATALOG) {
				const data = fixture.data ?? {};
				const result = compileTemplate(fixture.html, data);
				expect(result.error).toBeNull();
				expect(result.html.length).toBeGreaterThan(0);
			}
		});
	});

	describe("devtoolsPlugin afterRender", () => {
		test("emits actual pageCount from metadata without returning 0", async () => {
			const { devtoolsPlugin } = await import("../../packages/devtools/src/index.js");
			interface TestReport {
				pageCount?: number;
				events: Array<{ name: string; details?: { pageCount?: number } }>;
			}
			let capturedReport: TestReport | null = null;
			const plugin = devtoolsPlugin({
				onReport(report) {
					capturedReport = report as unknown as TestReport;
				},
			});
			plugin.setup?.({} as unknown as Parameters<NonNullable<typeof plugin.setup>>[0]);
			plugin.afterRender?.({
				metadata: {
					pageCount: 3,
					pages: [{}, {}, {}],
				},
				pagedjsCompatible: false,
			} as unknown as Parameters<NonNullable<typeof plugin.afterRender>>[0]);

			expect(capturedReport).not.toBeNull();
			const report = capturedReport as unknown as TestReport;
			expect(report.pageCount).toBe(3);
			const event = report.events.find((e) => e.name === "afterRender");
			expect(event).toBeDefined();
			expect(event?.details?.pageCount).toBe(3);
		});
	});
});
