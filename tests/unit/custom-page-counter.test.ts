import { describe, expect, it } from "vitest";
import { createPageShell } from "../../packages/browser/src/dom/page-shell.js";
import {
	countersPlugin,
	formatPageNumber,
} from "../../packages/plugins/core/counters/src/plugin.js";

function createMockDoc() {
	const elements: unknown[] = [];

	return {
		createElement: () => {
			const el = {
				id: "",
				className: "",
				attributes: {} as Record<string, string>,
				style: {
					counterReset: "",
					properties: {} as Record<string, string>,
					setProperty(k: string, v: string) {
						this.properties[k] = v;
					},
					getPropertyValue(k: string) {
						return this.properties[k] || "";
					},
				},
				getAttribute(k: string) {
					return this.attributes[k] ?? null;
				},
				setAttribute(k: string, v: string) {
					this.attributes[k] = v;
				},
			};

			elements.push(el);

			return el as unknown as HTMLElement;
		},
	} as unknown as Document;
}

describe("Phase 17: Enhanced Page Counters & Custom Numbering", () => {
	it("formats integers to roman, alpha, and leading zero", () => {
		expect(formatPageNumber(4, "lower-roman")).toBe("iv");
		expect(formatPageNumber(9, "upper-roman")).toBe("IX");
		expect(formatPageNumber(3, "lower-alpha")).toBe("c");
		expect(formatPageNumber(7, "decimal-leading-zero")).toBe("07");
	});

	it("creates page shell with logical page number and counter-reset styles", () => {
		const doc = createMockDoc();

		const shell = createPageShell(4, doc, false, "chapter", {
			physicalPageNumber: 4,
			logicalPageNumber: 1,
			counterStyle: "decimal",
			counterFormatted: "1",
			counterReset: 1,
		});

		expect(shell.getAttribute("data-physical-page-number")).toBe("4");
		expect(shell.getAttribute("data-page-number")).toBe("1");
		expect(shell.getAttribute("data-page-style")).toBe("decimal");
		expect(shell.getAttribute("data-page-formatted")).toBe("1");
		expect(shell.getAttribute("data-counter-reset")).toBe("1");
		expect(shell.style.counterReset).toBe("page 0");
		expect(shell.style.getPropertyValue("--printedjs-page-number")).toBe("1");
	});

	it("creates page shell with roman numeral styling for frontmatter", () => {
		const doc = createMockDoc();

		const shell = createPageShell(2, doc, false, "preface", {
			physicalPageNumber: 2,
			logicalPageNumber: 2,
			counterStyle: "lower-roman",
			counterFormatted: "ii",
		});

		expect(shell.getAttribute("data-physical-page-number")).toBe("2");
		expect(shell.getAttribute("data-page-number")).toBe("2");
		expect(shell.getAttribute("data-page-style")).toBe("lower-roman");
		expect(shell.getAttribute("data-page-formatted")).toBe("ii");
	});

	it("preserves requested style in target-counter and formats cross references", () => {
		const plugin = countersPlugin();

		const css = `
			a[href="#preface"]::after { content: target-counter(attr(href), page, lower-roman); }
			a[href="#ch1"]::after { content: target-counter(attr(href), page); }
		`;

		const transformed = plugin.transformStyles?.(css, {
			metadata: {},
			pagedjsCompatible: false,
		});

		expect(transformed).toContain("attr(data-target-page-lower-roman)");
		expect(transformed).toContain("attr(data-target-page)");

		const linkPrefaceAttrs: Record<string, string> = { href: "#preface" };

		const linkPreface = {
			getAttribute: (k: string) => linkPrefaceAttrs[k] ?? null,
			setAttribute: (k: string, v: string) => {
				linkPrefaceAttrs[k] = v;
			},
		};

		const linkCh1Attrs: Record<string, string> = { href: "#ch1" };

		const linkCh1 = {
			getAttribute: (k: string) => linkCh1Attrs[k] ?? null,
			setAttribute: (k: string, v: string) => {
				linkCh1Attrs[k] = v;
			},
		};

		const pagePrefaceAttrs: Record<string, string> = {
			"data-page-number": "2",
			"data-page-formatted": "ii",
			"data-page": "preface",
		};

		const pagePrefaceProps: Record<string, string> = {};

		const pagePreface = {
			getAttribute: (k: string) => pagePrefaceAttrs[k] ?? null,
			setAttribute: (k: string, v: string) => {
				pagePrefaceAttrs[k] = v;
			},
			style: {
				setProperty: (k: string, v: string) => {
					pagePrefaceProps[k] = v;
				},
			},
		};

		const pageCh1Attrs: Record<string, string> = {
			"data-page-number": "1",
			"data-page-formatted": "1",
			"data-page": "chapter",
		};

		const pageCh1Props: Record<string, string> = {};

		const pageCh1 = {
			getAttribute: (k: string) => pageCh1Attrs[k] ?? null,
			setAttribute: (k: string, v: string) => {
				pageCh1Attrs[k] = v;
			},
			style: {
				setProperty: (k: string, v: string) => {
					pageCh1Props[k] = v;
				},
			},
		};

		const prefaceHeading = {
			textContent: "Preface",
			closest: () => pagePreface,
		};

		const ch1Heading = {
			textContent: "Chapter 1",
			closest: () => pageCh1,
		};

		const fakeDoc = {
			querySelectorAll: (sel: string) => {
				if (sel === "[href]") return [linkPreface, linkCh1];

				if (sel.includes("printedjs_page")) return [pagePreface, pageCh1];

				return [];
			},
			querySelector: () => null,
			getElementById: (id: string) => {
				if (id === "preface") return prefaceHeading;

				if (id === "ch1") return ch1Heading;

				return null;
			},
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

		expect(linkPrefaceAttrs["data-target-page-lower-roman"]).toBe("ii");
		expect(linkPrefaceAttrs["data-target-page-formatted"]).toBe("ii");
		expect(linkCh1Attrs["data-target-page"]).toBe("1");
		expect(linkCh1Attrs["data-target-page-lower-roman"]).toBe("i");

		expect(pagePrefaceProps["--printedjs-section-page-count"]).toBe("1");
		expect(pageCh1Props["--printedjs-section-page-count"]).toBe("1");
	});
});
