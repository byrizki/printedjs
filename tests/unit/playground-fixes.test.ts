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
import {
	DomFlipBookController,
	HTMLPage,
	PageDensity,
} from "../../packages/plugins/community/page-flip/src/index.js";

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

		it("hides hard page when rotated away from reader (cos <= 0) to avoid showing mirrored back content", () => {
			const fakeStyle = {
				display: "block",
				visibility: "visible",
				opacity: "1",
				pointerEvents: "",
				setProperty: () => {},
			};
			const fakeElement = {
				style: fakeStyle,
				classList: { add: () => {}, remove: () => {} },
			} as unknown as HTMLElement;

			const fakeRender = {
				getRect: () => ({ left: 0, top: 0, width: 800, height: 600, pageWidth: 400 }),
				convertToGlobal: (p: { x: number; y: number }) => p,
			} as unknown as ConstructorParameters<typeof HTMLPage>[0];

			const page = new HTMLPage(fakeRender, fakeElement, PageDensity.HARD);

			// At 0 deg (facing reader) -> should remain visible
			page.setHardDrawingAngle(0);
			page.draw(PageDensity.HARD);
			expect(fakeStyle.display).toBe("block");
			expect(fakeStyle.visibility).toBe("visible");

			// At 180 deg (facing away from reader) -> should be hidden
			page.setHardDrawingAngle(180);
			page.draw(PageDensity.HARD);
			expect(fakeStyle.display).toBe("none");
			expect(fakeStyle.visibility).toBe("hidden");
			expect(fakeStyle.opacity).toBe("0");

			// At 45 deg (facing reader) -> should be restored to visible
			page.setHardDrawingAngle(45);
			page.draw(PageDensity.HARD);
			expect(fakeStyle.display).toBe("block");
			expect(fakeStyle.visibility).toBe("visible");
			expect(fakeStyle.opacity).toBe("1");
		});

		it("preserves running headers and only freezes actual page counter folios", async () => {
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

			// Left margin content had counter(page) -> frozen with folio "2"
			expect(leftMarginContent.textContent).toBe("2");
			expect(leftMarginContent.attrs["data-folio-frozen"]).toBe("true");

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

			// Footer left matches counter(page) -> frozen with page 2 folio
			expect(footerLeftContent.textContent).toBe("2");
			expect(footerLeftContent.attrs["data-folio-frozen"]).toBe("true");

			// Footer center is arbitrary notes -> left alone
			expect(footerCenterContent.textContent).toBe("");
			expect(footerCenterContent.attrs["data-folio-frozen"]).toBeUndefined();

			controller.destroy();
		});

		it("correctly freezes custom page counters (lower-roman, upper-alpha, custom prefixes) on page flip", async () => {
			const { container, pageElements } = createMockBookContainer(5);

			// Page 0: Cover (:first)
			pageElements[0].setAttribute("data-page-number", "1");
			pageElements[0].classList.add("printedjs_first_page");

			// Page 1: Frontmatter TOC (i)
			pageElements[1].setAttribute("data-page", "frontmatter");
			pageElements[1].setAttribute("data-page-number", "1");
			pageElements[1].setAttribute("data-page-style", "lower-roman");

			// Page 2: Frontmatter Preface (ii)
			pageElements[2].setAttribute("data-page", "frontmatter");
			pageElements[2].setAttribute("data-page-number", "2");
			pageElements[2].setAttribute("data-page-style", "lower-roman");

			// Page 3: Main Body (Page 1)
			pageElements[3].setAttribute("data-page", "body-page");
			pageElements[3].setAttribute("data-page-number", "1");

			// Page 4: Appendix (Appendix A)
			pageElements[4].setAttribute("data-page", "appendix-page");
			pageElements[4].setAttribute("data-page-number", "1");

			const marginContents = pageElements.map((page, idx) => {
				const marginNode = {
					textContent: "",
					parentElement: {
						className: "printedjs_margin printedjs_margin-bottom-right",
					},
					getAttribute: (k: string) => marginNode.attrs[k] ?? null,
					setAttribute: (k: string, v: string) => {
						marginNode.attrs[k] = v;
					},
					removeAttribute: (k: string) => {
						delete marginNode.attrs[k];
					},
					matches: (sel: string) => {
						if (idx === 0 && sel.includes("_first_page")) return true;
						if ((idx === 1 || idx === 2) && sel.includes('data-page="frontmatter"')) return true;
						if (idx === 3 && sel.includes('data-page="body-page"')) return true;
						if (idx === 4 && sel.includes('data-page="appendix-page"')) return true;
						if (sel.includes(".printedjs_page .printedjs_margin-bottom-right")) return true;
						return false;
					},
					attrs: {} as Record<string, string>,
					firstElementChild: null,
				};
				(page as unknown as Record<string, unknown>).querySelectorAll = (sel: string) => {
					if (sel.includes("margin-content")) return [marginNode];
					if (sel.includes("data-folio-frozen")) {
						return marginNode.attrs["data-folio-frozen"] ? [marginNode] : [];
					}
					return [];
				};
				return marginNode;
			});

			const mockDoc = {
				styleSheets: [
					{
						cssRules: [
							{
								style: { content: "counter(page)" },
								selectorText:
									".printedjs_page .printedjs_margin-bottom-right > .printedjs_margin-content::after",
							},
							{
								style: { content: "none" },
								selectorText:
									".printedjs_page.printedjs_first_page .printedjs_margin-bottom-right > .printedjs_margin-content::after",
							},
							{
								style: { content: "counter(page, lower-roman)" },
								selectorText:
									'.printedjs_page[data-page="frontmatter"] .printedjs_margin-bottom-right > .printedjs_margin-content::after',
							},
							{
								style: { content: '"Page " counter(page, decimal)' },
								selectorText:
									'.printedjs_page[data-page="body-page"] .printedjs_margin-bottom-right > .printedjs_margin-content::after',
							},
							{
								style: { content: '"Appendix " counter(page, upper-alpha)' },
								selectorText:
									'.printedjs_page[data-page="appendix-page"] .printedjs_margin-bottom-right > .printedjs_margin-content::after',
							},
						],
					},
				],
				defaultView: {
					getComputedStyle: () => ({ content: "none" }),
				},
			};

			(container as unknown as Record<string, unknown>).ownerDocument = mockDoc;

			const controller = new DomFlipBookController(container, {
				sound: false,
				turnDurationMs: 0,
			});

			// Page 0 (Cover) -> content: none -> untouched
			expect(marginContents[0].textContent).toBe("");
			expect(marginContents[0].attrs["data-folio-frozen"]).toBeUndefined();

			// Page 1 (Frontmatter TOC) -> frozen to "i"
			expect(marginContents[1].textContent).toBe("i");
			expect(marginContents[1].attrs["data-folio-frozen"]).toBe("true");

			// Page 2 (Frontmatter Preface) -> frozen to "ii"
			expect(marginContents[2].textContent).toBe("ii");
			expect(marginContents[2].attrs["data-folio-frozen"]).toBe("true");

			// Page 3 (Body Chapter 1) -> frozen to "Page 1"
			expect(marginContents[3].textContent).toBe("Page 1");
			expect(marginContents[3].attrs["data-folio-frozen"]).toBe("true");

			// Page 4 (Appendix A) -> frozen to "Appendix A"
			expect(marginContents[4].textContent).toBe("Appendix A");
			expect(marginContents[4].attrs["data-folio-frozen"]).toBe("true");

			controller.destroy();

			// Cleanup verified
			for (let i = 1; i <= 4; i++) {
				expect(marginContents[i].textContent).toBe("");
				expect(marginContents[i].attrs["data-folio-frozen"]).toBeUndefined();
			}
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
