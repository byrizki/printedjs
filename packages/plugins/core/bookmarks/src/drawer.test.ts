import { describe, expect, it, vi } from "vitest";
import { createBookmarksDrawer } from "./drawer.js";
import type { BookmarkItem } from "./plugin.js";

type MockEventHandler = (e: { type: string; key?: string }) => void;

interface MockElement {
	tagName: string;
	className: string;
	classList: {
		add: (cls: string) => void;
		remove: (cls: string) => void;
		toggle: (cls: string) => boolean;
		contains: (cls: string) => boolean;
	};
	children: MockElement[];
	parentElement: MockElement | null;
	ownerDocument: unknown;
	style: Record<string, string>;
	attributes: Record<string, string>;
	textContent: string;
	innerHTML: string;
	value?: string;
	type?: string;
	placeholder?: string;
	tabIndex?: number;
	appendChild: (child: MockElement) => MockElement;
	removeChild: (child: MockElement) => MockElement;
	remove: () => void;
	setAttribute: (k: string, v: string) => void;
	getAttribute: (k: string) => string | null;
	addEventListener: (event: string, handler: MockEventHandler) => void;
	removeEventListener: (event: string, handler: MockEventHandler) => void;
	dispatchEvent: (event: { type: string; key?: string }) => void;
	focus: () => void;
}

function createMockDom() {
	const elementsById = new Map<string, MockElement>();

	function createEl(tagName: string): MockElement {
		const classes = new Set<string>();
		const attrs: Record<string, string> = {};
		const listeners = new Map<string, MockEventHandler[]>();
		const children: MockElement[] = [];
		let innerHtml = "";

		const el: MockElement = {
			tagName: tagName.toUpperCase(),
			get className() {
				return Array.from(classes).join(" ");
			},
			set className(val: string) {
				classes.clear();

				if (val) {
					val.split(/\s+/).forEach((c) => {
						if (c) classes.add(c);
					});
				}
			},
			classList: {
				add: (cls: string) => classes.add(cls),
				remove: (cls: string) => classes.delete(cls),
				toggle: (cls: string) => {
					if (classes.has(cls)) {
						classes.delete(cls);

						return false;
					}

					classes.add(cls);

					return true;
				},
				contains: (cls: string) => classes.has(cls),
			},
			children,
			parentElement: null,
			ownerDocument: null,
			style: {},
			attributes: attrs,
			textContent: "",
			get innerHTML() {
				return innerHtml;
			},
			set innerHTML(val: string) {
				innerHtml = val;

				if (val === "") {
					children.length = 0;
				}
			},
			appendChild(child: MockElement) {
				child.parentElement = el;
				children.push(child);

				return child;
			},
			removeChild(child: MockElement) {
				const idx = children.indexOf(child);

				if (idx >= 0) children.splice(idx, 1);
				child.parentElement = null;

				return child;
			},
			remove() {
				if (el.parentElement) {
					el.parentElement.removeChild(el);
				}
			},
			setAttribute(k: string, v: string) {
				attrs[k] = v;

				if (k === "id") elementsById.set(v, el);
			},
			getAttribute(k: string) {
				return attrs[k] ?? null;
			},
			addEventListener(event: string, handler: MockEventHandler) {
				if (!listeners.has(event)) listeners.set(event, []);
				listeners.get(event)!.push(handler);
			},
			removeEventListener(event: string, handler: MockEventHandler) {
				const list = listeners.get(event);

				if (list) {
					const idx = list.indexOf(handler);

					if (idx >= 0) list.splice(idx, 1);
				}
			},
			dispatchEvent(event: { type: string; key?: string }) {
				const list = listeners.get(event.type);

				if (list) {
					list.forEach((h) => h(event));
				}
			},
			focus: vi.fn(),
		};

		return el;
	}

	const docListeners = new Map<string, MockEventHandler[]>();
	const head = createEl("head");
	const body = createEl("body");

	const mockDoc = {
		head,
		body,
		createElement(tag: string) {
			const el = createEl(tag);
			el.ownerDocument = mockDoc;

			return el;
		},
		getElementById(id: string) {
			return elementsById.get(id) ?? null;
		},
		addEventListener(event: string, handler: MockEventHandler) {
			if (!docListeners.has(event)) docListeners.set(event, []);
			docListeners.get(event)!.push(handler);
		},
		removeEventListener(event: string, handler: MockEventHandler) {
			const list = docListeners.get(event);

			if (list) {
				const idx = list.indexOf(handler);

				if (idx >= 0) list.splice(idx, 1);
			}
		},
		dispatchEvent(event: { type: string; key?: string }) {
			const list = docListeners.get(event.type);

			if (list) {
				list.forEach((h) => h(event));
			}
		},
	};

	head.ownerDocument = mockDoc;
	body.ownerDocument = mockDoc;

	return { doc: mockDoc, head, body };
}

