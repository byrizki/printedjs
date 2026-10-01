import { describe, expect, it } from "vitest";
import { singlePageViewPlugin } from "./single-page/plugin.js";
import { spreadPageViewPlugin } from "./spread-page/plugin.js";
import { flipBookViewPlugin } from "./flip-book/plugin.js";
import { pageViewsPlugin } from "./manager.js";
import type { FlipBookController, PageViewsController } from "./types.js";

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

	it("flipBookViewPlugin initializes controller and navigates spreads", async () => {
		const plugin = flipBookViewPlugin({ sound: false, turnDurationMs: 10 });
		expect(plugin.name).toBe("flip-book-view");

		const css = plugin.transformStyles?.("", {
			metadata: {},
			pagedjsCompatible: false,
		});

		expect(css).toContain('[data-view-mode="flipbook"]');
		expect(css).toContain("perspective: 2500px !important");
		expect(css).toContain("transform-style: preserve-3d !important");
		expect(css).toContain(":not(.stf__parent)");
		expect(css).toContain(".stf__parent .stf__item");
		expect(css).toContain("padding-bottom: 0 !important");

		const pages = [1, 2, 3, 4].map((n) => {
			const attrs: Record<string, string> = { "data-page-number": String(n) };
			return {
				style: { display: "" },
				getAttribute: (k: string) => attrs[k] ?? null,
				setAttribute: (k: string, v: string) => {
					attrs[k] = v;
				},
				removeAttribute: (k: string) => {
					delete attrs[k];
				},
				closest: () => null,
			};
		});

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
			querySelectorAll: () => pages,
			querySelector: () => null,
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => true,
			parentNode: {},
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

		const controller = context.metadata["flipBook"] as FlipBookController;
		expect(controller).toBeDefined();
		expect(controller.currentSpread).toBe(0);
		expect(controller.currentPage).toBe(1);
		expect(controller.totalSpreads).toBe(3); // 4 pages -> spreads: [null, 1], [2, 3], [4, null]

		await controller.next();
		expect(controller.currentSpread).toBe(1);
		expect(controller.currentPage).toBe(2);

		await controller.prev();
		expect(controller.currentSpread).toBe(0);
		expect(controller.currentPage).toBe(1);

		controller.destroy();
		expect(fakeContainer.parentNode).toBeTruthy();
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
});
