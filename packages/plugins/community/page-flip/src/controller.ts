import { formatPageNumber, type PageCounterStyle } from "@printedjs/core";
import { PageFlip } from "./engine/PageFlip.js";
import { playPageTurnSound } from "./sound.js";

export interface PageFlipOptions {
	flippingTime?: number | undefined;
	turnDurationMs?: number | undefined;
	sound?: boolean | undefined;
	showCover?: boolean | undefined;
	drawShadow?: boolean | undefined;
	showPageCorners?: boolean | undefined;
	usePortrait?: boolean | undefined;
	keyboardNavigation?: boolean | undefined;
	startPage?: number | undefined;
}

export interface FlipBookController {
	readonly currentPage: number;
	readonly currentSpread: number;
	readonly totalSpreads: number;
	next(): Promise<void>;
	prev(): Promise<void>;
	flipTo(pageNumber: number): Promise<void>;
	destroy(): void;
}

interface PageRuleEntry {
	selector: string;
	contentPattern: string;
}

function collectCssRules(
	rules: CSSRuleList | CSSRule[] | null | undefined,
): CSSStyleRule[] {
	if (!rules) return [];
	const list: CSSStyleRule[] = [];
	for (const rule of Array.from(rules)) {
		if ("selectorText" in rule && "style" in rule) {
			list.push(rule as CSSStyleRule);
		} else if ("cssRules" in rule && (rule as CSSGroupingRule).cssRules) {
			list.push(...collectCssRules((rule as CSSGroupingRule).cssRules));
		}
	}
	return list;
}

