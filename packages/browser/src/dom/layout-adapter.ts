import {
	formatPageNumber,
	type BreakToken,
	type LayoutStepResult,
	type PagedjsCompatibilityOptions,
	type PaginatorAdapter,
} from "@printedjs/core";
import type { RenderSurface } from "../surface/types.js";
import { createPageShell } from "./page-shell.js";

export interface DomLayoutAdapterOptions extends PagedjsCompatibilityOptions {
	readonly surface: RenderSurface;
	readonly sourceRoot: Node;
	readonly fromPage?: number | undefined;
	readonly fixedSelectors?: readonly string[] | undefined;
}

interface WorkNode {
	readonly id: number;
	readonly node: Node;
	readonly ancestors: HTMLElement[];
}

function isElement(node: Node | null | undefined): node is HTMLElement {
	return Boolean(node && node.nodeType === 1);
}

function getBreakBefore(el: HTMLElement, doc: Document): string | null {
	const attr = el.getAttribute("data-break-before");

	if (attr) return attr.toLowerCase();
	const style = el.style.breakBefore || el.style.pageBreakBefore;

	if (style) return style.toLowerCase();
	const computed = doc.defaultView?.getComputedStyle(el);
	const cb = computed?.breakBefore || computed?.pageBreakBefore;

	return cb && cb !== "auto" && cb !== "normal" ? cb.toLowerCase() : null;
}

function getBreakAfter(el: HTMLElement, doc: Document): string | null {
	const attr = el.getAttribute("data-break-after");

	if (attr) return attr.toLowerCase();
	const style = el.style.breakAfter || el.style.pageBreakAfter;

	if (style) return style.toLowerCase();
	const computed = doc.defaultView?.getComputedStyle(el);
	const ca = computed?.breakAfter || computed?.pageBreakAfter;

	return ca && ca !== "auto" && ca !== "normal" ? ca.toLowerCase() : null;
}

function getBreakInside(el: HTMLElement, doc: Document): string | null {
	const attr = el.getAttribute("data-break-inside");

	if (attr) return attr.toLowerCase();
	const style = el.style.breakInside || el.style.pageBreakInside;

	if (style) return style.toLowerCase();
	const computed = doc.defaultView?.getComputedStyle(el);
	const ci = computed?.breakInside || computed?.pageBreakInside;

	return ci && ci !== "auto" && ci !== "normal" ? ci.toLowerCase() : null;
}

export function getNamedPage(
	node: Node | null,
	ancestors?: readonly HTMLElement[],
): string | null {
	let curr: Node | null = node;

	while (curr) {
		if (isElement(curr)) {
			const attr = curr.getAttribute("data-page");

			if (attr) {
				const val = attr.trim();

				return val === "auto" ? null : val;
			}

			const inlineStyle = curr.getAttribute("style");

			if (inlineStyle) {
				const match = /(?:^|;)\s*page\s*:\s*([^;!]+)/i.exec(inlineStyle);

				if (match && match[1]) {
					const val = match[1].trim();

					if (val === "auto") return null;

					if (val) return val;
				}
			}
		}

		curr = curr.parentNode;
	}

	if (ancestors) {
		for (let i = ancestors.length - 1; i >= 0; i--) {
			const a = ancestors[i];

			if (!a) continue;
			const attr = a.getAttribute("data-page");

			if (attr) {
				const val = attr.trim();

				return val === "auto" ? null : val;
			}

			const inlineStyle = a.getAttribute("style");

			if (inlineStyle) {
				const match = /(?:^|;)\s*page\s*:\s*([^;!]+)/i.exec(inlineStyle);

				if (match && match[1]) {
					const val = match[1].trim();

					if (val === "auto") return null;

					if (val) return val;
				}
			}
		}
	}

	return null;
}

function getCounterReset(
	node: Node | null,
	ancestors?: readonly HTMLElement[],
	doc?: Document,
	startedElements?: ReadonlySet<Node>,
): number | null {
	let curr: Node | null = node;

	while (curr) {
		if (isElement(curr) && !startedElements?.has(curr)) {
			const attr =
				curr.getAttribute("data-page-counter-reset") ||
				curr.getAttribute("data-counter-reset") ||
				curr.getAttribute("data-page-reset");

			if (attr) {
				const match = /(?:page\s+)?(\d+)/i.exec(attr);

				if (match && match[1]) {
					return parseInt(match[1], 10);
				}

				const num = parseInt(attr, 10);

				if (!Number.isNaN(num)) return num;
			}

			const inline = curr.getAttribute("style");

			if (inline) {
				const match = /(?:^|;)\s*counter-reset\s*:\s*(?:page\s+)?(\d+)/i.exec(inline);

				if (match && match[1]) {
					return parseInt(match[1], 10);
				}

				if (/(?:^|;)\s*counter-reset\s*:\s*page\b/i.test(inline)) {
					return 1;
				}
			}

			if (doc?.defaultView) {
				const computed = doc.defaultView.getComputedStyle(curr);
				const cr = computed?.counterReset;

				if (cr && cr !== "none") {
					const match = /\bpage\s+(\d+)/i.exec(cr);

					if (match && match[1]) {
						return parseInt(match[1], 10);
					}

					if (/\bpage\b/i.test(cr)) {
						return 1;
					}
				}
			}
		}

		curr = curr.parentNode;
	}

	if (ancestors) {
		for (let i = ancestors.length - 1; i >= 0; i--) {
			const a = ancestors[i];

			if (!a || startedElements?.has(a)) continue;

			const attr =
				a.getAttribute("data-page-counter-reset") ||
				a.getAttribute("data-counter-reset") ||
				a.getAttribute("data-page-reset");

			if (attr) {
				const match = /(?:page\s+)?(\d+)/i.exec(attr);

				if (match && match[1]) {
					return parseInt(match[1], 10);
				}

				const num = parseInt(attr, 10);

				if (!Number.isNaN(num)) return num;
			}

			const inline = a.getAttribute("style");

			if (inline) {
				const match = /(?:^|;)\s*counter-reset\s*:\s*(?:page\s+)?(\d+)/i.exec(inline);

				if (match && match[1]) {
					return parseInt(match[1], 10);
				}

				if (/(?:^|;)\s*counter-reset\s*:\s*page\b/i.test(inline)) {
					return 1;
				}
			}
		}
	}

	return null;
}

function getCounterStyle(
	node: Node | null,
	ancestors?: readonly HTMLElement[],
): string | null {
	let curr: Node | null = node;

	while (curr) {
		if (isElement(curr)) {
			const attr =
				curr.getAttribute("data-page-style") ||
				curr.getAttribute("data-counter-style") ||
				curr.getAttribute("data-page-counter-style");

			if (attr) return attr.toLowerCase().trim();
			const inline = curr.getAttribute("style");

			if (inline) {
				const match =
					/(?:^|;)\s*(?:--printedjs-page-style|--page-style|counter-style)\s*:\s*([^;!]+)/i.exec(
						inline,
					);

				if (match && match[1]) {
					return match[1].toLowerCase().trim();
				}
			}
		}

		curr = curr.parentNode;
	}

	if (ancestors) {
		for (let i = ancestors.length - 1; i >= 0; i--) {
			const a = ancestors[i];

			if (!a) continue;

			const attr =
				a.getAttribute("data-page-style") ||
				a.getAttribute("data-counter-style") ||
				a.getAttribute("data-page-counter-style");

			if (attr) return attr.toLowerCase().trim();
			const inline = a.getAttribute("style");

			if (inline) {
				const match =
					/(?:^|;)\s*(?:--printedjs-page-style|--page-style|counter-style)\s*:\s*([^;!]+)/i.exec(
						inline,
					);

				if (match && match[1]) {
					return match[1].toLowerCase().trim();
				}
			}
		}
	}

	return null;
}

