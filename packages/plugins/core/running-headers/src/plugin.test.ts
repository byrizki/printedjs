import { describe, expect, it } from "vitest";
import {
	transformMarginBoxCss,
	type RunningAssignment,
} from "@printedjs/plugin-generated-content";
import { runningHeadersPlugin } from "./plugin.js";

interface MockElement {
	nodeType: number;
	tagName: string;
	className: string;
	style: Record<string, string> & {
		setProperty: (k: string, v: string) => void;
		removeProperty: (k: string) => void;
		display?: string;
	};
	children: MockElement[];
	parentElement: MockElement | null;
	previousElementSibling: MockElement | null;
	attributes: Record<string, string>;
	classList: {
		contains: (cls: string) => boolean;
		add: (cls: string) => void;
		remove: (cls: string) => void;
	};
	textContent: string;
	setAttribute: (k: string, v: string) => void;
	getAttribute: (k: string) => string | null;
	hasAttribute: (k: string) => boolean;
	querySelectorAll: (sel: string) => MockElement[];
	querySelector: (sel: string) => MockElement | null;
	replaceChildren: (...nodes: MockElement[]) => void;
	cloneNode: (deep?: boolean) => MockElement;
}

function createMockElement(
	tagName: string,
	classes = "",
	text = "",
	attrs: Record<string, string> = {},
): MockElement {
	const classSet = new Set(classes.split(" ").filter(Boolean));
	const attributes: Record<string, string> = { ...attrs };
	const styles: Record<string, string> = {};

	const el: MockElement = {
		nodeType: 1,
		tagName: tagName.toUpperCase(),
		get className() {
			return Array.from(classSet).join(" ");
		},
		set className(val: string) {
			classSet.clear();
			val
				.split(" ")
				.filter(Boolean)
				.forEach((c) => classSet.add(c));
		},
		style: Object.assign(styles, {
			setProperty(k: string, v: string) {
				styles[k] = v;
			},
			removeProperty(k: string) {
				delete styles[k];
			},
		}),
		children: [],
		parentElement: null,
		previousElementSibling: null,
		attributes,
		classList: {
			contains: (cls: string) => classSet.has(cls),
			add: (cls: string) => {
				classSet.add(cls);
			},
			remove: (cls: string) => {
				classSet.delete(cls);
			},
		},
		textContent: text,
		setAttribute(k: string, v: string) {
			attributes[k] = v;
		},
		getAttribute(k: string) {
			return attributes[k] ?? null;
		},
		hasAttribute(k: string) {
			return k in attributes;
		},
		querySelectorAll(sel: string) {
			const results: MockElement[] = [];
			const traverse = (node: MockElement) => {
				for (const child of node.children) {
					if (
						sel.includes(child.className) ||
						(sel.includes("data-printedjs-running") &&
							child.hasAttribute("data-printedjs-running"))
					) {
						results.push(child);
					}
					traverse(child);
				}
			};
			traverse(this);
			return results;
		},
		querySelector(sel: string) {
			const all = this.querySelectorAll(sel);
			return all[0] ?? null;
		},
		replaceChildren(...nodes: MockElement[]) {
			this.children = [...nodes];
			this.textContent = nodes.map((n) => n.textContent).join("");
		},
		cloneNode(deep = true) {
			const cloned = createMockElement(
				this.tagName,
				this.className,
				this.textContent,
				this.attributes,
			);
			if (deep) {
				cloned.children = this.children.map((c) => c.cloneNode(true));
			}
			return cloned;
		},
	};

	return el;
}

describe("runningHeadersPlugin & transformMarginBoxCss", () => {
	it("parses position: running and element() with policies", () => {
		const css = `
			.chapter-title {
				position: running(chapterHeading);
			}
			@page {
				@top-center {
					content: element(chapterHeading, first-except);
				}
				@bottom-right {
					content: element(chapterHeading, last);
				}
			}
		`;

		const transformed = transformMarginBoxCss(css, false);
		expect(transformed.runningSelectors["chapterHeading"]).toBe(".chapter-title");
		expect(transformed.runningAssignments).toHaveLength(2);

		const topCenter = transformed.runningAssignments.find(
			(a: RunningAssignment) => a.boxName === "top-center",
		);
		expect(topCenter).toBeDefined();
		expect(topCenter?.runningName).toBe("chapterHeading");
		expect(topCenter?.policy).toBe("first-except");

		const bottomRight = transformed.runningAssignments.find(
			(a: RunningAssignment) => a.boxName === "bottom-right",
		);
		expect(bottomRight).toBeDefined();
		expect(bottomRight?.runningName).toBe("chapterHeading");
		expect(bottomRight?.policy).toBe("last");
	});

	it("populates running elements into margin boxes across pages", () => {
		const plugin = runningHeadersPlugin();
		const css = `
			.header-elem { position: running(hdr); }
			@page {
				@top-center { content: element(hdr); }
			}
		`;

		plugin.transformStyles?.(css, { metadata: {}, pagedjsCompatible: false });

		const contentRoot = createMockElement("div");
		const header1 = createMockElement("h1", "header-elem", "Chapter 1");
		contentRoot.children.push(header1);
		header1.parentElement = contentRoot;

		plugin.beforeLayout?.({
			metadata: { contentRoot },
			pagedjsCompatible: false,
		});

		expect(header1.getAttribute("data-printedjs-running")).toBe("hdr");
		expect(header1.style.display).toBe("none");

		// Page 1
		const page1 = createMockElement("div", "printedjs_page printedjs_first_page");
		const marginBox1 = createMockElement("div", "printedjs_margin-top-center");
		const marginContent1 = createMockElement("div", "printedjs_margin-content");
		marginBox1.children.push(marginContent1);
		page1.children.push(marginBox1);

		const h1Clone = createMockElement("h1", "header-elem", "Chapter 1", {
			"data-printedjs-running": "hdr",
		});
		page1.children.push(h1Clone);

		// Page 2 (no header-elem in flow)
		const page2 = createMockElement("div", "printedjs_page");
		const marginBox2 = createMockElement("div", "printedjs_margin-top-center");
		const marginContent2 = createMockElement("div", "printedjs_margin-content");
		marginBox2.children.push(marginContent2);
		page2.children.push(marginBox2);

		const fakeDoc = {
			querySelectorAll: (sel: string) => {
				if (sel.includes("printedjs_page")) {
					return [page1, page2];
				}
				return [];
			},
			querySelector: () => null,
		};

		plugin.afterRender?.({
			metadata: { contentRoot, document: fakeDoc as unknown as Document },
			pagedjsCompatible: false,
		});

		expect(marginContent1.textContent).toBe("Chapter 1");
		expect(marginBox1.classList.contains("hasContent")).toBe(true);

		// Page 2 inherited from Page 1
		expect(marginContent2.textContent).toBe("Chapter 1");
		expect(marginBox2.classList.contains("hasContent")).toBe(true);
	});
});
