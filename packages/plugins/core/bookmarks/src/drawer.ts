import type { BookmarkItem } from "./plugin.js";

export interface BookmarksDrawerOptions {
	readonly container?: HTMLElement | undefined;
	readonly document?: Document | undefined;
	readonly bookmarks?: readonly BookmarkItem[] | undefined;
	readonly onNavigate?:
		| ((pageNumber: number, targetId?: string | undefined) => void)
		| undefined;
	readonly title?: string | undefined;
	readonly position?: "left" | "right" | undefined;
}

export interface BookmarksDrawerController {
	readonly element: HTMLElement;
	open(): void;
	close(): void;
	toggle(): void;
	isOpen(): boolean;
	setBookmarks(bookmarks: readonly BookmarkItem[]): void;
	setActivePage(pageNumber: number): void;
	destroy(): void;
}

const DRAWER_STYLE_ID = "printedjs-bookmarks-drawer-style";

const DRAWER_CSS = `
@media print {
	.printedjs-bookmarks-drawer,
	.printedjs-bookmarks-backdrop {
		display: none !important;
	}
}

.printedjs-bookmarks-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(2px);
	z-index: 9998;
	opacity: 0;
	visibility: hidden;
	transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s;
}

.printedjs-bookmarks-backdrop.open {
	opacity: 1;
	visibility: visible;
}

.printedjs-bookmarks-drawer {
	position: fixed;
	top: 0;
	bottom: 0;
	width: 320px;
	max-width: 85vw;
	background: var(--printedjs-drawer-bg, #1a1a24);
	color: var(--printedjs-drawer-fg, #e2e8f0);
	border-right: 1px solid var(--printedjs-drawer-border, rgba(255, 255, 255, 0.1));
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
	z-index: 9999;
	display: flex;
	flex-direction: column;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	font-size: 13px;
	transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
	box-sizing: border-box;
}

.printedjs-bookmarks-drawer.position-left {
	left: 0;
	transform: translateX(-100%);
}

.printedjs-bookmarks-drawer.position-left.open {
	transform: translateX(0);
}

.printedjs-bookmarks-drawer.position-right {
	right: 0;
	left: auto;
	border-right: none;
	border-left: 1px solid var(--printedjs-drawer-border, rgba(255, 255, 255, 0.1));
	transform: translateX(100%);
}

.printedjs-bookmarks-drawer.position-right.open {
	transform: translateX(0);
}

.printedjs-drawer-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid var(--printedjs-drawer-border, rgba(255, 255, 255, 0.08));
}

.printedjs-drawer-title {
	font-weight: 600;
	font-size: 14px;
	margin: 0;
	color: var(--printedjs-drawer-title-color, #f8fafc);
	display: flex;
	align-items: center;
	gap: 8px;
}

.printedjs-drawer-close-btn {
	background: transparent;
	border: none;
	color: var(--printedjs-drawer-muted, #94a3b8);
	cursor: pointer;
	padding: 6px;
	border-radius: 4px;
	line-height: 1;
	font-size: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.15s, color 0.15s;
}

.printedjs-drawer-close-btn:hover {
	background: rgba(255, 255, 255, 0.1);
	color: #fff;
}

.printedjs-drawer-search-bar {
	padding: 12px 16px;
	border-bottom: 1px solid var(--printedjs-drawer-border, rgba(255, 255, 255, 0.08));
}

.printedjs-drawer-search-input {
	width: 100%;
	background: rgba(0, 0, 0, 0.25);
	border: 1px solid rgba(255, 255, 255, 0.15);
	border-radius: 6px;
	padding: 7px 12px;
	font-size: 12px;
	color: inherit;
	box-sizing: border-box;
	outline: none;
	transition: border-color 0.15s, box-shadow 0.15s;
}

.printedjs-drawer-search-input:focus {
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

.printedjs-drawer-tree-container {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}

.printedjs-drawer-tree {
	list-style: none;
	margin: 0;
	padding: 0;
}

.printedjs-drawer-tree .printedjs-drawer-tree {
	padding-left: 14px;
}

.printedjs-drawer-item {
	margin: 2px 0;
}

.printedjs-drawer-item-row {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 8px;
	border-radius: 6px;
	cursor: pointer;
	user-select: none;
	transition: background 0.12s, color 0.12s;
}

.printedjs-drawer-item-row:hover {
	background: rgba(255, 255, 255, 0.06);
}

.printedjs-drawer-item-row.active {
	background: var(--printedjs-drawer-active-bg, rgba(59, 130, 246, 0.2));
	color: var(--printedjs-drawer-active-fg, #60a5fa);
	font-weight: 500;
}

.printedjs-drawer-expand-btn {
	background: transparent;
	border: none;
	color: var(--printedjs-drawer-muted, #94a3b8);
	cursor: pointer;
	padding: 2px;
	width: 18px;
	height: 18px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 10px;
	border-radius: 3px;
	transition: transform 0.18s, color 0.12s;
}

.printedjs-drawer-expand-btn:hover {
	color: #fff;
	background: rgba(255, 255, 255, 0.1);
}

.printedjs-drawer-expand-btn.collapsed {
	transform: rotate(-90deg);
}

.printedjs-drawer-expand-placeholder {
	width: 18px;
	height: 18px;
	flex-shrink: 0;
}

.printedjs-drawer-item-title {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.printedjs-drawer-item-badge {
	font-size: 11px;
	padding: 1px 6px;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.08);
	color: var(--printedjs-drawer-muted, #94a3b8);
	flex-shrink: 0;
}

.printedjs-drawer-empty {
	padding: 24px 16px;
	text-align: center;
	color: var(--printedjs-drawer-muted, #94a3b8);
	font-style: italic;
}
`;

