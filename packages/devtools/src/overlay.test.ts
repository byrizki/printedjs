import { describe, expect, it, vi } from "vitest";
import { createDevtoolsOverlay } from "./overlay.js";
import type { TraceReport } from "./trace.js";

function createMockDoc(): Document {
	const elements = new Map<string, any>();

	const doc: any = {
		createElement: (tag: string) => {
			const attrs = new Map<string, string>();
			const listeners = new Map<string, any[]>();
			const children: any[] = [];
			const styleMap = new Map<string, string>();

			const el: any = {
				tagName: tag.toUpperCase(),
				id: "",
				parentNode: null,
				ownerDocument: doc,
				children,
				childNodes: children,
				textContent: "",
				innerHTML: "",
				style: {
					setProperty: (k: string, v: string) => styleMap.set(k, v),
					getPropertyValue: (k: string) => styleMap.get(k) ?? "",
				},
				setAttribute: (k: string, v: string) => {
					attrs.set(k, v);

					if (k === "id") {
						el.id = v;
					}
				},
				getAttribute: (k: string) => attrs.get(k) ?? null,
				hasAttribute: (k: string) => attrs.has(k),
				removeAttribute: (k: string) => attrs.delete(k),
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
				addEventListener: (evt: string, fn: any) => {
					if (!listeners.has(evt)) {
						listeners.set(evt, []);
					}

					listeners.get(evt)!.push(fn);
				},
				removeEventListener: (evt: string, fn: any) => {
					const arr = listeners.get(evt);

					if (arr) {
						const idx = arr.indexOf(fn);

						if (idx !== -1) {
							arr.splice(idx, 1);
						}
					}
				},
				dispatchEvent: (evt: any) => {
					const type = evt?.type ?? String(evt);
					const handlers = listeners.get(type) ?? [];

					for (const handler of handlers) {
						handler(evt);
					}

					return true;
				},
				querySelectorAll: () => [],
				querySelector: () => null,
				closest: () => null,
				getBoundingClientRect: () => ({
					top: 0,
					left: 0,
					width: 0,
					height: 0,
					bottom: 0,
					right: 0,
				}),
			};

			return el;
		},
		getElementById: (id: string) => elements.get(id) ?? null,
		head: {
			appendChild: (child: any) => {
				if (child.id) {
					elements.set(child.id, child);
				}

				child.parentNode = doc.head;

				return child;
			},
			removeChild: (child: any) => {
				if (child.id) {
					elements.delete(child.id);
				}

				child.parentNode = null;

				return child;
			},
		},
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

	doc.body = doc.createElement("body");
	doc.documentElement = doc.createElement("html");

	// SAFETY: mock doc satisfies Document API for overlay testing
	return doc as unknown as Document;
}

describe("DevtoolsOverlay", () => {
	it("initializes with backwards-compatible TraceReport argument", () => {
		const doc = createMockDoc();
		// SAFETY: mock element satisfies HTMLElement for container
		const container = doc.createElement("div") as unknown as HTMLElement;

		const mockReport: TraceReport = {
			startTime: 100,
			totalDurationMs: 142.5,
			pageCount: 3,
			events: [],
		};

		const overlay = createDevtoolsOverlay(container, mockReport);
		expect(overlay.element).toBeDefined();
		expect(overlay.element.getAttribute("data-printedjs-devtools-overlay")).toBe("true");
		expect(overlay.hoverInspector).toBeDefined();
		expect(overlay.pageGuides).toBeDefined();

		overlay.setInspectEnabled(true);
		expect(overlay.hoverInspector.isEnabled()).toBe(true);

		overlay.setGuidesEnabled(true);
		expect(overlay.pageGuides.isEnabled()).toBe(true);

		overlay.destroy();
		expect(overlay.element.parentNode).toBeNull();
	});

	it("initializes with DevtoolsOverlayOptions argument", () => {
		const doc = createMockDoc();
		// SAFETY: mock element satisfies HTMLElement for container
		const container = doc.createElement("div") as unknown as HTMLElement;

		const overlay = createDevtoolsOverlay(container, {
			inspectEnabled: true,
			guidesEnabled: true,
		});

		expect(overlay.hoverInspector.isEnabled()).toBe(true);
		expect(overlay.pageGuides.isEnabled()).toBe(true);

		overlay.setInspectEnabled(false);
		expect(overlay.hoverInspector.isEnabled()).toBe(false);

		overlay.setGuidesEnabled(false);
		expect(overlay.pageGuides.isEnabled()).toBe(false);

		overlay.destroy();
	});

	it("applies custom placement when configured", () => {
		const doc = createMockDoc();
		// SAFETY: mock element satisfies HTMLElement for container
		const container = doc.createElement("div") as unknown as HTMLElement;

		const overlay = createDevtoolsOverlay(container, {
			placement: "bottom-above-bar",
		});

		expect(overlay.element.style.bottom).toBe("84px");
		expect(overlay.element.style.right).toBe("20px");
		overlay.destroy();
	});

	it("applies bottom-center placement by default or when configured", () => {
		const doc = createMockDoc();
		// SAFETY: mock element satisfies HTMLElement for container
		const container = doc.createElement("div") as unknown as HTMLElement;

		const overlay = createDevtoolsOverlay(container, {
			placement: "bottom-center",
		});

		expect(overlay.element.style.bottom).toBe("24px");
		expect(overlay.element.style.left).toBe("50%");
		expect(overlay.element.style.transform).toBe("translateX(-50%)");
		overlay.destroy();
	});

	it("renders extraControls and onClose button when provided", () => {
		const doc = createMockDoc();
		// SAFETY: mock element satisfies HTMLElement for container
		const container = doc.createElement("div") as unknown as HTMLElement;
		// SAFETY: mock element satisfies HTMLElement for custom control
		const extra = doc.createElement("span") as unknown as HTMLElement;
		extra.textContent = "Custom Page Nav";

		let closed = false;

		const overlay = createDevtoolsOverlay(container, {
			extraControls: extra,
			onClose: () => {
				closed = true;
			},
		});

		expect(extra.parentNode).toBe(overlay.element);

		// SAFETY: mock element contains children array with attached buttons
		const children = (overlay.element as any).children as any[];

		const closeBtn = children.find(
			(c) => c.tagName === "BUTTON" && c.title?.includes("Exit DevTools"),
		);

		expect(closeBtn).toBeDefined();
		closeBtn?.dispatchEvent(new Event("click"));
		expect(closed).toBe(true);

		overlay.destroy();
	});

	it("mounts to options.mountTarget with absolute positioning when provided", () => {
		const doc = createMockDoc();
		// SAFETY: mock element satisfies HTMLElement for container
		const container = doc.createElement("div") as unknown as HTMLElement;
		// SAFETY: mock element satisfies HTMLElement for custom mount target
		const customMount = doc.createElement("div") as unknown as HTMLElement;

		const overlay = createDevtoolsOverlay(container, {
			mountTarget: customMount,
		});

		expect(overlay.element.parentNode).toBe(customMount);
		expect(overlay.element.style.position).toBe("absolute");

		overlay.destroy();
		expect(overlay.element.parentNode).toBeNull();
	});

	it("respects light and dark theme configuration and dynamic setTheme", () => {
		const doc = createMockDoc();
		// SAFETY: mock element satisfies HTMLElement for container
		const container = doc.createElement("div") as unknown as HTMLElement;

		const darkOverlay = createDevtoolsOverlay(container, {
			theme: "dark",
		});

		expect(darkOverlay.element.getAttribute("data-theme")).toBe("dark");
		expect(darkOverlay.element.style.backgroundColor).toContain("15, 23, 42");

		darkOverlay.setTheme("light");
		expect(darkOverlay.element.getAttribute("data-theme")).toBe("light");
		expect(darkOverlay.element.style.backgroundColor).toContain("255, 255, 255");
		darkOverlay.destroy();

		doc.documentElement.setAttribute("data-theme", "light");
		const autoOverlay = createDevtoolsOverlay(container);
		expect(autoOverlay.element.getAttribute("data-theme")).toBe("light");
		autoOverlay.destroy();
	});
});
