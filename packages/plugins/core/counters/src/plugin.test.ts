import { describe, expect, it } from "vitest";
import { countersPlugin } from "./plugin.js";

describe("countersPlugin", () => {
	it("transforms target-counter and target-text CSS functions", () => {
		const plugin = countersPlugin();

		const css = `
			a.ref::after {
				content: "See page " target-counter(attr(href), page);
			}
			a.roman::after {
				content: target-counter(attr(href), page, lower-roman);
			}
			a.upper::after {
				content: target-counter(#section2, page, upper-roman);
			}
			a.title::before {
				content: target-text(attr(href url));
			}
			a.initial::before {
				content: target-text(attr(href), first-letter);
			}
		`;

		const transformed = plugin.transformStyles?.(css, {
			metadata: {},
			pagedjsCompatible: false,
		});

		expect(transformed).toContain("attr(data-target-page)");
		expect(transformed).toContain("attr(data-target-page-lower-roman)");
		expect(transformed).toContain("attr(data-target-page-upper-roman)");
		expect(transformed).toContain("attr(data-target-text)");
		expect(transformed).toContain("attr(data-target-text-first-letter)");
	});

	it("resolves target-counter and target-text on links during afterRender", () => {
		const plugin = countersPlugin();

		const link = {
			getAttribute: (k: string) => (k === "href" ? "#section2" : null),
			setAttribute: (k: string, v: string) => {
				attrs[k] = v;
			},
		};

		const attrs: Record<string, string> = {};

		const page2Props: Record<string, string> = {};

		const page2Attrs: Record<string, string> = {
			"data-page-number": "2",
			"data-page-formatted": "ii",
			"data-page": "preface",
		};

		const page2 = {
			getAttribute: (k: string) => page2Attrs[k] ?? null,
			setAttribute: (k: string, v: string) => {
				page2Attrs[k] = v;
			},
			style: {
				setProperty: (k: string, v: string) => {
					page2Props[k] = v;
				},
			},
		};

		const targetHeading = {
			textContent: "Section 2: Methodology",
			closest: () => page2,
		};

		const fakeDoc = {
			querySelectorAll: (sel: string) => {
				if (sel === "[href]") return [link];

				if (sel.includes("printedjs_page")) return [page2];

				return [];
			},
			querySelector: () => null,
			getElementById: (id: string) => (id === "section2" ? targetHeading : null),
			documentElement: {
				style: {
					setProperty: () => {},
				},
			},
		};

		plugin.afterRender?.({
			metadata: { document: fakeDoc as unknown as Document },
			pagedjsCompatible: false,
		});

		expect(attrs["data-target-page"]).toBe("ii");
		expect(attrs["data-target-page-formatted"]).toBe("ii");
		expect(attrs["data-target-page-lower-roman"]).toBe("ii");
		expect(attrs["data-target-page-upper-roman"]).toBe("II");
		expect(attrs["data-target-page-decimal"]).toBe("2");
		expect(attrs["data-target-page-decimal-leading-zero"]).toBe("02");
		expect(attrs["data-target-text"]).toBe("Section 2: Methodology");
		expect(attrs["data-target-text-first-letter"]).toBe("S");
		expect(page2Props["--printedjs-section-page-count"]).toBe("1");
	});
});