function ensureStylesInjected(doc: Document): void {
	if (doc.getElementById(DRAWER_STYLE_ID)) return;
	const style = doc.createElement("style");
	style.id = DRAWER_STYLE_ID;
	style.textContent = DRAWER_CSS;
	doc.head?.appendChild(style);
}

export function createBookmarksDrawer(
	options: BookmarksDrawerOptions = {},
): BookmarksDrawerController {
	const doc =
		options.document ??
		options.container?.ownerDocument ??
		(typeof document !== "undefined" ? document : null);

	if (!doc) {
		throw new Error("createBookmarksDrawer requires a DOM document environment");
	}

	ensureStylesInjected(doc);

	const position = options.position ?? "left";
	const titleText = options.title ?? "Outline";
	let currentBookmarks: readonly BookmarkItem[] = options.bookmarks ?? [];
	let activePageNumber: number | null = null;
	let searchQuery = "";
	let isDrawerOpen = false;

	// Backdrop
	const backdrop = doc.createElement("div");
	backdrop.className = "printedjs-bookmarks-backdrop";

	// Drawer container
	const drawerEl = doc.createElement("aside");
	drawerEl.className = `printedjs-bookmarks-drawer position-${position}`;
	drawerEl.setAttribute("aria-label", titleText);

	// Header
	const header = doc.createElement("div");
	header.className = "printedjs-drawer-header";

	const titleEl = doc.createElement("h2");
	titleEl.className = "printedjs-drawer-title";
	titleEl.textContent = titleText;

	const closeBtn = doc.createElement("button");
	closeBtn.className = "printedjs-drawer-close-btn";
	closeBtn.innerHTML = "&times;";
	closeBtn.setAttribute("aria-label", "Close outline drawer");

	header.appendChild(titleEl);
	header.appendChild(closeBtn);
	drawerEl.appendChild(header);

	// Search bar
	const searchBar = doc.createElement("div");
	searchBar.className = "printedjs-drawer-search-bar";
	const searchInput = doc.createElement("input");
	searchInput.type = "search";
	searchInput.className = "printedjs-drawer-search-input";
	searchInput.placeholder = "Filter headings...";
	searchBar.appendChild(searchInput);
	drawerEl.appendChild(searchBar);

	// Tree list container
	const treeContainer = doc.createElement("div");
	treeContainer.className = "printedjs-drawer-tree-container";
	drawerEl.appendChild(treeContainer);

	// Map of page number to item rows for active highlighting
	const itemRows: { element: HTMLElement; pageNumber: number }[] = [];

	function renderTree(): void {
		treeContainer.innerHTML = "";
		itemRows.length = 0;

		if (currentBookmarks.length === 0) {
			const empty = doc!.createElement("div");
			empty.className = "printedjs-drawer-empty";
			empty.textContent = "No document bookmarks found";
			treeContainer.appendChild(empty);

			return;
		}

		const filteredBookmarks = filterBookmarks(
			currentBookmarks,
			searchQuery.toLowerCase().trim(),
		);

		if (filteredBookmarks.length === 0) {
			const empty = doc!.createElement("div");
			empty.className = "printedjs-drawer-empty";
			empty.textContent = `No matching headings for "${searchQuery}"`;
			treeContainer.appendChild(empty);

			return;
		}

		const rootList = renderList(filteredBookmarks);
		treeContainer.appendChild(rootList);
		updateActiveHighlight();
	}

	function filterBookmarks(
		items: readonly BookmarkItem[],
		query: string,
	): BookmarkItem[] {
		if (!query) return [...items];

		const result: BookmarkItem[] = [];

		for (const item of items) {
			const matches = item.title.toLowerCase().includes(query);
			const filteredChildren = filterBookmarks(item.children, query);

			if (matches || filteredChildren.length > 0) {
				result.push({
					...item,
					children: filteredChildren,
				});
			}
		}

		return result;
	}

	function renderList(items: readonly BookmarkItem[]): HTMLUListElement {
		const ul = doc!.createElement("ul");
		ul.className = "printedjs-drawer-tree";

		for (const item of items) {
			const li = doc!.createElement("li");
			li.className = "printedjs-drawer-item";

			const row = doc!.createElement("div");
			row.className = "printedjs-drawer-item-row";
			row.tabIndex = 0;
			row.setAttribute("role", "treeitem");
			row.setAttribute("data-page", String(item.pageNumber));

			if (item.targetId) {
				row.setAttribute("data-target-id", item.targetId);
			}

			itemRows.push({ element: row, pageNumber: item.pageNumber });

			const hasChildren = item.children.length > 0;
			let childUl: HTMLUListElement | null = null;

			if (hasChildren) {
				const expandBtn = doc!.createElement("button");
				expandBtn.className = "printedjs-drawer-expand-btn";
				expandBtn.innerHTML = "&#9660;";
				expandBtn.setAttribute("aria-label", "Toggle subheadings");

				expandBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					const isCollapsed = expandBtn.classList.toggle("collapsed");

					if (childUl) {
						childUl.style.display = isCollapsed ? "none" : "";
					}
				});

				row.appendChild(expandBtn);
			} else {
				const placeholder = doc!.createElement("span");
				placeholder.className = "printedjs-drawer-expand-placeholder";
				row.appendChild(placeholder);
			}

			const titleSpan = doc!.createElement("span");
			titleSpan.className = "printedjs-drawer-item-title";
			titleSpan.textContent = item.title;
			row.appendChild(titleSpan);

			const badge = doc!.createElement("span");
			badge.className = "printedjs-drawer-item-badge";
			badge.textContent = `p. ${item.pageNumber}`;
			row.appendChild(badge);

			const navigateAction = () => {
				activePageNumber = item.pageNumber;
				updateActiveHighlight();
				options.onNavigate?.(item.pageNumber, item.targetId);
			};

			row.addEventListener("click", navigateAction);
			row.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					navigateAction();
				}
			});

			li.appendChild(row);

			if (hasChildren) {
				childUl = renderList(item.children);
				li.appendChild(childUl);
			}

			ul.appendChild(li);
		}

		return ul;
	}

	function updateActiveHighlight(): void {
		if (activePageNumber === null) return;

		for (const row of itemRows) {
			if (row.pageNumber === activePageNumber) {
				row.element.classList.add("active");
			} else {
				row.element.classList.remove("active");
			}
		}
	}

	function open(): void {
		isDrawerOpen = true;
		backdrop.classList.add("open");
		drawerEl.classList.add("open");
		searchInput.focus();
	}

	function close(): void {
		isDrawerOpen = false;
		backdrop.classList.remove("open");
		drawerEl.classList.remove("open");
	}

	function toggle(): void {
		if (isDrawerOpen) {
			close();
		} else {
			open();
		}
	}

	function isOpen(): boolean {
		return isDrawerOpen;
	}

	function setBookmarks(bookmarks: readonly BookmarkItem[]): void {
		currentBookmarks = bookmarks;
		renderTree();
	}

	function setActivePage(pageNumber: number): void {
		activePageNumber = pageNumber;
		updateActiveHighlight();
	}

	function onKeydown(e: KeyboardEvent): void {
		if (e.key === "Escape" && isDrawerOpen) {
			close();
		}
	}

	searchInput.addEventListener("input", () => {
		searchQuery = searchInput.value;
		renderTree();
	});

	closeBtn.addEventListener("click", close);
	backdrop.addEventListener("click", close);
	doc.addEventListener("keydown", onKeydown);

	// Attach to container or body
	const targetContainer = options.container ?? doc.body;

	if (targetContainer) {
		targetContainer.appendChild(backdrop);
		targetContainer.appendChild(drawerEl);
	}

	renderTree();

	function destroy(): void {
		close();
		doc!.removeEventListener("keydown", onKeydown);
		backdrop.remove();
		drawerEl.remove();
	}

	return {
		element: drawerEl,
		open,
		close,
		toggle,
		isOpen,
		setBookmarks,
		setActivePage,
		destroy,
	};
}
