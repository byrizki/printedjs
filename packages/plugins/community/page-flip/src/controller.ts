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

function setPageProp(
	el: HTMLElement | null | undefined,
	prop: string,
	val: string,
	priority = "",
): void {
	if (!el || !el.style) return;
	if (typeof el.style.setProperty === "function") {
		el.style.setProperty(prop, val, priority);
	} else {
		(el.style as unknown as Record<string, string>)[prop] = val;
	}
}

function removePageProp(el: HTMLElement | null | undefined, prop: string): void {
	if (!el || !el.style) return;
	if (typeof el.style.removeProperty === "function") {
		el.style.removeProperty(prop);
	} else {
		delete (el.style as unknown as Record<string, string>)[prop];
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
		const existing = (this.container as unknown as Record<string, unknown>).__printedjs_flipbook as
			| { destroy?: () => void }
			| undefined;
		if (existing && existing !== (this as unknown) && typeof existing.destroy === "function") {
			existing.destroy();
		}

		if (this.pageFlip) {
			this.destroy();
		}

		(this.container as unknown as Record<string, unknown>).__printedjs_flipbook = this;

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
			(typeof window !== "undefined" && window.innerWidth <= 768);
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

			const contentEl =
				(typeof page.querySelector === "function"
					? page.querySelector<HTMLElement>(".printedjs_sheet, .pagedjs_sheet")
					: null) ?? (page.firstElementChild as HTMLElement | null);

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
			const contentEl =
				(typeof page.querySelector === "function"
					? page.querySelector<HTMLElement>(".printedjs_sheet, .pagedjs_sheet")
					: null) ?? (page.firstElementChild as HTMLElement | null);
			if (contentEl) {
				removePageProp(contentEl, "width");
				removePageProp(contentEl, "height");
				removePageProp(contentEl, "transform-origin");
				removePageProp(contentEl, "transform");
			}
			if (typeof page.querySelector === "function") {
				const pagebox = page.querySelector<HTMLElement>(
					".printedjs_pagebox, .pagedjs_pagebox",
				);
				removePageProp(pagebox, "width");
				removePageProp(pagebox, "height");
			}
			page.classList?.remove(
				"stf__item",
				"--simple",
				"--left",
				"--right",
				"--hard",
				"--soft",
			);
		}

		if (typeof this.container.querySelectorAll === "function") {
			this.container
				.querySelectorAll<HTMLElement>('[data-flip-clone="true"]')
				.forEach((node) => {
					if (typeof node?.remove === "function") {
						node.remove();
					} else if (node?.parentNode) {
						node.parentNode.removeChild(node);
					}
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
		if ((this.container as unknown as Record<string, unknown>).__printedjs_flipbook === this) {
			delete (this.container as unknown as Record<string, unknown>).__printedjs_flipbook;
		}
	}
}