function resolveCounterText(
	pattern: string | null,
	folio: string,
	logicalNumber: number,
	totalPages: number,
): string {
	if (!pattern) return folio;

	const pageMatch = pattern.match(
		/counter\s*\(\s*page\s*(?:,\s*([a-zA-Z0-9_-]+))?\s*\)/i,
	);
	let pageStr = folio;
	if (pageMatch && pageMatch[1]) {
		const counterStyle = pageMatch[1].toLowerCase() as PageCounterStyle;
		pageStr = formatPageNumber(logicalNumber, counterStyle);
	}

	let text = pattern;
	text = text.replace(
		/counter\s*\(\s*pages\s*(?:,\s*([a-zA-Z0-9_-]+))?\s*\)/gi,
		(_, rawStyle) => {
			const pagesStyle = (
				rawStyle ? rawStyle.toLowerCase() : "decimal"
			) as PageCounterStyle;
			return formatPageNumber(totalPages, pagesStyle);
		},
	);
	text = text.replace(/counter\s*\(\s*page\s*(?:,\s*[a-zA-Z0-9_-]+)?\s*\)/gi, pageStr);

	text = text.replace(/["']/g, "").replace(/\s+/g, " ").trim();

	return text || folio;
}

function freezePageFolios(container: HTMLElement, pages: HTMLElement[]): void {
	const doc =
		container.ownerDocument ?? (typeof document !== "undefined" ? document : null);
	if (!doc) return;

	const pageRuleEntries: PageRuleEntry[] = [];
	try {
		for (const sheet of Array.from(doc.styleSheets)) {
			try {
				const styleRules = collectCssRules(sheet.cssRules);
				for (const rule of styleRules) {
					const content = (
						rule.style.content ||
						rule.style.getPropertyValue("content") ||
						""
					).trim();
					if (content && /counter\s*\(\s*page\b/i.test(content)) {
						for (const rawSel of rule.selectorText.split(",")) {
							const selector = rawSel.replace(/::?(?:after|before)\s*$/i, "").trim();
							if (selector) {
								pageRuleEntries.push({ selector, contentPattern: content });
							}
						}
					}
				}
			} catch {
				// Ignore cross-origin stylesheet access restriction
			}
		}
	} catch {
		// Ignore
	}

	const view = doc.defaultView;
	const totalPages = pages.length;

	for (let i = 0; i < pages.length; i++) {
		const page = pages[i];
		if (!page) continue;
		if (typeof page.querySelectorAll !== "function") continue;
		const formatted = page.getAttribute("data-page-formatted")?.trim();
		const logicalAttr = page.getAttribute("data-page-number")?.trim();
		const logicalNum = logicalAttr ? parseInt(logicalAttr, 10) : i + 1;
		const folio =
			formatted || (Number.isFinite(logicalNum) ? String(logicalNum) : String(i + 1));

		page
			.querySelectorAll<HTMLElement>(".printedjs_margin-content, .pagedjs_margin-content")
			.forEach((node) => {
				if (node.getAttribute("data-folio-frozen") === "true") return;
				if (node.firstElementChild !== null) return;
				if (node.textContent?.trim()) return;

				const computed = view?.getComputedStyle(node, "::after")?.content ?? "";
				const cleaned = computed.replace(/^["']|["']$/g, "").trim();
				if (cleaned === "none" || cleaned === "normal") return;

				let matchedEntry: PageRuleEntry | null = null;
				for (const entry of pageRuleEntries) {
					try {
						if (typeof node.matches === "function" && node.matches(entry.selector)) {
							matchedEntry = entry;
							break;
						}
					} catch {
						// Ignore invalid selector
					}
				}

				const hasCounterExpr =
					/counter\s*\(\s*page\b/i.test(computed) ||
					/counter\s*\(\s*page\b/i.test(cleaned);

				const isPageCounter = matchedEntry !== null || hasCounterExpr;

				const isFolio =
					cleaned.length > 0 &&
					(cleaned === folio ||
						(logicalAttr !== undefined && cleaned === logicalAttr) ||
						(Number.isFinite(Number(cleaned)) && String(Number(cleaned)) === folio));

				if (isPageCounter || isFolio) {
					const pattern =
						matchedEntry?.contentPattern ?? (hasCounterExpr ? cleaned : null);
					const frozenText = resolveCounterText(
						pattern,
						folio,
						Number.isFinite(logicalNum) ? logicalNum : i + 1,
						totalPages,
					);
					node.textContent = frozenText;
					node.setAttribute("data-folio-frozen", "true");
				}
			});
	}
}

export class PageFlipController implements FlipBookController {
	private readonly container: HTMLElement;
	private readonly options: PageFlipOptions;
	private pageFlip: PageFlip | null = null;
	private keydownListener: ((e: KeyboardEvent) => void) | null = null;
	private pageElements: HTMLElement[] = [];
	private _currentPage = 1;
	private _currentSpread = 0;

	constructor(container: HTMLElement, options: PageFlipOptions = {}) {
		this.container = container;
		this.options = options;
		this.init();
	}

	get currentPage(): number {
		return this._currentPage;
	}

	get currentSpread(): number {
		return this._currentSpread;
	}

	get totalSpreads(): number {
		const total = this.pageElements.length;
		if (total === 0) return 0;
		const isPortrait =
			this.pageFlip?.getOrientation() === "portrait" ||
			(typeof window !== "undefined" && window.innerWidth <= 768);
		if (isPortrait) return total;
		return 1 + Math.ceil(Math.max(0, total - 1) / 2);
	}

	public getPageFlip(): PageFlip | null {
		return this.pageFlip;
	}

	private pageLabel(index: number): number {
		const page = this.pageElements[index];
		if (!page) return index + 1;
		const formatted = page.getAttribute("data-page-formatted")?.trim();
		const printed = Number(formatted);
		if (formatted && Number.isFinite(printed) && printed > 0) return printed;
		const logical = Number(page.getAttribute("data-page-number"));
		if (Number.isFinite(logical) && logical > 0) return logical;
		return index + 1;
	}

	private visibleRange(): { left: number | null; right: number | null; current: number } {
		const total = this.pageElements.length;
		if (total === 0) return { left: null, right: null, current: 1 };

		const isPortrait =
			this.pageFlip?.getOrientation() === "portrait" ||
			(typeof window !== "undefined" && window.innerWidth <= 768);

		if (isPortrait) {
			const idx = Math.max(
				0,
				Math.min(
					total - 1,
					this.pageFlip ? this.pageFlip.getCurrentPageIndex() : this._currentPage - 1,
				),
			);
			const current = this.pageLabel(idx);
			return { left: null, right: current, current };
		}

		if (this.pageFlip) {
			const collection = this.pageFlip.getPageCollection();
			const spreadIndex = collection?.getCurrentSpreadIndex() ?? this._currentSpread;
			const spreads = collection?.getSpread() ?? [];
			const spread = spreads[spreadIndex];

			if (spread && spread.length > 0) {
				if (spread.length === 1) {
					const idx = spread[0]!;
					const label = this.pageLabel(idx);
					if (idx === total - 1 && total > 1) {
						return { left: label, right: null, current: label };
					}
					return { left: null, right: label, current: label };
				}
				const left = this.pageLabel(spread[0]!);
				const right = this.pageLabel(spread[1]!);
				return { left, right, current: left };
			}
		}

		if (this._currentSpread === 0) {
			const right = this.pageLabel(0);
			return { left: null, right, current: right };
		}
		const candidateLeft = (this._currentSpread - 1) * 2 + 1;
		const candidateRight = candidateLeft + 1;
		if (candidateLeft === total - 1 && total > 2) {
			const left = this.pageLabel(candidateLeft);
			return { left, right: null, current: left };
		}
		const left = candidateLeft < total ? this.pageLabel(candidateLeft) : null;
		const right = candidateRight < total ? this.pageLabel(candidateRight) : null;
		return { left, right, current: left ?? right ?? 1 };
	}

	private emitChange(): void {
		const range = this.visibleRange();
		this._currentPage = range.current;
		this.container.dispatchEvent(
			new CustomEvent("flipbook:change", {
				detail: {
					currentSpread: this._currentSpread,
					totalSpreads: this.totalSpreads,
					currentPage: this._currentPage,
					leftPage: range.left,
					rightPage: range.right,
				},
				bubbles: true,
			}),
		);
	}

	private init(): void {
		this.pageElements = Array.from(
			this.container.querySelectorAll<HTMLElement>(
				":scope > :is(.printedjs_page, .pagedjs_page)",
			),
		);
		if (this.pageElements.length === 0) return;

		const firstPage = this.pageElements[0];
		const rect = firstPage?.getBoundingClientRect?.();
		const pageWidth = Math.round(
			rect?.width ||
				firstPage?.offsetWidth ||
				parseFloat(firstPage?.style?.width || "794") ||
				794,
		);
		const pageHeight = Math.round(
			rect?.height ||
				firstPage?.offsetHeight ||
				parseFloat(firstPage?.style?.height || "1123") ||
				1123,
		);

		this.container.setAttribute("data-view-mode", "flipbook");

		const isMobile =
			this.options.usePortrait === true ||
			(typeof window !== "undefined" && window.innerWidth <= 768);
		const bookWidth = isMobile ? pageWidth : pageWidth * 2;
		this.container.style.width = `${bookWidth}px`;
		this.container.style.minWidth = `${bookWidth}px`;
		this.container.style.maxWidth = `${bookWidth}px`;
		this.container.style.height = `${pageHeight}px`;
		this.container.style.minHeight = `${pageHeight}px`;

		freezePageFolios(this.container, this.pageElements);

		try {
			this.pageFlip = new PageFlip(this.container, {
				width: pageWidth > 0 ? pageWidth : 794,
				height: pageHeight > 0 ? pageHeight : 1123,
				size: "fixed",
				showCover: this.options.showCover !== false,
				autoSize: false,
				usePortrait: this.options.usePortrait === true,
				drawShadow: this.options.drawShadow !== false,
				maxShadowOpacity: 0.5,
				showPageCorners: this.options.showPageCorners !== false,
				flippingTime: this.options.turnDurationMs ?? this.options.flippingTime ?? 600,
				useMouseEvents: true,
				mobileScrollSupport: true,
				clickEventForward: true,
				disableFlipByClick: false,
				startPage: this.options.startPage ?? 0,
			});

			this.pageFlip.loadFromHTML(this.pageElements);

			this.pageFlip.on("flip", () => {
				const collection = this.pageFlip?.getPageCollection();
				this._currentSpread = collection?.getCurrentSpreadIndex() ?? 0;

				if (this.options.sound !== false) {
					playPageTurnSound();
				}

				this.emitChange();
			});

			this.emitChange();
		} catch {
			this.pageFlip = null;
			this.updateFallbackDisplay();
			this.emitChange();
		}

		if (this.options.keyboardNavigation !== false && typeof window !== "undefined") {
			this.keydownListener = (e: KeyboardEvent) => {
				if (
					e.target instanceof HTMLInputElement ||
					e.target instanceof HTMLTextAreaElement
				) {
					return;
				}
				if (e.key === "ArrowRight" || e.key === "PageDown") {
					e.preventDefault();
					void this.next();
				} else if (e.key === "ArrowLeft" || e.key === "PageUp") {
					e.preventDefault();
					void this.prev();
				}
			};
			window.addEventListener("keydown", this.keydownListener);
		}
	}

	private updateFallbackDisplay(): void {
		if (this.pageFlip) return;
		const total = this.pageElements.length;
		if (total === 0) return;

		for (let i = 0; i < total; i++) {
			const page = this.pageElements[i];
			if (!page) continue;
			page.removeAttribute?.("data-flipbook-side");
			if (page.style) page.style.display = "none";
		}

		if (this._currentSpread === 0) {
			const first = this.pageElements[0];
			if (first) {
				first.setAttribute?.("data-flipbook-side", "right");
				if (first.style) first.style.display = "block";
			}
			return;
		}

		const leftIdx = (this._currentSpread - 1) * 2 + 1;
		const rightIdx = leftIdx + 1;

		if (leftIdx === total - 1 && total > 2) {
			const last = this.pageElements[leftIdx];
			if (last) {
				last.setAttribute?.("data-flipbook-side", "right");
				if (last.style) last.style.display = "block";
			}
			return;
		}

		if (leftIdx < total) {
			const left = this.pageElements[leftIdx];
			if (left) {
				left.setAttribute?.("data-flipbook-side", "left");
				if (left.style) left.style.display = "block";
			}
		}

		if (rightIdx < total) {
			const right = this.pageElements[rightIdx];
			if (right) {
				right.setAttribute?.("data-flipbook-side", "right");
				if (right.style) right.style.display = "block";
			}
		}
	}

	async next(): Promise<void> {
		if (this.pageFlip) {
			this.pageFlip.flipNext();
			return;
		}

		if (this._currentSpread < this.totalSpreads - 1) {
			this._currentSpread++;
			if (this.options.sound !== false) {
				playPageTurnSound();
			}
			this.updateFallbackDisplay();
			this.emitChange();
		}
	}

	async prev(): Promise<void> {
		if (this.pageFlip) {
			this.pageFlip.flipPrev();
			return;
		}

		if (this._currentSpread > 0) {
			this._currentSpread--;
			if (this.options.sound !== false) {
				playPageTurnSound();
			}
			this.updateFallbackDisplay();
			this.emitChange();
		}
	}

	async flipTo(pageNumber: number): Promise<void> {
		if (this.pageFlip) {
			this.pageFlip.flip(Math.max(0, pageNumber - 1));
			return;
		}

		const isMobile =
			this.options.usePortrait === true ||
			(typeof window !== "undefined" && window.innerWidth <= 768);
		const targetSpread = isMobile
			? Math.max(0, Math.min(pageNumber - 1, this.totalSpreads - 1))
			: pageNumber <= 1
				? 0
				: Math.floor(pageNumber / 2);
		this._currentSpread = Math.max(0, Math.min(targetSpread, this.totalSpreads - 1));
		this.updateFallbackDisplay();
		this.emitChange();
	}

	destroy(): void {
		if (this.keydownListener && typeof window !== "undefined") {
			window.removeEventListener("keydown", this.keydownListener);
			this.keydownListener = null;
		}

		for (const page of this.pageElements) {
			page.removeAttribute?.("data-flipbook-side");
			if (page.style) {
				page.style.display = "";
			}
			if (typeof page.querySelectorAll === "function") {
				page
					.querySelectorAll<HTMLElement>('[data-folio-frozen="true"]')
					.forEach((node) => {
						node.textContent = "";
						node.removeAttribute("data-folio-frozen");
					});
			}
		}

		if (this.pageFlip) {
			try {
				this.pageFlip.clear();
			} catch {
				// Ignore clear error
			}
			try {
				this.pageFlip.destroy();
			} catch {
				// Ignore destroy error
			}
			this.pageFlip = null;
		}

		this.container.classList.remove("stf__parent");
		this.container.style.minWidth = "";
		this.container.style.minHeight = "";
		this.container.style.width = "";
		this.container.style.maxWidth = "";
		this.container.style.height = "";
		this.container.removeAttribute("data-view-mode");
	}
}