function tableHasDataRows(table: HTMLElement, ignoredElement: Element): boolean {
	for (let i = 0; i < table.children.length; i++) {
		const child = table.children[i];

		if (!child || child === ignoredElement) {
			continue;
		}

		const tag = child.tagName.toUpperCase();

		if (tag === "THEAD" || tag === "TFOOT" || tag === "COLGROUP" || tag === "CAPTION") {
			continue;
		}

		if (tag === "TR") {
			return true;
		}

		if (tag === "TBODY" && child.children.length > 0) {
			return true;
		}
	}

	return false;
}

function isTheadRepeating(thead: HTMLElement, doc: Document): boolean {
	// 1. Explicit opt-outs always disable repetition
	if (thead.getAttribute("data-repeat") === "false") {
		return false;
	}

	if (thead.parentElement?.getAttribute("data-repeat") === "false") {
		return false;
	}

	if (thead.parentElement?.getAttribute("data-repeat-header") === "false") {
		return false;
	}

	if (
		thead.classList.contains("no-repeat") ||
		thead.parentElement?.classList.contains("no-repeat") ||
		thead.parentElement?.classList.contains("no-repeat-header")
	) {
		return false;
	}

	const inlineDisplay = thead.style.display;

	if (inlineDisplay === "table-row-group") {
		return false;
	}

	const computed = doc.defaultView?.getComputedStyle(thead);

	if (computed && computed.display === "table-row-group") {
		return false;
	}

	// 2. Repetition is disabled by default; enable ONLY via special class name or data attribute
	if (
		thead.getAttribute("data-repeat") === "true" ||
		thead.getAttribute("data-repeat-header") === "true" ||
		thead.parentElement?.getAttribute("data-repeat") === "true" ||
		thead.parentElement?.getAttribute("data-repeat-header") === "true"
	) {
		return true;
	}

	if (
		thead.classList.contains("repeat") ||
		thead.classList.contains("repeating") ||
		thead.classList.contains("repeat-header") ||
		thead.classList.contains("repeat-headers") ||
		thead.classList.contains("repeat-thead")
	) {
		return true;
	}

	const table = thead.parentElement;

	if (
		table &&
		(table.classList.contains("repeat") ||
			table.classList.contains("repeating") ||
			table.classList.contains("repeat-header") ||
			table.classList.contains("repeat-headers") ||
			table.classList.contains("repeat-thead") ||
			table.classList.contains("repeat-table"))
	) {
		return true;
	}

	return false;
}

function isTfootRepeating(tfoot: HTMLElement, doc: Document): boolean {
	// 1. Explicit opt-outs always disable repetition
	if (tfoot.getAttribute("data-repeat") === "false") {
		return false;
	}

	if (tfoot.parentElement?.getAttribute("data-repeat") === "false") {
		return false;
	}

	if (tfoot.parentElement?.getAttribute("data-repeat-footer") === "false") {
		return false;
	}

	if (
		tfoot.classList.contains("no-repeat") ||
		tfoot.parentElement?.classList.contains("no-repeat") ||
		tfoot.parentElement?.classList.contains("no-repeat-footer")
	) {
		return false;
	}

	const inlineDisplay = tfoot.style.display;

	if (inlineDisplay === "table-row-group") {
		return false;
	}

	const computed = doc.defaultView?.getComputedStyle(tfoot);

	if (computed && computed.display === "table-row-group") {
		return false;
	}

	// 2. Repetition is disabled by default; enable ONLY via special class name or data attribute
	if (
		tfoot.getAttribute("data-repeat") === "true" ||
		tfoot.getAttribute("data-repeat-footer") === "true" ||
		tfoot.parentElement?.getAttribute("data-repeat") === "true" ||
		tfoot.parentElement?.getAttribute("data-repeat-footer") === "true"
	) {
		return true;
	}

	if (
		tfoot.classList.contains("repeat") ||
		tfoot.classList.contains("repeating") ||
		tfoot.classList.contains("repeat-footer") ||
		tfoot.classList.contains("repeat-footers") ||
		tfoot.classList.contains("repeat-tfoot")
	) {
		return true;
	}

	const table = tfoot.parentElement;

	if (
		table &&
		(table.classList.contains("repeat") ||
			table.classList.contains("repeating") ||
			table.classList.contains("repeat-footer") ||
			table.classList.contains("repeat-footers") ||
			table.classList.contains("repeat-tfoot") ||
			table.classList.contains("repeat-table"))
	) {
		return true;
	}

	return false;
}

interface TableRowCarriedSpan {
	sourceCell: HTMLElement;
	colStart: number;
	colSpan: number;
	remainingRows: number;
}

function insertContinuationCell(
	tr: HTMLElement,
	cell: HTMLElement,
	targetCol: number,
): void {
	let currentCol = 0;

	// SAFETY: children filtered by TD or TH tags are HTMLElement instances
	const children = Array.from(tr.children).filter((c) => {
		const tag = c.tagName.toUpperCase();

		return tag === "TD" || tag === "TH";
	}) as HTMLElement[];

	for (const child of children) {
		if (currentCol >= targetCol) {
			tr.insertBefore(cell, child);

			return;
		}

		const csAttr = child.getAttribute("colspan");
		const cs = csAttr ? Math.max(1, parseInt(csAttr, 10) || 1) : 1;
		currentCol += cs;
	}

	tr.appendChild(cell);
}

function isTableSpansRepeating(table: HTMLElement): boolean {
	// 1. Explicit opt-outs
	if (
		table.getAttribute("data-repeat-spans") === "false" ||
		table.getAttribute("data-repeat") === "false" ||
		table.getAttribute("data-repeat-rowspan") === "false"
	) {
		return false;
	}

	if (
		table.classList.contains("no-repeat-spans") ||
		table.classList.contains("no-repeat-rowspan") ||
		table.classList.contains("no-repeat")
	) {
		return false;
	}

	// 2. Disabled by default; enable ONLY via special class name or data attribute on table or cell
	if (
		table.getAttribute("data-repeat-spans") === "true" ||
		table.getAttribute("data-repeat") === "true" ||
		table.getAttribute("data-repeat-rowspan") === "true" ||
		table.getAttribute("data-repeat-matrix") === "true"
	) {
		return true;
	}

	if (
		table.classList.contains("repeat-spans") ||
		table.classList.contains("repeat-rowspan") ||
		table.classList.contains("repeat-span") ||
		table.classList.contains("repeat-table") ||
		table.classList.contains("repeat") ||
		table.classList.contains("repeating") ||
		table.classList.contains("spanning-matrix")
	) {
		return true;
	}

	const hasRepeatingCell = Boolean(
		table.querySelector(
			"td[data-repeat-content='true'], td[data-repeat-span='true'], td[data-repeat-rowspan='true'], td.repeat-span, td.repeat-rowspan, td.zcell, th[data-repeat-content='true'], th[data-repeat-span='true'], th.repeat-span, th.zcell",
		),
	);

	return hasRepeatingCell;
}

