import { describe, expect, it } from "vitest";
import { columnsPlugin } from "./plugin.js";

describe("columnsPlugin", () => {
	it("parses column properties and sets data attributes during beforeLayout", () => {
		const plugin = columnsPlugin();
		const context = { metadata: {}, pagedjsCompatible: false };

		plugin.setup?.(context);

		const css = `
			.article {
				column-count: 3;
				column-gap: 25px;
				column-fill: balance;
			}
		`;

		plugin.transformStyles?.(css, context);

		const attrs: Record<string, string> = {};

		const articleEl = {
			getAttribute: (k: string) => attrs[k] ?? null,
			setAttribute: (k: string, v: string) => {
				attrs[k] = v;
			},
		};

		const contentRoot = {
			querySelectorAll: (sel: string) => (sel === ".article" ? [articleEl] : []),
		};

		plugin.beforeLayout?.({
			metadata: { contentRoot: contentRoot as unknown as ParentNode },
			pagedjsCompatible: false,
		});

		expect(articleEl.getAttribute("data-column-count")).toBe("3");
		expect(articleEl.getAttribute("data-column-gap")).toBe("25px");
		expect(articleEl.getAttribute("data-column-fill")).toBe("balance");
	});

	it("tags elements with column-span: all style", () => {
		const plugin = columnsPlugin();
		const context = { metadata: {}, pagedjsCompatible: false };

		plugin.setup?.(context);

		const attrs: Record<string, string> = {
			style: "column-span: all; margin: 10px;",
		};

		const headingEl = {
			getAttribute: (k: string) => attrs[k] ?? null,
			setAttribute: (k: string, v: string) => {
				attrs[k] = v;
			},
		};

		const contentRoot = {
			querySelectorAll: (sel: string) =>
				sel === "[style*='column-span']" ? [headingEl] : [],
		};

		plugin.beforeLayout?.({
			metadata: { contentRoot: contentRoot as unknown as ParentNode },
			pagedjsCompatible: false,
		});

		expect(headingEl.getAttribute("data-column-span")).toBe("all");
	});
});
