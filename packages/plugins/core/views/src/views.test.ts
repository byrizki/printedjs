import { describe, expect, it } from "vitest";
import { singlePageViewPlugin } from "./single-page/plugin.js";
import { spreadPageViewPlugin } from "./spread-page/plugin.js";
import { pageViewsPlugin, DomPageViewsController } from "./manager.js";
import type { PageViewsController, ViewModeAdapter } from "./types.js";

describe("Phase 18: Built-in Page View Plugins", () => {
	it("singlePageViewPlugin transforms styles and applies single view attribute", () => {
		const plugin = singlePageViewPlugin({ gap: "24px" });
		expect(plugin.name).toBe("single-page-view");

		const css = plugin.transformStyles?.("body { color: red; }", {
			metadata: {},
			pagedjsCompatible: false,
		});

		expect(css).toContain('[data-view-mode="single"]');
		expect(css).toContain("gap: 24px !important");
		expect(css).toContain("@media print");

		const containerAttrs: Record<string, string> = {};
		const fakeDoc = {
			querySelector: (sel: string) => {
				if (sel.includes("printedjs_pages")) {
					return {
						setAttribute: (k: string, v: string) => {
							containerAttrs[k] = v;
						},
					};
				}
				return null;
			},
		};

		plugin.afterRender?.({
			metadata: { document: fakeDoc as unknown as Document },
			pagedjsCompatible: false,
		});

		expect(containerAttrs["data-view-mode"]).toBe("single");
	});

	it("spreadPageViewPlugin sets grid spread styles and cover offset", () => {
		const plugin = spreadPageViewPlugin({ coverPage: true, spineShadow: true });
		expect(plugin.name).toBe("spread-page-view");

		const css = plugin.transformStyles?.("", {
			metadata: {},
			pagedjsCompatible: false,
		});

		expect(css).toContain('[data-view-mode="spread"]');
		expect(css).toContain("grid-template-columns: repeat(2, max-content) !important");
		expect(css).toContain("grid-column: 2 !important");
		expect(css).toContain("inset -15px 0 25px -10px");

		const containerAttrs: Record<string, string> = {};
		const fakeDoc = {
			querySelector: (sel: string) => {
				if (sel.includes("printedjs_pages")) {
					return {
						setAttribute: (k: string, v: string) => {
							containerAttrs[k] = v;
						},
					};
				}
				return null;
			},
		};

		plugin.afterRender?.({
			metadata: { document: fakeDoc as unknown as Document },
			pagedjsCompatible: false,
		});

		expect(containerAttrs["data-view-mode"]).toBe("spread");
	});

	it("pageViewsPlugin supports pluggable ViewModeAdapter", () => {
		let attached = false;
		let detached = false;
		const customController = { custom: true };

		const customAdapter: ViewModeAdapter = {
			mode: "custom-scroll",
			attach(container) {
				attached = true;
				(container as unknown as Record<string, unknown>).__custom = customController;
				return customController;
			},
			detach() {
				detached = true;
			},
			transformStyles(css) {
				return `${css}\n.custom-mode { display: flex; }`;
			},
		};

		const plugin = pageViewsPlugin({
			initialMode: "single",
			adapters: [customAdapter],
		});
		expect(plugin.name).toBe("page-views");

		const css = plugin.transformStyles?.("body {}", {
			metadata: {},
			pagedjsCompatible: false,
		});
		expect(css).toContain(".custom-mode { display: flex; }");

		const containerAttrs: Record<string, string> = {};
		const fakeContainer = {
			style: {} as CSSStyleDeclaration,
			classList: {
				add: () => {},
				remove: () => {},
				contains: () => false,
			},
			setAttribute: (k: string, v: string) => {
				containerAttrs[k] = v;
			},
			removeAttribute: (k: string) => {
				delete containerAttrs[k];
			},
			querySelectorAll: () => [],
			querySelector: () => null,
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => true,
		};

		const fakeDoc = {
			querySelector: (sel: string) => {
				if (sel.includes("printedjs_pages")) return fakeContainer;
				return null;
			},
		};

		const metadata: Record<string, unknown> = {
			document: fakeDoc as unknown as Document,
		};
		plugin.afterRender?.({ metadata, pagedjsCompatible: false });

		const controller = metadata["pageViews"] as PageViewsController;
		expect(controller).toBeDefined();

		controller.setMode("custom-scroll");
		expect(controller.currentMode).toBe("custom-scroll");
		expect(containerAttrs["data-view-mode"]).toBe("custom-scroll");
		expect(attached).toBe(true);
		expect(controller.getAdapterController("custom-scroll")).toBe(customController);

		controller.setMode("single");
		expect(detached).toBe(true);

		controller.destroy();
	});

	it("pageViewsPlugin manages switching between view modes", () => {
		const plugin = pageViewsPlugin({ initialMode: "single" });
		expect(plugin.name).toBe("page-views");

		const containerAttrs: Record<string, string> = {};
		const fakeContainer = {
			style: {} as CSSStyleDeclaration,
			classList: {
				add: () => {},
				remove: () => {},
				contains: () => false,
			},
			setAttribute: (k: string, v: string) => {
				containerAttrs[k] = v;
			},
			removeAttribute: (k: string) => {
				delete containerAttrs[k];
			},
			querySelectorAll: () => [],
			querySelector: () => null,
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => true,
		};

		const fakeDoc = {
			querySelector: (sel: string) => {
				if (sel.includes("printedjs_pages")) {
					return fakeContainer;
				}
				return null;
			},
		};

		const metadata: Record<string, unknown> = {
			document: fakeDoc as unknown as Document,
		};
		const context = {
			metadata,
			pagedjsCompatible: false,
		};

		plugin.afterRender?.(context);

		const controller = context.metadata["pageViews"] as PageViewsController;
		expect(controller).toBeDefined();
		expect(controller.currentMode).toBe("single");
		expect(containerAttrs["data-view-mode"]).toBe("single");

		controller.setMode("spread");
		expect(controller.currentMode).toBe("spread");
		expect(containerAttrs["data-view-mode"]).toBe("spread");

		controller.setMode("flipbook");
		expect(controller.currentMode).toBe("flipbook");
		expect(containerAttrs["data-view-mode"]).toBe("flipbook");

		controller.destroy();
	});

	it("DomPageViewsController manages active page state and emits page:change events", () => {
		const events: { type: string; detail: unknown }[] = [];
		const listeners = new Map<string, Set<(e: Event) => void>>();

		const fakeContainer = {
			style: {} as CSSStyleDeclaration,
			classList: {
				add: () => {},
				remove: () => {},
				contains: () => false,
			},
			setAttribute: () => {},
			removeAttribute: () => {},
			querySelectorAll: () => [],
			querySelector: () => null,
			addEventListener: (type: string, fn: (e: Event) => void) => {
				if (!listeners.has(type)) listeners.set(type, new Set());
				listeners.get(type)!.add(fn);
			},
			removeEventListener: (type: string, fn: (e: Event) => void) => {
				listeners.get(type)?.delete(fn);
			},
			dispatchEvent: (event: Event) => {
				const custom = event as CustomEvent;
				events.push({ type: custom.type, detail: custom.detail });
				const fns = listeners.get(event.type);
				if (fns) {
					for (const fn of fns) {
						fn(event);
					}
				}
				return true;
			},
		};

		const controller = new DomPageViewsController(
			fakeContainer as unknown as HTMLElement,
			{ initialMode: "single" },
		);

		expect(controller.currentPage).toBe(1);
		expect(controller.activePages).toEqual([1]);

		// Emit page change
		controller.emitPageChange({
			viewMode: "single",
			currentPage: 3,
			totalPages: 10,
			visiblePages: [3],
			leftPage: 3,
		});

		expect(controller.currentPage).toBe(3);
		expect(controller.activePages).toEqual([3]);

		const pageChangeEvents = events.filter((e) => e.type === "page:change");
		const viewsChangeEvents = events.filter((e) => e.type === "views:page-change");
		expect(pageChangeEvents.length).toBe(1);
		expect(viewsChangeEvents.length).toBe(1);
		expect(pageChangeEvents[0]?.detail).toMatchObject({
			viewMode: "single",
			currentPage: 3,
			totalPages: 10,
			visiblePages: [3],
		});

		// External event dispatched on container updates controller state
		fakeContainer.dispatchEvent(
			new CustomEvent("page:change", {
				detail: {
					viewMode: "spread",
					currentPage: 4,
					totalPages: 10,
					visiblePages: [4, 5],
					leftPage: 4,
					rightPage: 5,
				},
			}),
		);

		expect(controller.currentPage).toBe(4);
		expect(controller.activePages).toEqual([4, 5]);

		controller.destroy();
	});
});
