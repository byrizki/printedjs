import { describe, expect, it } from "vitest";
import { extractPrintMetrics, generateElementSelector, pxToMm } from "./print-metrics.js";

describe("print-metrics", () => {
	describe("pxToMm", () => {
		it("converts 96px to 25.4mm", () => {
			expect(pxToMm(96)).toBe(25.4);
		});

		it("handles zero and negative or invalid values", () => {
			expect(pxToMm(0)).toBe(0);
			expect(pxToMm(Number.NaN)).toBe(0);
		});

		it("converts standard dimensions accurately", () => {
			expect(pxToMm(192)).toBe(50.8);
		});
	});

	describe("generateElementSelector", () => {
		it("generates tag only when no id or classes", () => {
			// SAFETY: test double for element tag name extraction
			const el = {
				tagName: "DIV",
				id: "",
				classList: [] as string[],
			} as unknown as HTMLElement;

			expect(generateElementSelector(el)).toBe("div");
		});

		it("includes id when present", () => {
			// SAFETY: test double for element id extraction
			const el = {
				tagName: "TABLE",
				id: "invoice-items",
				classList: ["items-table"],
			} as unknown as HTMLElement;

			expect(generateElementSelector(el)).toBe("table#invoice-items");
		});

		it("includes up to 3 non-internal classes when no id", () => {
			// SAFETY: test double for element class extraction
			const el = {
				tagName: "TR",
				id: "",
				classList: ["item-row", "active", "printedjs-ignore", "compact"],
			} as unknown as HTMLElement;

			expect(generateElementSelector(el)).toBe("tr.item-row.active.compact");
		});
	});

	describe("extractPrintMetrics", () => {
		it("returns null for detached element not inside a page", () => {
			// SAFETY: test double for detached element check
			const el = {
				hasAttribute: () => false,
				closest: () => null,
			} as unknown as HTMLElement;

			expect(extractPrintMetrics(el)).toBeNull();
		});

		it("returns null for devtools overlay elements", () => {
			// SAFETY: test double for overlay element check
			const el = {
				hasAttribute: (attr: string) => attr === "data-printedjs-devtools-overlay",
				closest: () => null,
			} as unknown as HTMLElement;

			expect(extractPrintMetrics(el)).toBeNull();
		});

		it("extracts metrics when element is inside a page", () => {
			const mockPage = {
				getAttribute: (name: string) => (name === "data-page-number" ? "2" : null),
				querySelector: () => ({
					getBoundingClientRect: () => ({ bottom: 800 }),
				}),
			};

			const mockDoc = {
				querySelectorAll: () => [{}, mockPage, {}],
				defaultView: {
					getComputedStyle: () => ({
						getPropertyValue: (prop: string) => {
							switch (prop) {
								case "margin-top":
									return "10px";
								case "margin-right":
									return "10px";
								case "margin-bottom":
									return "10px";
								case "margin-left":
									return "10px";
								case "padding-top":
									return "5px";
								case "padding-right":
									return "5px";
								case "padding-bottom":
									return "5px";
								case "padding-left":
									return "5px";
								case "border-topWidth":
									return "1px";
								case "border-rightWidth":
									return "1px";
								case "border-bottomWidth":
									return "1px";
								case "border-leftWidth":
									return "1px";
								case "break-inside":
									return "avoid";
								default:
									return "";
							}
						},
					}),
				},
			};

			const mockElement = {
				tagName: "DIV",
				id: "coverage-card",
				classList: ["coverage-card", "selected"],
				ownerDocument: mockDoc,
				hasAttribute: (name: string) => name === "data-split-to",
				getAttribute: (name: string) => {
					if (name === "data-break-inside") {
						return "avoid";
					}

					return null;
				},
				closest: (selector: string) => {
					if (selector.includes("devtools-overlay")) {
						return null;
					}

					if (selector.includes("printedjs_page")) {
						return mockPage;
					}

					return null;
				},
				getBoundingClientRect: () => ({
					top: 100,
					left: 50,
					width: 400,
					height: 200,
					bottom: 300,
					right: 450,
				}),
				// SAFETY: mock satisfies HTMLElement shape for extractPrintMetrics
			} as unknown as HTMLElement;

			const metrics = extractPrintMetrics(mockElement);
			expect(metrics).not.toBeNull();
			expect(metrics?.selector).toBe("div#coverage-card");
			expect(metrics?.pageNumber).toBe(2);
			expect(metrics?.totalPages).toBe(3);
			expect(metrics?.breakRules.hasAvoidBreak).toBe(true);
			expect(metrics?.breakRules.isSplitTo).toBe(true);
			expect(metrics?.breakRules.isSplitFrom).toBe(false);
			expect(metrics?.boxModel.margin.top).toBe(10);
			expect(metrics?.boxModel.padding.top).toBe(5);
			expect(metrics?.boxModel.border.top).toBe(1);
			expect(metrics?.boxModel.content.widthPx).toBe(400 - 12); // width - (border + padding)
			expect(metrics?.boxModel.content.heightPx).toBe(200 - 12);
			expect(metrics?.remainingSpacePx).toBe(500); // 800 - 300
			expect(metrics?.remainingSpaceMm).toBe(pxToMm(500));
		});
	});
});