function buildTableCarriedSpans(
	root: HTMLElement,
): Map<HTMLElement, TableRowCarriedSpan[]> {
	const map = new Map<HTMLElement, TableRowCarriedSpan[]>();

	if (!root || !("querySelectorAll" in root)) {
		return map;
	}

	const tables = Array.from(root.querySelectorAll("table"));

	for (const table of tables) {
		if (!isTableSpansRepeating(table)) {
			continue;
		}

		const rowGroups: HTMLElement[] = [];

		// SAFETY: querySelectorAll returns matching elements that are HTMLElements
		const explicitGroups = Array.from(
			table.querySelectorAll(":scope > tbody, :scope > thead, :scope > tfoot"),
		) as HTMLElement[];

		if (explicitGroups.length > 0) {
			rowGroups.push(...explicitGroups);
		}

		// SAFETY: querySelectorAll returns matching tr HTMLElements
		const directTrs = Array.from(table.querySelectorAll(":scope > tr")) as HTMLElement[];

		if (directTrs.length > 0) {
			rowGroups.push(table);
		}

		for (const rg of rowGroups) {
			// SAFETY: children filtered by TR tag are HTMLElement instances
			const rows = Array.from(rg.children).filter(
				(c) => c.tagName.toUpperCase() === "TR",
			) as HTMLElement[];

			if (rows.length === 0) continue;

			interface ActiveSpan {
				sourceCell: HTMLElement;
				colStart: number;
				colSpan: number;
				endRowIdx: number;
			}

			const activeSpans = new Map<number, ActiveSpan>();

			for (let r = 0; r < rows.length; r++) {
				const row = rows[r]!;

				if (r > 0 && activeSpans.size > 0) {
					const uniqueSpans = new Map<HTMLElement, TableRowCarriedSpan>();

					for (const span of activeSpans.values()) {
						if (span.endRowIdx >= r && !uniqueSpans.has(span.sourceCell)) {
							uniqueSpans.set(span.sourceCell, {
								sourceCell: span.sourceCell,
								colStart: span.colStart,
								colSpan: span.colSpan,
								remainingRows: span.endRowIdx - r + 1,
							});
						}
					}

					if (uniqueSpans.size > 0) {
						const carriedList = Array.from(uniqueSpans.values()).sort(
							(a, b) => a.colStart - b.colStart,
						);

						map.set(row, carriedList);
					}
				}

				let col = 0;

				// SAFETY: children filtered by TD or TH tags are HTMLElement instances
				const cells = Array.from(row.children).filter((c) => {
					const tag = c.tagName.toUpperCase();

					return tag === "TD" || tag === "TH";
				}) as HTMLElement[];

				for (const cell of cells) {
					while (activeSpans.has(col)) {
						col++;
					}

					const csAttr = cell.getAttribute("colspan");
					const colSpan = csAttr ? Math.max(1, parseInt(csAttr, 10) || 1) : 1;
					const rsAttr = cell.getAttribute("rowspan");
					const rowSpan = rsAttr ? Math.max(1, parseInt(rsAttr, 10) || 1) : 1;

					if (rowSpan > 1) {
						const newSpan: ActiveSpan = {
							sourceCell: cell,
							colStart: col,
							colSpan,
							endRowIdx: r + rowSpan - 1,
						};

						for (let c = 0; c < colSpan; c++) {
							activeSpans.set(col + c, newSpan);
						}
					}

					col += colSpan;
				}

				for (const [colIdx, span] of Array.from(activeSpans.entries())) {
					if (span.endRowIdx <= r) {
						activeSpans.delete(colIdx);
					}
				}
			}
		}
	}

	return map;
}

function clampTableOpenRowspans(pageShell: HTMLElement): void {
	const rowGroups = pageShell.querySelectorAll("tbody, thead, tfoot, table");

	for (let g = 0; g < rowGroups.length; g++) {
		const rg = rowGroups[g]!;

		// SAFETY: children filtered by TR tag are HTMLElement instances
		const rows = Array.from(rg.children).filter(
			(c) => c.tagName.toUpperCase() === "TR",
		) as HTMLElement[];

		if (rows.length === 0) continue;

		for (let rIdx = 0; rIdx < rows.length; rIdx++) {
			const row = rows[rIdx]!;
			const available = rows.length - rIdx;

			// SAFETY: children filtered by TD or TH tags are HTMLElement instances
			const cells = Array.from(row.children).filter((c) => {
				const tag = c.tagName.toUpperCase();

				return tag === "TD" || tag === "TH";
			}) as HTMLElement[];

			for (const cell of cells) {
				const rsAttr = cell.getAttribute("rowspan");

				if (rsAttr) {
					const rs = parseInt(rsAttr, 10);

					if (!isNaN(rs) && rs > available) {
						cell.setAttribute("rowspan", String(available));
					}
				}
			}
		}
	}
}

function extractTableColumnWidths(table: HTMLElement): number[] {
	const colgroup = table.querySelector(":scope > colgroup");

	if (colgroup) {
		// SAFETY: querySelectorAll returns matching col HTMLElement instances
		const cols = Array.from(colgroup.querySelectorAll(":scope > col")) as HTMLElement[];

		if (cols.length > 0) {
			const widths = cols.map((c) => {
				const w = c.style.width || c.getAttribute("width") || "";

				return parseFloat(w) || 0;
			});

			if (widths.every((w) => w > 0)) {
				return widths;
			}
		}
	}

	const colWidths = new Map<number, number>();

	const activeSpans = new Map<number, number>();

	const rows = Array.from(table.querySelectorAll("tr")).filter(
		(r) => r.closest("table") === table,
	);

	for (let rIdx = 0; rIdx < rows.length; rIdx++) {
		const row = rows[rIdx]!;
		let col = 0;

		for (const [colIdx, remaining] of Array.from(activeSpans.entries())) {
			if (remaining > 1) {
				activeSpans.set(colIdx, remaining - 1);
			} else {
				activeSpans.delete(colIdx);
			}
		}

		// SAFETY: children filtered by TD or TH tags are HTMLElement instances
		const cells = Array.from(row.children).filter((c) => {
			const tag = c.tagName.toUpperCase();

			return tag === "TD" || tag === "TH";
		}) as HTMLElement[];

		for (const cell of cells) {
			while (activeSpans.has(col)) {
				col++;
			}

			const colSpanAttr = cell.getAttribute("colspan");
			const colSpan = colSpanAttr ? Math.max(1, parseInt(colSpanAttr, 10) || 1) : 1;
			const rowSpanAttr = cell.getAttribute("rowspan");
			const rowSpan = rowSpanAttr ? Math.max(1, parseInt(rowSpanAttr, 10) || 1) : 1;

			if (rowSpan > 1) {
				for (let c = 0; c < colSpan; c++) {
					activeSpans.set(col + c, rowSpan);
				}
			}

			if (colSpan === 1) {
				const rect = cell.getBoundingClientRect();

				if (rect.width > 0 && !colWidths.has(col)) {
					colWidths.set(col, rect.width);
				}
			}

			col += colSpan;
		}
	}

	if (colWidths.size === 0) {
		return [];
	}

	let maxCol = 0;

	for (const k of colWidths.keys()) {
		if (k > maxCol) maxCol = k;
	}

	const result: number[] = [];

	for (let c = 0; c <= maxCol; c++) {
		result.push(colWidths.get(c) ?? 0);
	}

	return result;
}

function applyTableColgroup(table: HTMLElement, widths: number[], doc: Document): void {
	if (!widths || widths.length === 0) return;

	if (
		table.getAttribute("data-sync-columns") === "false" ||
		table.getAttribute("data-table-layout") === "auto"
	) {
		return;
	}

	// SAFETY: querySelector returns matching colgroup HTMLElement or null
	let colgroup = table.querySelector(":scope > colgroup") as HTMLElement | null;

	if (!colgroup) {
		colgroup = doc.createElement("colgroup");
		table.insertBefore(colgroup, table.firstChild);
	}

	// SAFETY: querySelectorAll returns matching col HTMLElement instances
	const existingCols = Array.from(
		colgroup.querySelectorAll(":scope > col"),
	) as HTMLElement[];

	const hasExplicitWidths =
		existingCols.length === widths.length &&
		existingCols.every((c) => {
			const w = parseFloat(c.style.width || c.getAttribute("width") || "0");

			return w > 0;
		});

	if (hasExplicitWidths) {
		return;
	}

	const tableWidth = table.getBoundingClientRect().width;
	const sumWidths = widths.reduce((sum, w) => sum + w, 0);
	const scale = tableWidth > 0 && sumWidths > tableWidth + 1 ? tableWidth / sumWidths : 1;

	colgroup.replaceChildren();

	for (const w of widths) {
		const col = doc.createElement("col");
		const finalWidth = Math.round(w * scale * 100) / 100;

		col.style.width = `${finalWidth}px`;
		colgroup.appendChild(col);
	}
}

