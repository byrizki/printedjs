import { describe, expect, it, vi } from "vitest";
import { createBoxModelOverlay } from "./box-model-overlay.js";
import { createInspectorTooltip } from "./tooltip.js";
import { createHoverInspector } from "./hover-inspector.js";
import type { ElementPrintMetrics } from "../types.js";

function createMockElement(tag: string, ownerDoc: Document): any {
	const styleMap = new Map<string, string>();
	const children: any[] = [];
	let parentNode: any = null;

	const el: any = {
		tagName: tag.toUpperCase(),
		nodeType: 1,
		ownerDocument: ownerDoc,
		id: "",
		classList: {
			contains: () => false,
			[Symbol.iterator]: function* () {},
		},
		style: {
			setProperty: (k: string, v: string) => styleMap.set(k, v),
			getPropertyValue: (k: string) => styleMap.get(k) ?? "",
			get left() {
				return styleMap.get("left") ?? "";
			},
			set left(v: string) {
				styleMap.set("left", v);
			},
			get top() {
				return styleMap.get("top") ?? "";
			},
			set top(v: string) {
				styleMap.set("top", v);
			},
			get width() {
				return styleMap.get("width") ?? "";
			},
			set width(v: string) {
				styleMap.set("width", v);
			},
			get height() {
				return styleMap.get("height") ?? "";
			},
			set height(v: string) {
				styleMap.set("height", v);
			},
			get display() {
				return styleMap.get("display") ?? "";
			},
			set display(v: string) {
				styleMap.set("display", v);
			},
		},
		attributes: new Map<string, string>(),
		setAttribute: (k: string, v: string) => el.attributes.set(k, v),
		getAttribute: (k: string) => el.attributes.get(k) ?? null,
		hasAttribute: (k: string) => el.attributes.has(k),
		appendChild: (child: any) => {
			children.push(child);
			child.parentNode = el;

			return child;
		},
		removeChild: (child: any) => {
			const idx = children.indexOf(child);

			if (idx !== -1) {
				children.splice(idx, 1);
				child.parentNode = null;
			}

			return child;
		},
		get parentNode() {
			return parentNode;
		},
		set parentNode(p: any) {
			parentNode = p;
		},
		getBoundingClientRect: () => ({
			top: 100,
			left: 50,
			width: 200,
			height: 80,
			bottom: 180,
			right: 250,
		}),
		querySelectorAll: () => [],
	};

	return el;
}

function createMockDocument(): Document {
	const doc: any = {
		createElement: (tag: string) => createMockElement(tag, doc),
		body: null,
		documentElement: null,
		defaultView: {
			scrollX: 0,
			scrollY: 0,
			innerWidth: 1024,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		},
	};

	doc.body = createMockElement("body", doc);
	doc.documentElement = createMockElement("html", doc);

	// SAFETY: mock doc satisfies Document interface for inspector tests
	return doc as unknown as Document;
}

const sampleMetrics: ElementPrintMetrics = {
	selector: "div#sample.card",
	tagName: "div",
	id: "sample",
	classes: ["card"],
	pageNumber: 1,
	totalPages: 3,
	boxModel: {
		margin: { top: 10, right: 10, bottom: 10, left: 10 },
		border: { top: 2, right: 2, bottom: 2, left: 2 },
		padding: { top: 8, right: 8, bottom: 8, left: 8 },
		content: { widthPx: 160, heightPx: 40, widthMm: 42.3, heightMm: 10.6 },
		clientRect: { top: 100, left: 50, width: 200, height: 80 },
	},
	breakRules: {
		breakInside: "avoid",
		breakBefore: "auto",
		breakAfter: "auto",
		isSplitTo: true,
		isSplitFrom: false,
		hasAvoidBreak: true,
	},
	remainingSpacePx: 320,
	remainingSpaceMm: 84.7,
};

describe("BoxModelOverlay", () => {
	it("creates and attaches overlay to target document", () => {
		const doc = createMockDocument();
		const overlay = createBoxModelOverlay(doc);

		expect(overlay.element).toBeDefined();
		expect(overlay.element.getAttribute("data-printedjs-devtools-highlight")).toBe(
			"true",
		);
		expect(overlay.element.style.display).toBe("none");

		// SAFETY: mock element satisfies HTMLElement for overlay target
		const target = createMockElement("div", doc) as unknown as HTMLElement;
		overlay.update(sampleMetrics, target);

		expect(overlay.element.style.display).toBe("block");
		expect(overlay.element.style.width).toBe(`${200 + 20}px`);
		expect(overlay.element.style.height).toBe(`${80 + 20}px`);

		overlay.hide();
		expect(overlay.element.style.display).toBe("none");

		overlay.destroy();
		expect(overlay.element.parentNode).toBeNull();
	});
});

describe("InspectorTooltip", () => {
	it("renders metrics, dimensions, badges, and flips placement if needed", () => {
		const doc = createMockDocument();
		const tooltip = createInspectorTooltip(doc);

		expect(tooltip.element).toBeDefined();
		expect(tooltip.element.getAttribute("data-printedjs-devtools-tooltip")).toBe("true");

		// SAFETY: mock element satisfies HTMLElement for tooltip target
		const target = createMockElement("div", doc) as unknown as HTMLElement;
		tooltip.show(sampleMetrics, target);

		expect(tooltip.element.style.display).toBe("block");
		expect(tooltip.element.innerHTML).toContain("div#sample.card");
		expect(tooltip.element.innerHTML).toContain("Page 1/3");
		expect(tooltip.element.innerHTML).toContain("avoid-break");
		expect(tooltip.element.innerHTML).toContain("splits ➔");
		expect(tooltip.element.innerHTML).toContain("Clearance:");

		tooltip.hide();
		expect(tooltip.element.style.display).toBe("none");

		tooltip.destroy();
		expect(tooltip.element.parentNode).toBeNull();
	});
});

describe("HoverInspector", () => {
	it("controls enable/disable state and cleans up listeners on destroy", () => {
		const doc = createMockDocument();
		// SAFETY: mock element satisfies HTMLElement for container
		const container = createMockElement("div", doc) as unknown as HTMLElement;
		container.addEventListener = vi.fn();
		container.removeEventListener = vi.fn();

		const inspector = createHoverInspector(container, { enabled: false });
		expect(inspector.isEnabled()).toBe(false);

		inspector.enable();
		expect(inspector.isEnabled()).toBe(true);

		inspector.disable();
		expect(inspector.isEnabled()).toBe(false);

		inspector.destroy();
		expect(container.removeEventListener).toHaveBeenCalled();
	});
});