describe("Interactive TOC Bookmarks Navigation Drawer", () => {
	const sampleBookmarks: BookmarkItem[] = [
		{
			title: "Chapter 1: Getting Started",
			level: 1,
			pageNumber: 1,
			targetId: "intro",
			children: [
				{
					title: "Installation",
					level: 2,
					pageNumber: 2,
					targetId: "install",
					children: [],
				},
				{
					title: "Configuration",
					level: 2,
					pageNumber: 3,
					targetId: "config",
					children: [],
				},
			],
		},
		{
			title: "Chapter 2: Advanced Layout",
			level: 1,
			pageNumber: 5,
			targetId: "advanced",
			children: [],
		},
	];

	it("creates drawer and renders tree hierarchy with badges", () => {
		const { body, head } = createMockDom();

		const drawer = createBookmarksDrawer({
			container: body as unknown as HTMLElement,
			bookmarks: sampleBookmarks,
			title: "Contents",
		});

		expect(drawer.isOpen()).toBe(false);
		expect(head.children.length).toBeGreaterThan(0); // styles injected

		// Check drawer structure attached to body
		expect(body.children.length).toBe(2); // backdrop + drawer
		const drawerEl = body.children[1]!;
		expect(drawerEl.classList.contains("printedjs-bookmarks-drawer")).toBe(true);
		expect(drawerEl.attributes["aria-label"]).toBe("Contents");

		drawer.open();
		expect(drawer.isOpen()).toBe(true);
		expect(drawerEl.classList.contains("open")).toBe(true);

		drawer.close();
		expect(drawer.isOpen()).toBe(false);
		expect(drawerEl.classList.contains("open")).toBe(false);

		drawer.toggle();
		expect(drawer.isOpen()).toBe(true);
	});

	it("handles navigation callbacks when tree item is clicked", () => {
		const { body } = createMockDom();
		const onNavigate = vi.fn();

		const drawer = createBookmarksDrawer({
			container: body as unknown as HTMLElement,
			bookmarks: sampleBookmarks,
			onNavigate,
		});

		// Find the tree items inside tree container
		const drawerEl = body.children[1]!;
		// Find items
		const treeContainer = drawerEl.children[2]!;
		const rootUl = treeContainer.children[0]!;
		const firstLi = rootUl.children[0]!;
		const itemRow = firstLi.children[0]!;

		// Click Chapter 1
		itemRow.dispatchEvent({ type: "click" });
		expect(onNavigate).toHaveBeenCalledWith(1, "intro");
		expect(itemRow.classList.contains("active")).toBe(true);

		// Now trigger setActivePage(5) to highlight Chapter 2
		drawer.setActivePage(5);
		expect(itemRow.classList.contains("active")).toBe(false);

		const secondLi = rootUl.children[1]!;
		const secondItemRow = secondLi.children[0]!;
		expect(secondItemRow.classList.contains("active")).toBe(true);
	});

	it("filters bookmarks by search query", () => {
		const { body } = createMockDom();

		const drawer = createBookmarksDrawer({
			container: body as unknown as HTMLElement,
			bookmarks: sampleBookmarks,
		});

		expect(drawer.isOpen()).toBe(false);

		const drawerEl = body.children[1]!;
		const searchBar = drawerEl.children[1]!;
		const searchInput = searchBar.children[0]!;

		// Simulate searching for "install"
		searchInput.value = "install";
		searchInput.dispatchEvent({ type: "input" });

		const treeContainer = drawerEl.children[2]!;
		const rootUl = treeContainer.children[0]!;
		expect(rootUl.children.length).toBe(1); // Chapter 1 preserved because child matched
		const chapterLi = rootUl.children[0]!;
		const subUl = chapterLi.children[1]!;
		expect(subUl.children.length).toBe(1); // Only "Installation" is kept
	});

	it("supports destroying drawer and cleaning up DOM", () => {
		const { body } = createMockDom();

		const drawer = createBookmarksDrawer({
			container: body as unknown as HTMLElement,
			bookmarks: sampleBookmarks,
		});

		expect(body.children.length).toBe(2);
		drawer.destroy();
		expect(body.children.length).toBe(0);
	});
});