export class DomLayoutAdapter implements PaginatorAdapter {
	private readonly surface: RenderSurface;
	private readonly sourceRoot: Node;
	private readonly fromPage?: number | undefined;
	private readonly pagedjsCompatible: boolean;
	private pagesContainer!: HTMLElement;
	private remainingWork: WorkNode[] = [];
	private workIndex = 0;
	private fixedElements: HTMLElement[] = [];
	private readonly fixedSelectors: readonly string[];
	private readonly startedAncestors = new Set<HTMLElement>();
	private readonly startedNodes = new Set<Node>();
	private readonly tableColumnWidths = new Map<HTMLElement, number[]>();
	private carriedRowSpans = new Map<HTMLElement, TableRowCarriedSpan[]>();
	private pendingBreakTarget: "left" | "right" | "recto" | "verso" | null = null;
	private initialized = false;
	private currentLogicalPageNumber = 0;
	private currentCounterStyle = "decimal";
	private activeSectionIndex = 1;

	constructor(options: DomLayoutAdapterOptions) {
		this.surface = options.surface;
		this.sourceRoot = options.sourceRoot;
		this.fromPage = options.fromPage;
		this.pagedjsCompatible = options.pagedjsCompatible ?? false;
		this.fixedSelectors = options.fixedSelectors ?? [];
	}

	prepare(): void {
		const doc = this.surface.document;

		const existingPages = this.surface.rootElement.querySelector<HTMLElement>(
			".printedjs_pages, .pagedjs_pages",
		);

		if (existingPages && this.fromPage && this.fromPage > 1) {
			this.pagesContainer = existingPages;

			const shells = Array.from(
				this.pagesContainer.querySelectorAll<HTMLElement>(
					".printedjs_page, .pagedjs_page",
				),
			);

			for (const shell of shells) {
				const pageNumAttr = shell.getAttribute("data-page-number");
				const num = pageNumAttr ? parseInt(pageNumAttr, 10) : 0;

				if (num >= this.fromPage) {
					shell.remove();
				}
			}
		} else {
			this.pagesContainer = doc.createElement("div");
			this.pagesContainer.className = this.pagedjsCompatible
				? "printedjs_pages pagedjs_pages"
				: "printedjs_pages";
			this.pagesContainer.setAttribute("data-printedjs-pages", "");
			this.surface.rootElement.appendChild(this.pagesContainer);
		}

		// Extract fixed-position elements
		if ("querySelectorAll" in this.sourceRoot) {
			const selectors = [
				'[data-position-fixed="true"]',
				'[style*="position: fixed"]',
				'[style*="position:fixed"]',
				...this.fixedSelectors,
			];

			// SAFETY: sourceRoot with querySelectorAll implements ParentNode
			const fixedNodes = (this.sourceRoot as ParentNode).querySelectorAll(
				selectors.join(", "),
			);

			for (let i = 0; i < fixedNodes.length; i++) {
				// SAFETY: querySelectorAll returns matching HTMLElement instances
				const el = fixedNodes[i] as HTMLElement;
				this.fixedElements.push(el);
				el.remove();
			}
		}

		if ("querySelectorAll" in this.sourceRoot) {
			// SAFETY: sourceRoot with querySelectorAll is an HTMLElement container
			this.carriedRowSpans = buildTableCarriedSpans(this.sourceRoot as HTMLElement);
		}

		const allWork = this.flattenNodes(this.sourceRoot, []);

		if (this.fromPage && this.fromPage > 1) {
			const prevShell = this.pagesContainer.querySelector<HTMLElement>(
				`:is(.printedjs_page, .pagedjs_page)[data-page-number="${this.fromPage - 1}"]`,
			);

			const lastWorkIdStr = prevShell?.getAttribute("data-last-work-id");

			if (lastWorkIdStr !== null && lastWorkIdStr !== undefined) {
				const lastId = parseInt(lastWorkIdStr, 10);
				this.remainingWork = allWork.filter((w) => w.id > lastId);

				for (const w of allWork) {
					if (w.id <= lastId) {
						if (isElement(w.node)) {
							this.startedNodes.add(w.node);
						}

						for (const a of w.ancestors) {
							this.startedAncestors.add(a);
						}
					}
				}
			} else {
				this.remainingWork = allWork;
			}
		} else {
			this.remainingWork = allWork;
		}

		this.workIndex = 0;
		this.initialized = true;
	}

	hasNextContent(): boolean {
		if (!this.initialized) {
			return true;
		}

		this.purgeUndisplayedLeadingWork();

		return this.workIndex < this.remainingWork.length;
	}

	private isWorkNodeUndisplayed(head: WorkNode, doc: Document): boolean {
		const node = head.node;

		if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
			return true;
		}

		if (node.nodeType === Node.COMMENT_NODE) {
			return true;
		}

		if (isElement(node)) {
			const tag = node.tagName.toUpperCase();

			if (
				tag === "SCRIPT" ||
				tag === "STYLE" ||
				tag === "NOSCRIPT" ||
				tag === "TEMPLATE"
			) {
				return true;
			}

			if (node.style.display === "none") {
				return true;
			}
		}

		for (const anc of head.ancestors) {
			if (anc.style.display === "none") {
				return true;
			}
		}

		// SAFETY: node is confirmed to be an HTMLElement via isElement
		const testClone = isElement(node)
			? (node.cloneNode(false) as HTMLElement)
			: doc.createElement("span");

		let attachRoot: HTMLElement = testClone;
		const ancestorClones: HTMLElement[] = [];

		for (let i = head.ancestors.length - 1; i >= 0; i--) {
			// SAFETY: ancestor is an HTMLElement
			const ancClone = head.ancestors[i]!.cloneNode(false) as HTMLElement;
			ancClone.appendChild(attachRoot);
			attachRoot = ancClone;
			ancestorClones.push(ancClone);
		}

		this.pagesContainer.appendChild(attachRoot);
		const win = doc.defaultView;
		let isHidden = false;

		if (win) {
			if (win.getComputedStyle(testClone).display === "none") {
				isHidden = true;
			} else {
				for (const ancClone of ancestorClones) {
					if (win.getComputedStyle(ancClone).display === "none") {
						isHidden = true;
						break;
					}
				}
			}
		}

		attachRoot.remove();

