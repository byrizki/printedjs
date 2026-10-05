import { describe, expect, it } from "vitest";
import { createPageGuides } from "./page-guides.js";
import { GUIDE_STYLES_ID } from "./guide-styles.js";

interface MockDocElement {
	tagName: string;
	id: string;
	textContent: string;
	parentNode: unknown;
}

function createMockDoc(): Document {
	const elements = new Map<string, MockDocElement>();

	const doc = {
		createElement: (tag: string): MockDocElement => {
			const el: MockDocElement = {
				tagName: tag.toUpperCase(),
				id: "",
				textContent: "",
				parentNode: null,
			};

			return el;
		},
		getElementById: (id: string): MockDocElement | null => elements.get(id) ?? null,
		head: {
			appendChild: (child: MockDocElement): MockDocElement => {
				if (child.id) {
					elements.set(child.id, child);
				}

				child.parentNode = doc.head;

				return child;
			},
			removeChild: (child: MockDocElement): MockDocElement => {
				if (child.id) {
					elements.delete(child.id);
				}

				child.parentNode = null;

				return child;
			},
		},
		documentElement: {
			setAttribute: (_k: string, _v: string): void => {},
			removeAttribute: (_k: string): void => {},
		},
	};

	// SAFETY: mock doc satisfies Document API used by createPageGuides
	return doc as unknown as Document;
}

describe("PageGuides", () => {
	it("injects guide styles and toggles data-printedjs-guides attribute", () => {
		const doc = createMockDoc();
		const attrs = new Map<string, string>();

		const container = {
			ownerDocument: doc,
			setAttribute: (k: string, v: string): void => {
				attrs.set(k, v);
			},
			removeAttribute: (k: string): void => {
				attrs.delete(k);
			},
			// SAFETY: mock container satisfies HTMLElement shape for page guides
		} as unknown as HTMLElement;

		const guides = createPageGuides(container, false);
		expect(guides.isEnabled()).toBe(false);
		expect(doc.getElementById(GUIDE_STYLES_ID)).toBeDefined();

		guides.enable();
		expect(guides.isEnabled()).toBe(true);
		expect(attrs.get("data-printedjs-guides")).toBe("true");

		guides.disable();
		expect(guides.isEnabled()).toBe(false);
		expect(attrs.has("data-printedjs-guides")).toBe(false);

		guides.destroy();
		expect(doc.getElementById(GUIDE_STYLES_ID)).toBeNull();
	});
});
