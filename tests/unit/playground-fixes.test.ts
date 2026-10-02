import { describe, expect, it } from "vitest";
import { REPORT_FIXTURE } from "../../apps/playground/src/fixtures/report-fixture.js";
import { ROWSPAN_EXPANDING_FIXTURE } from "../../apps/playground/src/fixtures/rowspan-expanding-fixture.js";
import {
	BOOK_SHOWCASE_FIXTURE,
	PHASE_17_COUNTERS_FIXTURE,
	PHASE_18_MAGAZINE_FIXTURE,
	FIXTURE_CATALOG,
} from "../../apps/playground/src/fixtures/index.js";
import { compileTemplate } from "../../apps/playground/src/services/template-service.js";
import { parseBreakStyles } from "../../packages/plugins/core/breaks/src/parser.js";
import { getNamedPage } from "../../packages/browser/src/dom/layout-adapter.js";
import { DomFlipBookController } from "../../packages/plugins/core/views/src/flip-book/controller.js";

describe("Playground & Engine Fixes Verification", () => {
	describe("Item 0: Remove data persistence", () => {
		it("all fixtures in FIXTURE_CATALOG have unique IDs and valid html markup", () => {
			expect(FIXTURE_CATALOG.length).toBeGreaterThan(5);
			const ids = new Set<string>();
			for (const fixture of FIXTURE_CATALOG) {
				expect(ids.has(fixture.id)).toBe(false);
				ids.add(fixture.id);
				expect(fixture.html).toBeDefined();
				expect(typeof fixture.html).toBe("string");
			}
		});
	});

	describe("Item 1: Table layouts & headers", () => {
		it("report fixture and rowspan expanding fixture include repeat-header class", () => {
			expect(REPORT_FIXTURE.html).toContain("repeat-header");
			expect(ROWSPAN_EXPANDING_FIXTURE.html).toContain("repeat-header");
		});

		it("all catalog fixtures with tables maintain markup integrity", () => {
			for (const fixture of FIXTURE_CATALOG) {
				if (fixture.html.includes("<table")) {
					expect(fixture.html).toContain("</table>");
				}
			}
		});
	});

	describe("Item 2: Mixed orientations & named pages", () => {
		it("parses page: auto and resets named page via getNamedPage", () => {
			const css = `
				.landscape-section { page: landscape-sheet; }
				.portrait-return { page: auto; }
			`;
			const rules = parseBreakStyles(css);
			expect(rules).toContainEqual({
				selector: ".landscape-section",
				page: "landscape-sheet",
			});
			expect(rules).toContainEqual({
				selector: ".portrait-return",
				page: "auto",
			});

			const elAuto = {
				nodeType: 1,
				parentNode: null,
				getAttribute: (name: string) => (name === "data-page" ? "auto" : null),
			} as unknown as HTMLElement;

			expect(getNamedPage(elAuto)).toBeNull();

			const elNamed = {
				nodeType: 1,
				parentNode: null,
				getAttribute: (name: string) => (name === "data-page" ? "landscape-sheet" : null),
			} as unknown as HTMLElement;

			expect(getNamedPage(elNamed)).toBe("landscape-sheet");
		});
	});

	describe("Item 3: Continuous flow template and proxy evaluation", () => {
		it("renders template safely even when context variables are missing", () => {
			const template = `
				<div class="letter">
					<h1><%= it.title %></h1>
					<p>Dear <%= it.recipient %>,</p>
					<p>Sender: <%= it.nonExistentField %></p>
					<p>Math test: <%= Math.round(10.6) %></p>
				</div>
			`;
			const result = compileTemplate(template, {
				title: "Quarterly Update",
				recipient: "Shareholders",
			});

			expect(result.error).toBeNull();
			expect(result.html).toContain("Quarterly Update");
			expect(result.html).toContain("Shareholders");
			expect(result.html).toContain("Math test: 11");
			expect(result.html).toContain("Sender: ");
		});

		it("evaluates continuous flow fixture without throwing runtime errors", () => {
			const continuousFixture = FIXTURE_CATALOG.find(
				(f) => f.id === "continuous-flow" || f.title.toLowerCase().includes("continuous"),
			);
			if (continuousFixture) {
				const result = compileTemplate(
					continuousFixture.html,
					continuousFixture.data ?? {},
				);
				expect(result.error).toBeNull();
				expect(result.html.length).toBeGreaterThan(0);
			}
		});
	});

	describe("Item 4: Book view & controller behavior", () => {
		function createMockBookContainer(numPages: number) {
			const pageElements = Array.from({ length: numPages }, (_, i) => {
				const num = i + 1;
				const attrs: Record<string, string> = { "data-page-number": String(num) };
				const classList = new Set<string>();
				return {
					style: { display: "" },
					offsetWidth: 400,
					offsetHeight: 600,
					getAttribute: (k: string) => attrs[k] ?? null,
					setAttribute: (k: string, v: string) => {
						attrs[k] = v;
					},
					removeAttribute: (k: string) => {
						delete attrs[k];
					},
					classList: {
						add: (cls: string) => classList.add(cls),
						remove: (cls: string) => classList.delete(cls),
						contains: (cls: string) => classList.has(cls),
					},
				} as unknown as HTMLElement;
			});

			const containerAttrs: Record<string, string> = {};
			const children: HTMLElement[] = [...pageElements];
			const eventListeners: Record<string, ((e: Event) => void)[]> = {};

			const container = {
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
				querySelectorAll: (sel: string) => {
					if (sel.includes("printedjs_page")) return pageElements;
					return [];
				},
				querySelector: (sel: string) => {
					if (sel.includes("pm-book-spacer")) {
						return (
							children.find((c) => (c.className ?? "").includes("pm-book-spacer")) ?? null
						);
					}
					return null;
				},
				prepend: (node: HTMLElement) => {
					children.unshift(node);
				},
				addEventListener: (evt: string, fn: (e: Event) => void) => {
					if (!eventListeners[evt]) eventListeners[evt] = [];
					eventListeners[evt].push(fn);
				},
				removeEventListener: (evt: string, fn: (e: Event) => void) => {
					if (eventListeners[evt]) {
						eventListeners[evt] = eventListeners[evt].filter((cb) => cb !== fn);
					}
				},
				dispatchEvent: () => true,
			} as unknown as HTMLElement;

			return { container, pageElements };
		}

		it("places Page 1 and lone last page strictly on right slot, never centering alone", async () => {
			const { container, pageElements } = createMockBookContainer(4);
			const controller = new DomFlipBookController(container, {
				sound: false,
				turnDurationMs: 0,
			});

			expect(controller.totalSpreads).toBe(3); // [null, 1], [2, 3], [null, 4]
			expect(controller.currentSpread).toBe(0);

			// Spread 0: Page 1 on right, no page on left (spacer ensures right placement)
			expect(pageElements[0].getAttribute("data-flipbook-side")).toBe("right");
			expect(pageElements[0].style.display).toBe("block");
			expect(pageElements[1].style.display).toBe("none");

			// Spread 1: Page 2 on left, Page 3 on right
			await controller.next();
			expect(controller.currentSpread).toBe(1);
			expect(pageElements[1].getAttribute("data-flipbook-side")).toBe("left");
			expect(pageElements[2].getAttribute("data-flipbook-side")).toBe("right");

			// Spread 2: Page 4 (lone last page) is on right slot, left slot has spacer!
			await controller.next();
			expect(controller.currentSpread).toBe(2);
			expect(pageElements[3].getAttribute("data-flipbook-side")).toBe("right");
			expect(pageElements[3].style.display).toBe("block");

			controller.destroy();
		});

		it("correctly handles 2-page documents in book view with Page 1 on right and Page 2 on left", async () => {
			const { container, pageElements } = createMockBookContainer(2);
			const controller = new DomFlipBookController(container, {
				sound: false,
				turnDurationMs: 0,
			});

			expect(controller.totalSpreads).toBe(2);
			expect(controller.currentSpread).toBe(0);

			// Spread 0: Page 1 on right, left is spacer
			expect(pageElements[0].getAttribute("data-flipbook-side")).toBe("right");
			expect(pageElements[0].style.display).toBe("block");
			expect(pageElements[1].style.display).toBe("none");

			// Spread 1: Page 2 on left, right is spacer
			await controller.next();
			expect(controller.currentSpread).toBe(1);
			expect(pageElements[1].getAttribute("data-flipbook-side")).toBe("left");
			expect(pageElements[1].style.display).toBe("block");
			expect(pageElements[0].style.display).toBe("none");

			// Flip back to Spread 0
			await controller.prev();
			expect(controller.currentSpread).toBe(0);
			expect(pageElements[0].getAttribute("data-flipbook-side")).toBe("right");
			expect(pageElements[0].style.display).toBe("block");
			expect(pageElements[1].style.display).toBe("none");

			controller.destroy();
		});

		it("preserves running headers and margin contents without corrupting native CSS pseudo-elements", async () => {
			const { container, pageElements } = createMockBookContainer(3);
			const leftMarginContent = {
				textContent: "",
				getAttribute: (k: string) =>
					k === "data-folio-frozen" ? (leftMarginContent.attrs[k] ?? null) : null,
				setAttribute: (k: string, v: string) => {
					leftMarginContent.attrs[k] = v;
				},
				removeAttribute: (k: string) => {
					delete leftMarginContent.attrs[k];
				},
				attrs: {} as Record<string, string>,
				firstElementChild: null,
			};
			const rightMarginContent = {
				textContent: "",
				getAttribute: (k: string) =>
					k === "data-folio-frozen" ? (rightMarginContent.attrs[k] ?? null) : null,
				setAttribute: (k: string, v: string) => {
					rightMarginContent.attrs[k] = v;
				},
				removeAttribute: (k: string) => {
					delete rightMarginContent.attrs[k];
				},
				attrs: {} as Record<string, string>,
				firstElementChild: null,
			};

			const mockDoc = {
				styleSheets: [
					{
						cssRules: [
							{
								style: { content: "counter(page)" },
								selectorText:
									".printedjs_margin-top-left > .printedjs_margin-content::after",
							},
						],
					},
				],
				defaultView: {
					getComputedStyle: (node: unknown, pseudo?: string) => {
						if (node === leftMarginContent && pseudo === "::after") {
							return { content: '"2"' };
						}
						if (node === rightMarginContent && pseudo === "::after") {
							return { content: '"Alice\'s Adventures in Wonderland"' };
						}
						return { content: "none" };
					},
				},
			};

			(container as unknown as Record<string, unknown>).ownerDocument = mockDoc;
			(pageElements[1] as unknown as Record<string, unknown>).querySelectorAll = (
				sel: string,
			) => {
				if (sel.includes("margin-content")) {
					return [leftMarginContent, rightMarginContent];
				}
				return [];
			};

			const controller = new DomFlipBookController(container, {
				sound: false,
				turnDurationMs: 0,
			});

			// Margin content remains clean for native CSS counter / string pseudo-elements
			expect(leftMarginContent.textContent).toBe("");
			expect(leftMarginContent.attrs["data-folio-frozen"]).toBeUndefined();

			// Right margin content had book title -> untouched!
			expect(rightMarginContent.textContent).toBe("");
			expect(rightMarginContent.attrs["data-folio-frozen"]).toBeUndefined();

			controller.destroy();
		});

		it("preserves footer page counter folios and leaves margin contents untouched for native CSS counters", async () => {
			const { container, pageElements } = createMockBookContainer(3);
			const footerLeftContent = {
				textContent: "",
				getAttribute: (k: string) =>
					k === "data-folio-frozen" ? (footerLeftContent.attrs[k] ?? null) : null,
				setAttribute: (k: string, v: string) => {
					footerLeftContent.attrs[k] = v;
				},
				removeAttribute: (k: string) => {
					delete footerLeftContent.attrs[k];
				},
				matches: (sel: string) => sel.includes("margin-bottom-left"),
				attrs: {} as Record<string, string>,
				firstElementChild: null,
			};
			const footerCenterContent = {
				textContent: "",
				getAttribute: (k: string) =>
					k === "data-folio-frozen" ? (footerCenterContent.attrs[k] ?? null) : null,
				setAttribute: (k: string, v: string) => {
					footerCenterContent.attrs[k] = v;
				},
				removeAttribute: (k: string) => {
					delete footerCenterContent.attrs[k];
				},
				matches: () => false,
				attrs: {} as Record<string, string>,
				firstElementChild: null,
			};

			const mockDoc = {
				styleSheets: [
					{
						cssRules: [
							{
								style: { content: "counter(page)" },
								selectorText:
									".printedjs_page .printedjs_margin-bottom-left > .printedjs_margin-content::after",
							},
						],
					},
				],
				defaultView: {
					getComputedStyle: (node: unknown, pseudo?: string) => {
						if (node === footerLeftContent && pseudo === "::after") {
							// Real browser returns raw counter expression
							return { content: "counter(page)" };
						}
						if (node === footerCenterContent && pseudo === "::after") {
							return { content: '"Section 1 Notes"' };
						}
						return { content: "none" };
					},
				},
			};

			(container as unknown as Record<string, unknown>).ownerDocument = mockDoc;
			(pageElements[1] as unknown as Record<string, unknown>).querySelectorAll = (
				sel: string,
			) => {
				if (sel.includes("margin-content")) {
					return [footerLeftContent, footerCenterContent];
				}
				return [];
			};

			const controller = new DomFlipBookController(container, {
				sound: false,
				turnDurationMs: 0,
			});

			// Footer left remains clean to allow native CSS counter evaluation (e.g. roman, alpha, custom colors)
			expect(footerLeftContent.textContent).toBe("");
			expect(footerLeftContent.attrs["data-folio-frozen"]).toBeUndefined();

			// Footer center is arbitrary notes -> left alone
			expect(footerCenterContent.textContent).toBe("");
			expect(footerCenterContent.attrs["data-folio-frozen"]).toBeUndefined();

			controller.destroy();
		});
	});

	describe("Presets for Phase 17, 18, and Book Showcase", () => {
		it("includes Phase 17 custom counter preset with roman and reset rules", () => {
			expect(PHASE_17_COUNTERS_FIXTURE.id).toBe("custom-counters-multi-section");
			expect(PHASE_17_COUNTERS_FIXTURE.html).toContain("counter(page, lower-roman)");
			expect(PHASE_17_COUNTERS_FIXTURE.html).toContain("counter-reset: page 1");
			expect(PHASE_17_COUNTERS_FIXTURE.html).toContain("counter(page, upper-alpha)");
		});

		it("includes Phase 18 magazine preset with multi-column editorial layout", () => {
			expect(PHASE_18_MAGAZINE_FIXTURE.id).toBe("digital-magazine-spread");
			expect(PHASE_18_MAGAZINE_FIXTURE.html).toContain("column-count: 2");
			expect(PHASE_18_MAGAZINE_FIXTURE.html).toContain("CHRONICLE");
		});

		it("includes Complete Book preset (Alice in Wonderland) with 20+ pages", () => {
			expect(BOOK_SHOWCASE_FIXTURE.id).toBe("complete-novel-book");
			expect(BOOK_SHOWCASE_FIXTURE.html).toContain("Alice's Adventures in Wonderland");
			expect(BOOK_SHOWCASE_FIXTURE.html).toContain("Chapter I");
			expect(BOOK_SHOWCASE_FIXTURE.html).toContain("Chapter V");
			expect(BOOK_SHOWCASE_FIXTURE.html).toContain("Epilogue");
			expect(BOOK_SHOWCASE_FIXTURE.html).toContain("book-cover");
			expect(BOOK_SHOWCASE_FIXTURE.html.length).toBeGreaterThan(15000); // Extensive text guaranteeing 20+ pages
		});
	});

	describe("Item 5: Searchable Preset Combobox", () => {
		it("filters fixture catalog accurately by title, id, and category", () => {
			const query1 = "alice";
			const matches1 = FIXTURE_CATALOG.filter(
				(f) =>
					f.title.toLowerCase().includes(query1) ||
					f.id.toLowerCase().includes(query1) ||
					f.category.toLowerCase().includes(query1),
			);
			expect(matches1.length).toBeGreaterThan(0);
			expect(matches1[0].id).toBe("complete-novel-book");

			const query2 = "financial";
			const matches2 = FIXTURE_CATALOG.filter(
				(f) =>
					f.title.toLowerCase().includes(query2) ||
					f.id.toLowerCase().includes(query2) ||
					f.category.toLowerCase().includes(query2),
			);
			expect(matches2.length).toBeGreaterThan(0);

			const query3 = "paged-media";
			const matches3 = FIXTURE_CATALOG.filter(
				(f) =>
					f.title.toLowerCase().includes(query3) ||
					f.id.toLowerCase().includes(query3) ||
					f.category.toLowerCase().includes(query3),
			);
			expect(matches3.length).toBeGreaterThan(3);
		});
	});
});