		return isHidden;
	}

	private purgeUndisplayedLeadingWork(): void {
		const doc = this.surface.document;

		while (this.workIndex < this.remainingWork.length) {
			const head = this.remainingWork[this.workIndex];

			if (!head || !this.isWorkNodeUndisplayed(head, doc)) {
				break;
			}

			this.workIndex++;
		}
	}

	private markBlankPage(pageShell: HTMLElement): void {
		pageShell.classList.add("printedjs_blank_page");

		if (this.pagedjsCompatible) {
			pageShell.classList.add("pagedjs_blank_page");
		}
	}

	async layoutPage(pageNumber: number): Promise<LayoutStepResult> {
		const doc = this.surface.document;

		const headNode =
			this.workIndex < this.remainingWork.length
				? this.remainingWork[this.workIndex]
				: null;

		const targetPageName = headNode
			? getNamedPage(headNode.node ?? null, headNode.ancestors)
			: null;

		const detectedReset = headNode
			? getCounterReset(headNode.node, headNode.ancestors, doc, this.startedAncestors)
			: null;

		const detectedStyle = headNode
			? getCounterStyle(headNode.node, headNode.ancestors)
			: null;

		if (detectedStyle) {
			this.currentCounterStyle = detectedStyle;
		}

		let isReset = false;

		if (detectedReset !== null) {
			this.currentLogicalPageNumber = detectedReset;
			this.activeSectionIndex++;
			isReset = true;
		} else {
			this.currentLogicalPageNumber++;
		}

		const formattedNumber = formatPageNumber(
			this.currentLogicalPageNumber,
			this.currentCounterStyle,
		);

		const pageShell = createPageShell(
			pageNumber,
			doc,
			this.pagedjsCompatible,
			targetPageName ?? undefined,
			{
				physicalPageNumber: pageNumber,
				logicalPageNumber: this.currentLogicalPageNumber,
				counterStyle: this.currentCounterStyle,
				counterFormatted: formattedNumber,
				counterReset: isReset ? this.currentLogicalPageNumber : undefined,
			},
		);

		this.pagesContainer.appendChild(pageShell);

		// Insert fixed-position elements inside pagebox
		for (const fixed of this.fixedElements) {
			// SAFETY: fixed is an HTMLElement instance
			const clone = fixed.cloneNode(true) as HTMLElement;
			clone.style.position = "absolute";
			const pagebox = pageShell.querySelector(".printedjs_pagebox, .pagedjs_pagebox");
			pagebox?.appendChild(clone);
		}

		const contentArea = pageShell.querySelector<HTMLElement>(
			":is(.printedjs_page_content, .pagedjs_page_content) > div",
		);

		const contentParent = pageShell.querySelector<HTMLElement>(
			".printedjs_page_content, .pagedjs_page_content",
		);

		const pageArea = pageShell.querySelector<HTMLElement>(
			".printedjs_area, .pagedjs_area",
		);

		if (!contentArea || !contentParent) {
			throw new Error("Invalid page shell structure");
		}

		if (this.pendingBreakTarget && this.workIndex < this.remainingWork.length) {
			const target = this.pendingBreakTarget;
			let isTarget = false;

			if (target === "right" || target === "recto") {
				isTarget = pageNumber % 2 === 1;
			} else if (target === "left" || target === "verso") {
				isTarget = pageNumber % 2 === 0;
			}

			if (!isTarget) {
				this.markBlankPage(pageShell);
				this.pendingBreakTarget = null;
				const pageRect = pageShell.getBoundingClientRect();
				const remainingCount = this.remainingWork.length - this.workIndex;

				return {
					breakToken: {
						page: pageNumber,
						cursor: `blank:${pageNumber}:${remainingCount}`,
						finished: false,
					},
					pageResult: {
						pageNumber,
						box: {
							width: pageRect.width,
							height: pageRect.height,
						},
						classes: Array.from(pageShell.classList),
						metadata: { blank: true },
					},
				};
			}

			this.pendingBreakTarget = null;
		}

		const areaRect = pageArea?.getBoundingClientRect();

		const areaPaddingBottom = pageArea
			? parseFloat(doc.defaultView?.getComputedStyle(pageArea).paddingBottom || "0") || 0
			: 0;

		const baseAreaContentBottom = areaRect
			? areaRect.bottom - areaPaddingBottom
			: Number.POSITIVE_INFINITY;

		const baseContentParentBottom = contentParent.getBoundingClientRect().bottom;

		const footnoteArea = pageShell.querySelector<HTMLElement>(
			".printedjs_footnote_area, .pagedjs_footnote_area",
		);

		let hasRenderedOnThisPage = false;
		let renderCountOnThisPage = 0;
		let isBlankPage = false;
		let currentPageName: string | null = targetPageName;
		const ancestorMap = new Map<HTMLElement, HTMLElement>();
		const ancestorsFromPreviousPages = new Set(this.startedAncestors);

		const recentAvoidBreakAfter: Array<{ clonedNode: HTMLElement; workNode: WorkNode }> =
			[];

		while (this.workIndex < this.remainingWork.length) {
			const current = this.remainingWork[this.workIndex];

			if (!current) {
				break;
			}

			// Check named page change
			const nodePageName = getNamedPage(current.node, current.ancestors);

			if (nodePageName !== currentPageName) {
				if (hasRenderedOnThisPage) {
					break;
				}

				currentPageName = nodePageName;

				if (nodePageName) {
					pageShell.setAttribute("data-page", nodePageName);
					pageShell.classList.add(`printedjs_${nodePageName}_page`);

					if (this.pagedjsCompatible) {
						pageShell.classList.add(`pagedjs_${nodePageName}_page`);
					}
				} else {
					pageShell.removeAttribute("data-page");

					if (targetPageName) {
						pageShell.classList.remove(`printedjs_${targetPageName}_page`);

						if (this.pagedjsCompatible) {
							pageShell.classList.remove(`pagedjs_${targetPageName}_page`);
						}
					}
				}
			}

			// Check forced break-before on newly entered ancestors
			let shouldBreakBefore = false;

			for (const ancestor of current.ancestors) {
				if (!this.startedAncestors.has(ancestor)) {
					const ancestorBreakBefore = getBreakBefore(ancestor, doc);

					if (ancestorBreakBefore) {
						if (ancestorBreakBefore === "page" || ancestorBreakBefore === "always") {
							if (hasRenderedOnThisPage) {
								shouldBreakBefore = true;
								break;
							}
						} else if (
							ancestorBreakBefore === "right" ||
							ancestorBreakBefore === "recto"
						) {
							if (hasRenderedOnThisPage) {
								shouldBreakBefore = true;
								break;
							}

							if (pageNumber % 2 === 0) {
								this.markBlankPage(pageShell);
								isBlankPage = true;
								shouldBreakBefore = true;
								break;
							}
						} else if (
							ancestorBreakBefore === "left" ||
							ancestorBreakBefore === "verso"
						) {
							if (hasRenderedOnThisPage) {
								shouldBreakBefore = true;
								break;
							}

							if (pageNumber % 2 === 1) {
								this.markBlankPage(pageShell);
								isBlankPage = true;
								shouldBreakBefore = true;
								break;
							}
						}
					}

					if (!shouldBreakBefore) {
						this.startedAncestors.add(ancestor);
					}
				}
			}

			if (shouldBreakBefore) {
				break;
			}

			// Check forced break-before on current node
			if (isElement(current.node) && !this.startedNodes.has(current.node)) {
				const breakBefore = getBreakBefore(current.node, doc);

				if (breakBefore) {
					if (breakBefore === "page" || breakBefore === "always") {
						if (hasRenderedOnThisPage) {
							break;
						}
					} else if (breakBefore === "right" || breakBefore === "recto") {
						if (hasRenderedOnThisPage) {
							break;
						}

						// Right page must be odd. If current page is even (left), make it a blank page
						if (pageNumber % 2 === 0) {
							this.markBlankPage(pageShell);
							isBlankPage = true;
							break;
						}
					} else if (breakBefore === "left" || breakBefore === "verso") {
						if (hasRenderedOnThisPage) {
							break;
						}

						// Left page must be even. If current page is odd (right), make it a blank page
						if (pageNumber % 2 === 1) {
							this.markBlankPage(pageShell);
							isBlankPage = true;
							break;
						}
					}
				}

				this.startedNodes.add(current.node);
			}

			// Determine target parent using ancestor chain
			let targetParent = contentArea;

			for (const ancestor of current.ancestors) {
				let existing = ancestorMap.get(ancestor);

				if (!existing) {
					// SAFETY: ancestor is an HTMLElement instance
					existing = ancestor.cloneNode(false) as HTMLElement;

					if (ancestor.tagName.toUpperCase() === "TABLE") {
						// SAFETY: querySelector returns matching thead HTMLElement or null
						const primaryThead = ancestor.querySelector(
							":scope > thead",
						) as HTMLElement | null;

						const repeatingThead = primaryThead
							? isTheadRepeating(primaryThead, doc)
							: false;

						const hasDataRows =
							primaryThead && repeatingThead
								? tableHasDataRows(ancestor, primaryThead)
								: false;

						// SAFETY: querySelector returns matching tfoot HTMLElement or null
						const primaryTfoot = ancestor.querySelector(
							":scope > tfoot",
						) as HTMLElement | null;

						const repeatingTfoot = primaryTfoot
							? isTfootRepeating(primaryTfoot, doc)
							: false;

						const hasTfootDataRows =
							primaryTfoot && repeatingTfoot
								? tableHasDataRows(ancestor, primaryTfoot)
								: false;

						for (const child of Array.from(ancestor.children)) {
							const childTag = child.tagName.toUpperCase();

							if (
								childTag === "COLGROUP" ||
								(childTag === "THEAD" && child === primaryThead && hasDataRows) ||
								(childTag === "TFOOT" && child === primaryTfoot && hasTfootDataRows)
							) {
								existing.appendChild(child.cloneNode(true));
							}
						}

						const savedWidths = this.tableColumnWidths.get(ancestor);

						if (savedWidths && savedWidths.length > 0) {
							applyTableColgroup(existing, savedWidths, doc);

							if (
								existing.getAttribute("data-sync-columns") !== "false" &&
								existing.getAttribute("data-table-layout") !== "auto"
							) {
								existing.style.tableLayout = "fixed";
							}
						}
					}

					if (ancestorsFromPreviousPages.has(ancestor)) {
						existing.setAttribute("data-split-from", "");
						const ancTag = ancestor.tagName.toUpperCase();

						if (ancTag === "LI") {
							existing.style.listStyleType = "none";
						}

						if (existing.hasAttribute("id")) {
							existing.setAttribute("data-id", existing.getAttribute("id")!);
							existing.removeAttribute("id");
						}
					}

					targetParent.appendChild(existing);

					if (targetParent.tagName.toUpperCase() === "TABLE") {
						const tf = targetParent.querySelector(":scope > tfoot");

						if (tf) {
							targetParent.appendChild(tf);
						}
					}

					ancestorMap.set(ancestor, existing);
				}

				targetParent = existing;
			}

			// SAFETY: current.node cloned as HTMLElement for insertion into page layout
			const clonedNode = current.node.cloneNode(true) as HTMLElement;

			const isTr = isElement(current.node) && current.node.tagName.toUpperCase() === "TR";

			const isFirstRowInParentOnThisPage =
				isTr &&
				targetParent.querySelectorAll(":scope > tr").length === 0 &&
				(current.ancestors.some((a) => ancestorsFromPreviousPages.has(a)) ||
					targetParent.hasAttribute("data-split-from") ||
					Boolean(targetParent.closest("table[data-split-from]")));

			if (isFirstRowInParentOnThisPage) {
				// SAFETY: current.node confirmed as HTMLElement via isTr
				const carriedSpans = this.carriedRowSpans.get(current.node as HTMLElement);

				if (carriedSpans && carriedSpans.length > 0) {
					for (const span of carriedSpans) {
						// SAFETY: sourceCell is an HTMLElement instance
						const contCell = span.sourceCell.cloneNode(false) as HTMLElement;
						contCell.setAttribute("rowspan", String(span.remainingRows));

						if (span.colSpan > 1) {
							contCell.setAttribute("colspan", String(span.colSpan));
						}

						contCell.setAttribute("data-split-from", "");
						contCell.classList.add("printedjs-rowspan-continuation");

						if (contCell.hasAttribute("id")) {
							contCell.removeAttribute("id");
						}

						if (
							span.sourceCell.getAttribute("data-repeat-content") === "true" ||
							span.sourceCell.classList.contains("repeat-content")
						) {
							contCell.innerHTML = span.sourceCell.innerHTML;
						} else {
							contCell.innerHTML = "&nbsp;";
						}

						insertContinuationCell(clonedNode, contCell, span.colStart);
					}
				}
			}

			targetParent.appendChild(clonedNode);

			// Measure overflow
			const footnoteHeight =
				footnoteArea && footnoteArea.children.length > 0
					? footnoteArea.getBoundingClientRect().height
					: 0;

			const maxBottom = Math.min(
				baseContentParentBottom,
				baseAreaContentBottom - footnoteHeight,
			);

			let currentBottom = isElement(clonedNode)
				? clonedNode.getBoundingClientRect().bottom
				: targetParent.getBoundingClientRect().bottom;

			const tableEl = targetParent.closest("table");

			if (tableEl) {
				const tfootEl = tableEl.querySelector(":scope > tfoot");

				if (tfootEl) {
					currentBottom = Math.max(currentBottom, tfootEl.getBoundingClientRect().bottom);
				}
			}

			const isOverflowing =
				currentBottom > maxBottom + 0.5 ||
				(currentBottom >= maxBottom - 5 &&
					contentParent.scrollHeight > contentParent.clientHeight + 0.5);

			if (!isOverflowing) {
				// Fits on page
				this.workIndex++;
				hasRenderedOnThisPage = true;
				renderCountOnThisPage++;
				pageShell.setAttribute("data-last-work-id", String(current.id));

				// Check break-after on current node
				let shouldBreakAfter = false;

				if (isElement(current.node)) {
					const breakAfter = getBreakAfter(current.node, doc);

					if (breakAfter === "page" || breakAfter === "always") {
						shouldBreakAfter = true;
					} else if (breakAfter === "right" || breakAfter === "recto") {
						shouldBreakAfter = true;
						this.pendingBreakTarget = breakAfter;
					} else if (breakAfter === "left" || breakAfter === "verso") {
						shouldBreakAfter = true;
						this.pendingBreakTarget = breakAfter;
					}

					const isTheadRow =
						isElement(current.node) &&
						(current.node.tagName.toUpperCase() === "CAPTION" ||
							current.node.tagName.toUpperCase() === "THEAD" ||
							current.node.parentElement?.tagName.toUpperCase() === "THEAD");

					if (breakAfter === "avoid" || isTheadRow) {
						// SAFETY: clonedNode inserted into layout is an HTMLElement
						recentAvoidBreakAfter.push({
							clonedNode: clonedNode as HTMLElement,
							workNode: current,
						});
					} else {
						recentAvoidBreakAfter.length = 0;
					}
				}

				// Check break-after on closing ancestors
				const nextWork =
					this.workIndex < this.remainingWork.length
						? this.remainingWork[this.workIndex]
						: undefined;

				for (const ancestor of current.ancestors) {
					if (!nextWork || !nextWork.ancestors.includes(ancestor)) {
						const ancestorBreakAfter = getBreakAfter(ancestor, doc);

						if (ancestorBreakAfter === "page" || ancestorBreakAfter === "always") {
							shouldBreakAfter = true;
							break;
						} else if (
							ancestorBreakAfter === "right" ||
							ancestorBreakAfter === "recto" ||
							ancestorBreakAfter === "left" ||
							ancestorBreakAfter === "verso"
						) {
							shouldBreakAfter = true;
							this.pendingBreakTarget = ancestorBreakAfter;
							break;
						}
					}
				}

				if (shouldBreakAfter) {
					this.purgeUndisplayedLeadingWork();
					break;
				}

				continue;
			}

			// Try splitting table row with nested table
			if (isElement(clonedNode) && clonedNode.tagName.toUpperCase() === "TR") {
				const splitRemaining = this.splitTableRowWithNestedTable(clonedNode, maxBottom);

				if (splitRemaining) {
					// Part fit on this page, remainder goes to next page in-place
					this.remainingWork[this.workIndex] = {
						id: current.id,
						node: splitRemaining,
						ancestors: current.ancestors,
					};
					pageShell.setAttribute("data-last-work-id", String(current.id));
					hasRenderedOnThisPage = true;
					break;
				}
			}

			// Try splitting text element
			if (
				isElement(clonedNode) &&
				clonedNode.children.length === 0 &&
				clonedNode.tagName.toUpperCase() !== "TR" &&
				clonedNode.textContent &&
				clonedNode.textContent.trim().length > 0
			) {
				const splitRemaining = this.splitTextElement(clonedNode, maxBottom);

				if (splitRemaining) {
					// Part fit on this page, remainder goes to next page in-place
					this.remainingWork[this.workIndex] = {
						id: current.id,
						node: splitRemaining,
						ancestors: current.ancestors,
					};
					pageShell.setAttribute("data-last-work-id", String(current.id));
					hasRenderedOnThisPage = true;
					break;
				}
			}

			// Node overflows and cannot be split
			if (
				recentAvoidBreakAfter.length > 0 &&
				renderCountOnThisPage > recentAvoidBreakAfter.length
			) {
				clonedNode.parentNode?.removeChild(clonedNode);
				this.startedNodes.delete(current.node);

				for (let i = recentAvoidBreakAfter.length - 1; i >= 0; i--) {
					const item = recentAvoidBreakAfter[i]!;
					item.clonedNode.parentNode?.removeChild(item.clonedNode);
					this.startedNodes.delete(item.workNode.node);
					this.workIndex--;
				}

				this.cleanupOrphanTableAndEmptyAncestors(targetParent, contentArea, ancestorMap);

				if (contentArea.children.length === 0) {
					hasRenderedOnThisPage = false;
					renderCountOnThisPage = 0;
				}

				break;
			}

			const breakInside = isElement(current.node)
				? getBreakInside(current.node, doc)
				: null;

			const ancestorBreakInsideAvoid = current.ancestors.some((a) => {
				const bi = getBreakInside(a, doc);

				return (
					bi === "avoid" ||
					bi === "avoid-page" ||
					a.getAttribute("data-break-inside") === "avoid"
				);
			});

			// If break-inside: avoid, don't split unless empty page
			if (
				breakInside === "avoid" ||
				breakInside === "avoid-page" ||
				ancestorBreakInsideAvoid
			) {
				if (hasRenderedOnThisPage) {
					clonedNode.parentNode?.removeChild(clonedNode);
					this.startedNodes.delete(current.node);
					this.cleanupOrphanTableAndEmptyAncestors(
						targetParent,
						contentArea,
						ancestorMap,
					);

					if (contentArea.children.length === 0) {
						hasRenderedOnThisPage = false;
						renderCountOnThisPage = 0;
					}

					break;
				}
			}

			// If it couldn't be split:
			if (hasRenderedOnThisPage) {
				// Remove from current page and defer to next page
				clonedNode.parentNode?.removeChild(clonedNode);
				this.startedNodes.delete(current.node);
				this.cleanupOrphanTableAndEmptyAncestors(targetParent, contentArea, ancestorMap);

				if (contentArea.children.length === 0) {
					hasRenderedOnThisPage = false;
					renderCountOnThisPage = 0;
				}

				break;
			} else {
				// Empty page: keep it to ensure progress
				this.workIndex++;
				hasRenderedOnThisPage = true;
				pageShell.setAttribute("data-last-work-id", String(current.id));
				break;
			}
		}

		const remainingCount = this.remainingWork.length - this.workIndex;
		const isFinished = remainingCount <= 0;

		const nextNode =
			this.workIndex < this.remainingWork.length
				? this.remainingWork[this.workIndex]?.node
				: undefined;

		const textLen = (nextNode && nextNode.textContent?.length) ?? 0;

		const breakToken: BreakToken | null = isFinished
			? null
			: {
					page: pageNumber,
					cursor: isBlankPage
						? `blank:${pageNumber}:${remainingCount}`
						: `node:${remainingCount}:t:${textLen}`,
					finished: false,
				};

		clampTableOpenRowspans(pageShell);

		for (const [sourceAncestor, renderedAncestor] of ancestorMap.entries()) {
			if (sourceAncestor.tagName.toUpperCase() === "TABLE") {
				if (!this.tableColumnWidths.has(sourceAncestor)) {
					const widths = extractTableColumnWidths(renderedAncestor);

					if (widths.length > 0 && widths.every((w) => w > 0)) {
						this.tableColumnWidths.set(sourceAncestor, widths);
						applyTableColgroup(renderedAncestor, widths, doc);

						if (
							renderedAncestor.getAttribute("data-sync-columns") !== "false" &&
							renderedAncestor.getAttribute("data-table-layout") !== "auto"
						) {
							renderedAncestor.style.tableLayout = "fixed";
						}
					}
				}
			}
		}

		const pageRect = pageShell.getBoundingClientRect();

		const pageResult = {
			pageNumber,
			box: {
				width: pageRect.width,
				height: pageRect.height,
			},
			classes: Array.from(pageShell.classList),
			metadata: isBlankPage ? { blank: true } : {},
		};

		return {
			breakToken,
			pageResult,
		};
	}

	private flattenNodes(root: Node, ancestors: HTMLElement[]): WorkNode[] {
		const result: WorkNode[] = [];
		let nextId = 0;

		const traverse = (node: Node, currAncestors: HTMLElement[]) => {
			let children: ChildNode[] = Array.from(node.childNodes);

			if (isElement(node) && node.tagName.toUpperCase() === "TABLE") {
				const colgroups: ChildNode[] = [];
				const theads: ChildNode[] = [];
				const tbodies: ChildNode[] = [];
				const tfoots: ChildNode[] = [];
				const others: ChildNode[] = [];

				for (const child of children) {
					if (isElement(child)) {
						const tag = child.tagName.toUpperCase();

						if (tag === "COLGROUP" || tag === "CAPTION") colgroups.push(child);
						else if (tag === "THEAD") theads.push(child);
						else if (tag === "TFOOT") tfoots.push(child);
						else if (tag === "TBODY" || tag === "TR") tbodies.push(child);
						else others.push(child);
					} else {
						others.push(child);
					}
				}

				children = [...colgroups, ...others, ...theads, ...tbodies, ...tfoots];
			}

			for (let i = 0; i < children.length; i++) {
				const child = children[i];

				if (!child) {
					continue;
				}

				// Ignore empty whitespace-only text nodes at root level
				if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) {
					continue;
				}

				if (isElement(child)) {
					const tag = child.tagName.toUpperCase();

					if (
						tag === "SCRIPT" ||
						tag === "STYLE" ||
						tag === "NOSCRIPT" ||
						tag === "TEMPLATE" ||
						child.style?.display === "none"
					) {
						continue;
					}

					const isPrimaryThead =
						tag === "THEAD" &&
						child.parentElement?.querySelector(":scope > thead") === child;

					const repeatingThead =
						isPrimaryThead && isTheadRepeating(child, this.surface.document);

					const hasTheadDataRows =
						repeatingThead && child.parentElement
							? tableHasDataRows(child.parentElement, child)
							: false;

					const isPrimaryTfoot =
						tag === "TFOOT" &&
						child.parentElement?.querySelector(":scope > tfoot") === child;

					const repeatingTfoot =
						isPrimaryTfoot && isTfootRepeating(child, this.surface.document);

					const hasTfootDataRows =
						repeatingTfoot && child.parentElement
							? tableHasDataRows(child.parentElement, child)
							: false;

					if (
						tag === "COLGROUP" ||
						(repeatingThead && hasTheadDataRows) ||
						(repeatingTfoot && hasTfootDataRows)
					) {
						continue;
					}

					if (child.childNodes.length > 0 && this.isBlockContainer(child)) {
						const nextAncestors = [...currAncestors, child];
						traverse(child, nextAncestors);
						continue;
					}
				}

				result.push({ id: nextId++, node: child, ancestors: currAncestors });
			}
		};

		traverse(root, ancestors);

		return result;
	}

	private isBlockContainer(element: HTMLElement): boolean {
		const tag = element.tagName.toUpperCase();

		if (
			tag === "SECTION" ||
			tag === "DIV" ||
			tag === "ARTICLE" ||
			tag === "MAIN" ||
			tag === "HEADER" ||
			tag === "TABLE" ||
			tag === "THEAD" ||
			tag === "TBODY" ||
			tag === "TFOOT" ||
			tag === "UL" ||
			tag === "OL" ||
			tag === "DL"
		) {
			return true;
		}

		if (tag === "LI") {
			return Array.from(element.children).some(
				(child) =>
					child.tagName === "UL" ||
					child.tagName === "OL" ||
					child.tagName === "DL" ||
					child.tagName === "DIV" ||
					child.tagName === "TABLE" ||
					child.tagName === "P",
			);
		}

		return false;
	}

	private splitTextElement(element: HTMLElement, maxBottom: number): HTMLElement | null {
		const fullText = element.textContent ?? "";
		const words = fullText.split(/(\s+)/);

		if (words.length <= 1) {
			return null;
		}

		const prefixLengths: number[] = [0];

		for (let i = 0; i < words.length; i++) {
			prefixLengths.push(prefixLengths[i]! + words[i]!.length);
		}

		let low = 1;
		let high = words.length;
		let bestFit = 0;
		const originalText = element.textContent;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			element.textContent = fullText.slice(0, prefixLengths[mid]);
			const currentBottom = element.getBoundingClientRect().bottom;

			if (currentBottom <= maxBottom + 0.5) {
				bestFit = mid;
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}

		if (bestFit === 0) {
			element.textContent = originalText;

			return null;
		}

		const fittingText = fullText.slice(0, prefixLengths[bestFit]);
		const remainingText = fullText.slice(prefixLengths[bestFit]).trimStart();

		if (!remainingText) {
			element.textContent = originalText;

			return null;
		}

		element.textContent = fittingText;
		element.setAttribute("data-split-to", "");
		element.setAttribute("data-last-split-element", "true");

		const doc = this.surface.document;
		const computedStyle = doc.defaultView?.getComputedStyle(element);
		const textAlign = computedStyle?.textAlign;
		const textAlignLast = computedStyle?.textAlignLast;

		if (textAlign === "justify" && (!textAlignLast || textAlignLast === "auto")) {
			element.setAttribute("data-align-last-split-element", "justify");
		} else if (textAlignLast && textAlignLast !== "auto") {
			element.setAttribute("data-align-last-split-element", textAlignLast);
		}

		// SAFETY: element is an HTMLElement whose clone is an HTMLElement
		const remainingElement = element.cloneNode(false) as HTMLElement;
		remainingElement.removeAttribute("data-split-to");
		remainingElement.removeAttribute("data-last-split-element");
		remainingElement.removeAttribute("data-align-last-split-element");
		remainingElement.textContent = remainingText;
		remainingElement.setAttribute("data-split-from", "");

		if (element.tagName.toUpperCase() === "LI") {
			remainingElement.style.listStyleType = "none";
		}

		return remainingElement;
	}

	private computeExtraBottomBelow(
		element: HTMLElement,
		boundaryAncestor: HTMLElement,
	): number {
		let extraBottom = 0;

		let curr: HTMLElement | null = element.parentElement;

		const doc = this.surface.document;

		const win = doc.defaultView ?? window;

		while (curr && curr !== boundaryAncestor.parentElement) {
			const style = win.getComputedStyle(curr);

			extraBottom +=
				(Number.parseFloat(style.paddingBottom) || 0) +
				(Number.parseFloat(style.borderBottomWidth) || 0);

			curr = curr.parentElement;
		}

		return extraBottom;
	}

	private splitTableRowWithNestedTable(
		row: HTMLElement,
		maxBottom: number,
	): HTMLElement | null {
		const nestedTable = row.querySelector("table");

		if (!nestedTable) {
			return null;
		}

		const tbody = nestedTable.querySelector(":scope > tbody") ?? nestedTable;
		// SAFETY: querySelectorAll returns matching tr HTMLElement instances
		const innerRows = Array.from(tbody.querySelectorAll(":scope > tr")) as HTMLElement[];

		const outerTable = row.closest("table") ?? row;

		const outerExtraBottom = this.computeExtraBottomBelow(nestedTable, outerTable);

		const safetyBuffer = 8;

		const effectiveMaxBottom = maxBottom - outerExtraBottom - safetyBuffer;

		let splitIndex = 0;

		let deepSplitRemaining: HTMLElement | null = null;

		let deepSplitRowIndex = -1;

		for (let i = 0; i < innerRows.length; i++) {
			const innerRow = innerRows[i]!;
			const rowBottom = innerRow.getBoundingClientRect().bottom;

			if (rowBottom <= effectiveMaxBottom) {
				splitIndex = i + 1;
			} else {
				if (innerRow.querySelector("table")) {
					const deepSplit = this.splitTableRowWithNestedTable(
						innerRow,
						effectiveMaxBottom,
					);

					if (deepSplit) {
						deepSplitRemaining = deepSplit;
						deepSplitRowIndex = i;
						splitIndex = i + 1;
					}
				}

				break;
			}
		}

		if (splitIndex < 1 || (splitIndex >= innerRows.length && !deepSplitRemaining)) {
			return null;
		}

		// SAFETY: row is cloned as HTMLElement for continuation on next page
		const splitRemaining = row.cloneNode(true) as HTMLElement;

		splitRemaining.setAttribute("data-split-from", "");

		if (deepSplitRemaining) {
			for (let i = deepSplitRowIndex + 1; i < innerRows.length; i++) {
				innerRows[i]?.remove();
			}
		} else {
			for (let i = splitIndex; i < innerRows.length; i++) {
				innerRows[i]?.remove();
			}
		}

		const isRootTable = !outerTable.parentElement?.closest("table");

		while (
			splitIndex > 1 &&
			(row.getBoundingClientRect().bottom > effectiveMaxBottom ||
				(isRootTable && outerTable.getBoundingClientRect().bottom > maxBottom - 4))
		) {
			splitIndex--;
			innerRows[splitIndex]?.remove();

			if (deepSplitRemaining && deepSplitRowIndex >= splitIndex) {
				deepSplitRemaining = null;
			}
		}

		let next = nestedTable.nextElementSibling;

		while (next) {
			const toRemove = next;

			next = next.nextElementSibling;
			toRemove.remove();
		}

		const remNestedTable = splitRemaining.querySelector("table");

		if (remNestedTable) {
			remNestedTable.setAttribute("data-split-from", "");

			// SAFETY: querySelector returns matching thead HTMLElement or null
			const remThead = remNestedTable.querySelector(
				":scope > thead",
			) as HTMLElement | null;

			if (remThead) {
				const repeatThead = isTheadRepeating(remThead, this.surface.document);

				if (!repeatThead) {
					remThead.remove();
				}
			}

			const remTbody = remNestedTable.querySelector(":scope > tbody") ?? remNestedTable;

			// SAFETY: querySelectorAll returns matching tr HTMLElement instances
			const remInnerRows = Array.from(
				remTbody.querySelectorAll(":scope > tr"),
			) as HTMLElement[];

			if (deepSplitRemaining) {
				for (let i = 0; i < deepSplitRowIndex; i++) {
					remInnerRows[i]?.remove();
				}

				remInnerRows[deepSplitRowIndex]?.replaceWith(deepSplitRemaining);
			} else {
				for (let i = 0; i < splitIndex; i++) {
					remInnerRows[i]?.remove();
				}
			}

			let prev = remNestedTable.previousElementSibling;

			while (prev) {
				const toRemove = prev;

				prev = prev.previousElementSibling;
				toRemove.remove();
			}
		}

		// SAFETY: child elements of splitRemaining row are cell HTMLElement instances
		for (const cell of Array.from(splitRemaining.children) as HTMLElement[]) {
			if (!cell.querySelector("table")) {
				cell.setAttribute("data-split-from", "");
				cell.classList.add("printedjs-cell-continuation");
			}
		}

		return splitRemaining;
	}

	private cleanupOrphanTableAndEmptyAncestors(
		targetParent: HTMLElement,
		contentArea: HTMLElement,
		ancestorMap?: Map<HTMLElement, HTMLElement>,
	): void {
		const tableEl = targetParent.closest("table");

		if (tableEl) {
			const dataRows = tableEl.querySelectorAll("tbody > tr, :scope > tr");

			if (dataRows.length === 0) {
				if (ancestorMap) {
					for (const [source, cloned] of ancestorMap.entries()) {
						if (cloned === tableEl || tableEl.contains(cloned)) {
							ancestorMap.delete(source);
							this.startedAncestors.delete(source);
						}
					}
				}

				let cleanupTarget: HTMLElement | null = tableEl.parentElement;
				tableEl.remove();

				while (cleanupTarget && cleanupTarget !== contentArea) {
					const parent: HTMLElement | null = cleanupTarget.parentElement;

					if (cleanupTarget.childNodes.length === 0) {
						if (ancestorMap) {
							for (const [source, cloned] of ancestorMap.entries()) {
								if (cloned === cleanupTarget) {
									ancestorMap.delete(source);
									this.startedAncestors.delete(source);
								}
							}
						}

						cleanupTarget.remove();
						cleanupTarget = parent;
					} else {
						break;
					}
				}
			}
		}
	}
}
