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

export interface FlipBookRange {
	readonly left: string | number | null;
	readonly right: string | number | null;
}

interface VisibleRange {
	readonly left: string | number | null;
	readonly right: string | number | null;
	readonly current: number;
}

interface FlipbookHostElement extends HTMLElement {
	__printedjs_flipbook?: FlipBookController | { destroy?: () => void };
}

export interface FlipBookController {
	readonly currentPage: number;
	readonly currentSpread: number;
	readonly totalSpreads: number;
	readonly totalPages?: number | undefined;
	readonly currentRange?: FlipBookRange | undefined;
	next(): Promise<void>;
	prev(): Promise<void>;
	flipTo(pageNumber: number): Promise<void>;
	destroy(): void;
}

interface PageRuleEntry {
	selector: string;
	contentPattern: string;
	specificity: number;
}

function getSelectorSpecificity(selector: string, index: number): number {
	let score = index;

	if (/\[data-page[~*^$|]?=/i.test(selector)) {
		score += 10000;
	}

	if (/\.(printedjs|pagedjs)_(first|left|right|blank)_page/i.test(selector)) {
		score += 5000;
	}

	const classes = (selector.match(/\.[\w-]+/g) || []).length;
	const attrs = (selector.match(/\[[^\]]+\]/g) || []).length;
	score += (classes + attrs) * 100;

	return score;
}

function doesRuleMatchNode(
	entry: PageRuleEntry,
	node: HTMLElement,
	page: HTMLElement,
	pageIndex: number,
): boolean {
	try {
		if (node.matches(entry.selector)) {
			return true;
		}
	} catch {
		// Ignore selector syntax error in matches()
	}

	const sel = entry.selector;

	const pageNameMatch = sel.match(/\[data-page[~*^$|]?=["']?([^"'\]]+)["']?\]/i);

	if (pageNameMatch && pageNameMatch[1]) {
		const targetPage = pageNameMatch[1].trim();
		const actualPage = page.getAttribute("data-page")?.trim();

		if (actualPage !== targetPage) {
			return false;
		}
	}

	if (/(?:_first_page|:first\b)/i.test(sel)) {
		const isFirst =
			pageIndex === 0 ||
			page.classList.contains("printedjs_first_page") ||
			page.classList.contains("pagedjs_first_page");

		if (!isFirst) return false;
	}

	if (/(?:_left_page|:left\b)/i.test(sel)) {
		const isLeft =
			page.classList.contains("printedjs_left_page") ||
			page.classList.contains("pagedjs_left_page");

		if (!isLeft) return false;
	}

	if (/(?:_right_page|:right\b)/i.test(sel)) {
		const isRight =
			page.classList.contains("printedjs_right_page") ||
			page.classList.contains("pagedjs_right_page");

		if (!isRight) return false;
	}

	const parent = node.parentElement;

	if (parent) {
		const marginBoxMatch = sel.match(/(?:printedjs|pagedjs)_margin-([a-z-]+)/i);

		if (marginBoxMatch && marginBoxMatch[1]) {
			const expectedBox = marginBoxMatch[1].toLowerCase();
			const parentClass = parent.className || "";

			if (!parentClass.includes(expectedBox)) {
				return false;
			}

			return true;
		}
	}

	return false;
}

function collectCssRules(
	rules: CSSRuleList | CSSRule[] | null | undefined,
): CSSStyleRule[] {
	if (!rules) return [];
	const list: CSSStyleRule[] = [];

	for (const rule of Array.from(rules)) {
		if ("selectorText" in rule && "style" in rule) {
			// SAFETY: rule with selectorText and style properties conforms to CSSStyleRule
			list.push(rule as CSSStyleRule);
		} else if ("cssRules" in rule) {
			// SAFETY: rule with cssRules property conforms to CSSGroupingRule
			const groupingRule = rule as CSSGroupingRule;

			if (groupingRule.cssRules) {
				list.push(...collectCssRules(groupingRule.cssRules));
			}
		}
	}

	return list;
}

function resolveCounterText(
	pattern: string | null,
	folio: string,
	logicalNumber: number,
	totalPages: number,
	defaultStyle: PageCounterStyle = "decimal",
): string {
	if (!pattern) return folio;

	const pageMatch = pattern.match(
		/counter\s*\(\s*page\s*(?:,\s*([a-zA-Z0-9_-]+))?\s*\)/i,
	);

	let pageStr = folio;

	if (pageMatch) {
		// SAFETY: matched counter style name or fallback conforms to PageCounterStyle
		const counterStyle = (
			pageMatch[1] ? pageMatch[1].toLowerCase() : defaultStyle
		) as PageCounterStyle;

		pageStr = formatPageNumber(logicalNumber, counterStyle);
	}

	let text = pattern;
	text = text.replace(
		/counter\s*\(\s*pages\s*(?:,\s*([a-zA-Z0-9_-]+))?\s*\)/gi,
		(_, rawStyle) => {
			// SAFETY: matched pages style name or fallback conforms to PageCounterStyle
			const pagesStyle = (
				rawStyle ? rawStyle.toLowerCase() : defaultStyle
			) as PageCounterStyle;

			return formatPageNumber(totalPages, pagesStyle);
		},
	);
	text = text.replace(/counter\s*\(\s*page\s*(?:,\s*[a-zA-Z0-9_-]+)?\s*\)/gi, pageStr);

	text = text.replace(/["']/g, "").replace(/\s+/g, " ").trim();

	return text || folio;
}

function freezePageFolios(container: HTMLElement, pages: HTMLElement[]): void {
	const doc = container.ownerDocument ?? ("document" in globalThis ? document : null);

	if (!doc) return;

	const pageRuleEntries: PageRuleEntry[] = [];
	let ruleIndex = 0;

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

					if (content) {
						for (const rawSel of rule.selectorText.split(",")) {
							const selector = rawSel.replace(/::?(?:after|before)\s*$/i, "").trim();

							if (selector) {
								pageRuleEntries.push({
									selector,
									contentPattern: content,
									specificity: getSelectorSpecificity(selector, ruleIndex++),
								});
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

		if (!page || !("querySelectorAll" in page && Boolean(page.querySelectorAll)))
			continue;

		const formattedAttr = page.getAttribute("data-page-formatted")?.trim();

		const styleAttr = (
			page.getAttribute("data-page-style") ||
			page.getAttribute("data-counter-style") ||
			page.getAttribute("data-page-counter-style")
		)
			?.toLowerCase()
			.trim();

		const logicalAttr = page.getAttribute("data-page-number")?.trim();
		const logicalNum = logicalAttr ? parseInt(logicalAttr, 10) : i + 1;
		// SAFETY: style attribute or default fallback conforms to PageCounterStyle
		const defaultStyle = (styleAttr || "decimal") as PageCounterStyle;

		const folio =
			formattedAttr ||
			(styleAttr && styleAttr !== "decimal"
				? formatPageNumber(logicalNum, defaultStyle)
				: Number.isFinite(logicalNum)
					? String(logicalNum)
					: String(i + 1));

		page
			.querySelectorAll<HTMLElement>(".printedjs_margin-content, .pagedjs_margin-content")
			.forEach((node) => {
				if (node.getAttribute("data-folio-frozen") === "true") return;

				if (node.firstElementChild !== null) return;

				if (node.textContent?.trim()) return;

				const matchingRules: PageRuleEntry[] = [];

				for (const entry of pageRuleEntries) {
					if (doesRuleMatchNode(entry, node, page, i)) {
						matchingRules.push(entry);
					}
				}

				matchingRules.sort((a, b) => b.specificity - a.specificity);
				const matchedEntry = matchingRules[0] ?? null;

				if (
					matchedEntry &&
					(matchedEntry.contentPattern === "none" ||
						matchedEntry.contentPattern === "normal" ||
						matchedEntry.contentPattern === '""' ||
						matchedEntry.contentPattern === "''")
				) {
					return;
				}

				const computed = view?.getComputedStyle(node, "::after")?.content ?? "";
				const cleaned = computed.replace(/^["']|["']$/g, "").trim();

				if (!matchedEntry && (cleaned === "none" || cleaned === "normal" || !cleaned)) {
					return;
				}

				const hasCounterExpr =
					/counter\s*\(\s*page\b/i.test(computed) ||
					/counter\s*\(\s*page\b/i.test(cleaned) ||
					(matchedEntry !== null &&
						/counter\s*\(\s*page\b/i.test(matchedEntry.contentPattern));

				const isComputedFolio =
					cleaned.length > 0 &&
					(cleaned === folio ||
						(logicalAttr !== undefined && cleaned === logicalAttr) ||
						(Number.isFinite(Number(cleaned)) && String(Number(cleaned)) === folio) ||
						cleaned === formatPageNumber(logicalNum, "lower-roman") ||
						cleaned === formatPageNumber(logicalNum, "upper-roman") ||
						cleaned === formatPageNumber(logicalNum, "lower-alpha") ||
						cleaned === formatPageNumber(logicalNum, "upper-alpha") ||
						cleaned === formatPageNumber(logicalNum, "decimal-leading-zero"));

				const isPageCounter = hasCounterExpr || isComputedFolio;

				if (isPageCounter) {
					const pattern =
						matchedEntry?.contentPattern ??
						(/counter\s*\(\s*page\b/i.test(cleaned) ? cleaned : null);

					const frozenText = resolveCounterText(
						pattern,
						isComputedFolio && !pattern ? cleaned : folio,
						Number.isFinite(logicalNum) ? logicalNum : i + 1,
						totalPages,
						defaultStyle,
					);

					node.textContent = frozenText;
					node.setAttribute("data-folio-frozen", "true");

					if (!formattedAttr || formattedAttr === String(logicalNum)) {
						page.setAttribute("data-page-formatted", frozenText);
					}
				}
			});
	}
}

function setPageProp(
	el: HTMLElement | null | undefined,
	prop: string,
	val: string,
	priority = "",
): void {
	if (!el?.style) return;

	if ("setProperty" in el.style && Boolean(el.style.setProperty)) {
		el.style.setProperty(prop, val, priority);
	} else {
		Reflect.set(el.style, prop, val);
	}
}

function removePageProp(el: HTMLElement | null | undefined, prop: string): void {
	if (!el?.style) return;

	if ("removeProperty" in el.style && Boolean(el.style.removeProperty)) {
		el.style.removeProperty(prop);
	} else {
		Reflect.deleteProperty(el.style, prop);
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

	get totalPages(): number {
		return this.pageElements.length;
	}

	get currentRange(): FlipBookRange {
		const range = this.visibleRange();

		return { left: range.left, right: range.right };
	}

	public getPageFlip(): PageFlip | null {
		return this.pageFlip;
	}

	private pageLabel(index: number): string | number {
		const page = this.pageElements[index];

		if (!page) return index + 1;

		const frozen =
			"querySelector" in page && Boolean(page.querySelector)
				? page
						.querySelector<HTMLElement>('[data-folio-frozen="true"]')
						?.textContent?.trim()
				: null;

		if (frozen) {
			const num = Number(frozen);

			return Number.isFinite(num) && String(num) === frozen ? num : frozen;
		}

		const formatted = page.getAttribute("data-page-formatted")?.trim();

		if (formatted) {
			const num = Number(formatted);

			return Number.isFinite(num) && String(num) === formatted ? num : formatted;
		}

		const style = (
			page.getAttribute("data-page-style") ||
			page.getAttribute("data-counter-style") ||
			page.getAttribute("data-page-counter-style")
		)
			?.toLowerCase()
			.trim();

		const logicalAttr = page.getAttribute("data-page-number")?.trim();
		const logical = logicalAttr ? parseInt(logicalAttr, 10) : index + 1;

		if (style && style !== "decimal" && Number.isFinite(logical)) {
			// SAFETY: style attribute from page element cast to supported PageCounterStyle
			return formatPageNumber(logical, style as PageCounterStyle);
		}

		if (Number.isFinite(logical) && logical > 0) return logical;

		return index + 1;
	}

	private visibleRange(): VisibleRange {
		const total = this.pageElements.length;

		if (total === 0) return { left: null, right: null, current: 1 };

		const isPortrait =
			this.pageFlip?.getOrientation() === "portrait" ||
			("innerWidth" in globalThis && globalThis.innerWidth <= 768);

		if (isPortrait) {
			const idx = Math.max(
				0,
				Math.min(
					total - 1,
					this.pageFlip ? this.pageFlip.getCurrentPageIndex() : this._currentPage - 1,
				),
			);

			const label = this.pageLabel(idx);

			return { left: null, right: label, current: idx + 1 };
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
						return { left: label, right: null, current: idx + 1 };
					}

					return { left: null, right: label, current: idx + 1 };
				}

				const left = this.pageLabel(spread[0]!);
				const right = this.pageLabel(spread[1]!);

				return { left, right, current: spread[0]! + 1 };
			}
		}

		if (this._currentSpread === 0) {
			const right = this.pageLabel(0);

			return { left: null, right, current: 1 };
		}

		const candidateLeft = (this._currentSpread - 1) * 2 + 1;
		const candidateRight = candidateLeft + 1;

		if (candidateLeft === total - 1 && total > 2) {
			const left = this.pageLabel(candidateLeft);

			return { left, right: null, current: candidateLeft + 1 };
		}

		const left = candidateLeft < total ? this.pageLabel(candidateLeft) : null;
		const right = candidateRight < total ? this.pageLabel(candidateRight) : null;

		return { left, right, current: candidateLeft + 1 };
	}

	private emitChange(): void {
		const range = this.visibleRange();
		this._currentPage = range.current;

		const detail = {
			currentSpread: this._currentSpread,
			totalSpreads: this.totalSpreads,
			currentPage: this._currentPage,
			leftPage: range.left,
			rightPage: range.right,
		};

		this.container.dispatchEvent(
			new CustomEvent("flipbook:change", {
				detail,
				bubbles: true,
			}),
		);

		const fullDetail = {
			...detail,
			viewMode: "flipbook",
			totalPages: this.totalPages,
			visiblePages: [
				...(range.left != null
					? [Number.isFinite(range.left) ? range.left : this._currentPage]
					: []),
				...(range.right != null
					? [Number.isFinite(range.right) ? range.right : this._currentPage]
					: []),
			],
		};

		this.container.dispatchEvent(
			new CustomEvent("page:change", {
				detail: fullDetail,
				bubbles: true,
			}),
		);
		this.container.dispatchEvent(
			new CustomEvent("views:page-change", {
				detail: fullDetail,
				bubbles: true,
			}),
		);
	}

	private init(): void {
		// SAFETY: container element hosts optional flipbook controller reference
		const host = this.container as FlipbookHostElement;
		const existing = host.__printedjs_flipbook;

		if (existing && existing !== this) {
			existing.destroy?.();
		}

		if (this.pageFlip) {
			this.destroy();
		}

		host.__printedjs_flipbook = this;

		this.pageElements = Array.from(
			this.container.querySelectorAll<HTMLElement>(
				":scope > :is(.printedjs_page, .pagedjs_page)",
			),
		);

		if (this.pageElements.length === 0) {
			this.pageElements = Array.from(
				this.container.querySelectorAll<HTMLElement>(
					":is(.printedjs_page, .pagedjs_page)",
				),
			);
		}

		if (this.pageElements.length === 0) return;

		const firstPage = this.pageElements[0];

		const view =
			firstPage?.ownerDocument?.defaultView ??
			(typeof window !== "undefined" ? window : null);

		const computed = view && firstPage ? view.getComputedStyle(firstPage) : null;
		const compW = computed ? parseFloat(computed.width) : 0;
		const compH = computed ? parseFloat(computed.height) : 0;

		const pageWidth = Math.round(
			(compW > 0 ? compW : 0) ||
				firstPage?.offsetWidth ||
				parseFloat(firstPage?.style?.width || "") ||
				794,
		);

		const pageHeight = Math.round(
			(compH > 0 ? compH : 0) ||
				firstPage?.offsetHeight ||
				parseFloat(firstPage?.style?.height || "") ||
				1123,
		);

		this.container.setAttribute("data-view-mode", "flipbook");

		const isMobile =
			this.options.usePortrait === true ||
			("innerWidth" in globalThis && globalThis.innerWidth <= 768);

		const bookWidth = isMobile ? pageWidth : pageWidth * 2;
		this.container.style.width = `${bookWidth}px`;
		this.container.style.minWidth = `${bookWidth}px`;
		this.container.style.maxWidth = `${bookWidth}px`;
		this.container.style.height = `${pageHeight}px`;
		this.container.style.minHeight = `${pageHeight}px`;

		for (const page of this.pageElements) {
			if (!page || !page.style) continue;

			let naturalWidth = Number(page.getAttribute?.("data-natural-width"));
			let naturalHeight = Number(page.getAttribute?.("data-natural-height"));

			if (!naturalWidth || !naturalHeight) {
				const view =
					page.ownerDocument?.defaultView ??
					(typeof window !== "undefined" ? window : null);

				const computed = view ? view.getComputedStyle(page) : null;
				const compW = computed ? parseFloat(computed.width) : 0;
				const compH = computed ? parseFloat(computed.height) : 0;

				naturalWidth =
					(compW > 0 ? compW : 0) ||
					page.offsetWidth ||
					parseFloat(page.style?.width || "") ||
					pageWidth;
				naturalHeight =
					(compH > 0 ? compH : 0) ||
					page.offsetHeight ||
					parseFloat(page.style?.height || "") ||
					pageHeight;

				page.setAttribute?.("data-natural-width", String(naturalWidth));
				page.setAttribute?.("data-natural-height", String(naturalHeight));
			}

			setPageProp(page, "width", `${pageWidth}px`, "important");
			setPageProp(page, "height", `${pageHeight}px`, "important");
			setPageProp(page, "overflow", "hidden", "important");
			setPageProp(page, "transition", "none", "important");

			// SAFETY: first child of page is expected to be an HTMLElement container
			const contentEl =
				("querySelector" in page && Boolean(page.querySelector)
					? page.querySelector<HTMLElement>(".printedjs_sheet, .pagedjs_sheet")
					: null) ??
				("firstElementChild" in page
					? (page.firstElementChild as HTMLElement | null)
					: null);

			if (contentEl) {
				const rawScale = Math.min(
					pageWidth / naturalWidth,
					pageHeight / naturalHeight,
					1,
				);

				const scale = rawScale >= 0.99 ? 1 : rawScale;

				if (scale < 1) {
					const scaledWidth = naturalWidth * scale;
					const scaledHeight = naturalHeight * scale;
					const offsetX = Math.max(0, (pageWidth - scaledWidth) / 2);
					const offsetY = Math.max(0, (pageHeight - scaledHeight) / 2);

					setPageProp(contentEl, "width", `${naturalWidth}px`, "important");
					setPageProp(contentEl, "height", `${naturalHeight}px`, "important");
					setPageProp(contentEl, "transform-origin", "0 0", "important");
					setPageProp(
						contentEl,
						"transform",
						`translate(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px) scale(${scale.toFixed(6)})`,
						"important",
					);
				}
			}
		}

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

			if (page.style) {
				page.style.display = "none";
				page.style.visibility = "hidden";
				page.style.opacity = "0";
				page.style.pointerEvents = "none";
			}
		}

		if (this._currentSpread === 0) {
			const first = this.pageElements[0];

			if (first) {
				first.setAttribute?.("data-flipbook-side", "right");

				if (first.style) {
					first.style.display = "block";
					first.style.visibility = "visible";
					first.style.opacity = "1";
					first.style.pointerEvents = "";
				}
			}

			return;
		}

		const leftIdx = (this._currentSpread - 1) * 2 + 1;
		const rightIdx = leftIdx + 1;

		if (leftIdx === total - 1 && total > 2) {
			const last = this.pageElements[leftIdx];

			if (last) {
				last.setAttribute?.("data-flipbook-side", "right");

				if (last.style) {
					last.style.display = "block";
					last.style.visibility = "visible";
					last.style.opacity = "1";
					last.style.pointerEvents = "";
				}
			}

			return;
		}

		if (leftIdx < total) {
			const left = this.pageElements[leftIdx];

			if (left) {
				left.setAttribute?.("data-flipbook-side", "left");

				if (left.style) {
					left.style.display = "block";
					left.style.visibility = "visible";
					left.style.opacity = "1";
					left.style.pointerEvents = "";
				}
			}
		}

		if (rightIdx < total) {
			const right = this.pageElements[rightIdx];

			if (right) {
				right.setAttribute?.("data-flipbook-side", "right");

				if (right.style) {
					right.style.display = "block";
					right.style.visibility = "visible";
					right.style.opacity = "1";
					right.style.pointerEvents = "";
				}
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
			page.removeAttribute?.("data-natural-width");
			page.removeAttribute?.("data-natural-height");

			if (page.style) {
				page.style.display = "";
				page.style.visibility = "";
				page.style.opacity = "";
				page.style.pointerEvents = "";
				removePageProp(page, "width");
				removePageProp(page, "height");
				removePageProp(page, "--printedjs-pagebox-width");
				removePageProp(page, "--printedjs-pagebox-height");
				removePageProp(page, "--pagedjs-pagebox-width");
				removePageProp(page, "--pagedjs-pagebox-height");
				removePageProp(page, "--printedjs-width");
				removePageProp(page, "--printedjs-height");
				removePageProp(page, "--pagedjs-width");
				removePageProp(page, "--pagedjs-height");
				removePageProp(page, "overflow");
				page.style.position = "";
				page.style.left = "";
				page.style.top = "";
				page.style.zIndex = "";
				page.style.transform = "";
				page.style.clipPath = "";
			}

			// SAFETY: first child of page is expected to be an HTMLElement container
			const contentEl =
				("querySelector" in page && Boolean(page.querySelector)
					? page.querySelector<HTMLElement>(".printedjs_sheet, .pagedjs_sheet")
					: null) ??
				("firstElementChild" in page
					? (page.firstElementChild as HTMLElement | null)
					: null);

			if (contentEl) {
				removePageProp(contentEl, "width");
				removePageProp(contentEl, "height");
				removePageProp(contentEl, "transform-origin");
				removePageProp(contentEl, "transform");
			}

			const pagebox =
				"querySelector" in page && Boolean(page.querySelector)
					? page.querySelector<HTMLElement>(".printedjs_pagebox, .pagedjs_pagebox")
					: null;

			removePageProp(pagebox, "width");
			removePageProp(pagebox, "height");

			page.classList?.remove(
				"stf__item",
				"--simple",
				"--left",
				"--right",
				"--hard",
				"--soft",
			);

			if ("querySelectorAll" in page && Boolean(page.querySelectorAll)) {
				page
					.querySelectorAll<HTMLElement>('[data-folio-frozen="true"]')
					.forEach((node) => {
						node.textContent = "";
						node.removeAttribute("data-folio-frozen");
					});
			}
		}

		if (
			"querySelectorAll" in this.container &&
			Boolean(this.container.querySelectorAll)
		) {
			this.container
				.querySelectorAll<HTMLElement>('[data-flip-clone="true"]')
				.forEach((node) => {
					node.remove();
				});
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

		// SAFETY: container element hosts optional flipbook controller reference
		const host = this.container as FlipbookHostElement;

		if (host.__printedjs_flipbook === this) {
			delete host.__printedjs_flipbook;
		}
	}
}
