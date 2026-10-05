import { formatPageNumber, type PageCounterStyle } from "@printedjs/core";
import type { FlipBookController } from "@printedjs/plugin-page-flip";
import type { ActivePageChangeDetail } from "@printedjs/plugin-views";
import { ZOOM_PRESETS, type ViewMode } from "../types/editor.js";
import type { RenderStats } from "../types/playground.js";

export interface ViewportCallbacks {
	readonly onZoomChange: (zoom: number) => void;
	readonly onViewModeChange: (mode: ViewMode) => void;
	readonly onOverlayToggle?: (visible: boolean) => void;
	readonly onPrintClick?: () => void;
}

export interface ViewportOptions {
	readonly initialZoom: number;
	readonly initialViewMode: ViewMode;
	readonly initialOverlayVisible?: boolean;
	readonly callbacks: ViewportCallbacks;
}

interface FlipbookChangeEventDetail {
	currentSpread: number;
	totalSpreads: number;
	currentPage: number;
	leftPage?: number | string | null;
	rightPage?: number | string | null;
}

interface FlipbookHostElement extends HTMLElement {
	__printedjs_flipbook?: FlipBookController | undefined;
}

interface PageDimensions {
	readonly width: number;
	readonly height: number;
}

interface CSSStyleDeclarationWithZoom extends Omit<CSSStyleDeclaration, "zoom"> {
	zoom?: string | undefined;
}

function isNumber(value: unknown): value is number {
	return (
		Number.isFinite(value) && Object.prototype.toString.call(value) === "[object Number]"
	);
}

function isFlipbookMode(mode: string | undefined): boolean {
	return mode === "flipbook" || mode === "book";
}

export class ViewportComponent {
	readonly element: HTMLElement;
	readonly renderViewport: HTMLElement;
	private readonly canvasScrollEl: HTMLElement;
	private readonly zoomContainer: HTMLElement;
	private readonly zoomSelect: HTMLSelectElement;
	private readonly singleViewBtn: HTMLButtonElement;
	private readonly spreadViewBtn: HTMLButtonElement;
	private readonly flipbookViewBtn: HTMLButtonElement;
	private readonly pageIndicatorEl: HTMLElement;
	private readonly overlayBtn: HTMLButtonElement;
	private readonly traceBtn: HTMLButtonElement;
	private readonly tracePopover: HTMLElement;
	private readonly traceContentEl: HTMLElement;
	private readonly traceSummaryEl: HTMLElement;
	private readonly statusDot: HTMLElement;
	private readonly statusLabel: HTMLElement;
	private readonly floatingBarEl: HTMLElement;
	private readonly gridControlsEl: HTMLElement;
	private readonly gridColsSelect: HTMLSelectElement;
	private readonly collapseBtn: HTMLButtonElement;
	private readonly expandBtn: HTMLButtonElement;
	private readonly bookSidePrev: HTMLButtonElement;
	private readonly bookSideNext: HTMLButtonElement;

	private currentZoom: number;
	private currentViewMode: ViewMode;
	private currentPageIndex: number = 1;
	private totalPages: number = 0;
	private gridCols: number = 2;
	private isToolbarMinimized: boolean = false;
	private isOverlayVisible: boolean = false;
	private isTraceOpen: boolean = false;
	private currentStats: RenderStats | null = null;
	private readonly callbacks: ViewportCallbacks;
	private readonly onFlipbookChange: (e: Event) => void;
	private readonly onPageChangeEvent: (e: Event) => void;
	private readonly onCanvasScroll: () => void;
	private scrollRafId: number | null = null;

	constructor(options: ViewportOptions) {
		const { initialZoom, initialViewMode, initialOverlayVisible, callbacks } = options;
		this.currentZoom = initialZoom;
		this.currentViewMode = initialViewMode;
		this.isOverlayVisible = initialOverlayVisible ?? false;
		this.callbacks = callbacks;

		this.onFlipbookChange = (e: Event) => {
			// SAFETY: flipbook:change event is dispatched as CustomEvent with FlipbookChangeEventDetail
			const detail = (e as CustomEvent<FlipbookChangeEventDetail>).detail;

			if (detail && isFlipbookMode(this.currentViewMode)) {
				this.currentPageIndex = detail.currentPage;
				this.updateBookPageIndicator(
					detail.currentSpread,
					detail.totalSpreads,
					detail.currentPage,
					detail.leftPage,
					detail.rightPage,
				);
			}
		};

		this.onPageChangeEvent = (e: Event) => {
			// SAFETY: page:change and views:page-change events are dispatched as CustomEvent with ActivePageChangeDetail
			const detail = (e as CustomEvent<ActivePageChangeDetail>).detail;

			if (!detail) return;

			if (isFlipbookMode(detail.viewMode) || isFlipbookMode(this.currentViewMode)) {
				return;
			}

			this.currentPageIndex = detail.currentPage;

			if (detail.viewMode === "single") {
				const label = detail.leftPage ?? detail.currentPage;
				this.pageIndicatorEl.textContent = `${label} of ${this.totalPages}`;
			} else if (detail.viewMode === "spread") {
				const left = detail.leftPage;
				const right = detail.rightPage;

				if (left != null && right != null && left !== right) {
					this.pageIndicatorEl.textContent = `${left}–${right} of ${this.totalPages}`;
				} else {
					const single = right ?? left ?? detail.currentPage;
					this.pageIndicatorEl.textContent = `${single} of ${this.totalPages}`;
				}
			}
		};

		this.onCanvasScroll = () => {
			if (this.scrollRafId !== null) return;
			this.scrollRafId = requestAnimationFrame(() => {
				this.scrollRafId = null;
				this.updateActivePagesFromScroll();
			});
		};

		this.element = document.createElement("main");
		this.element.className = "pm-viewport-wrapper";

		if (initialViewMode === "spread") {
			this.element.classList.add("pm-spread-view");
		} else if (initialViewMode === "flipbook") {
			this.element.classList.add("pm-flipbook-view");
		} else {
			this.element.classList.add("pm-single-view");
		}

		this.element.innerHTML = `
			<!-- Book View Side Navigation Arrows -->
			<button id="pm-book-side-prev" class="pm-book-side-nav prev" title="Previous Spread / Page (or click left page / swipe right)">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</button>
			<button id="pm-book-side-next" class="pm-book-side-nav next" title="Next Spread / Page (or click right page / swipe left)">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</button>

			<div class="pm-canvas-scroll" id="pm-canvas-scroll">
				<div class="pm-zoom-container" id="pm-zoom-container">
					<div id="render-viewport">
						<div class="pm-viewport-empty">
							<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
								<polyline points="14 2 14 8 20 8"></polyline>
								<line x1="16" y1="13" x2="8" y2="13"></line>
								<line x1="16" y1="17" x2="8" y2="17"></line>
								<polyline points="10 9 9 9 8 9"></polyline>
							</svg>
							<span>Ready to render document</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Flattened Floating Preview Bar at Bottom Center -->
			<div class="pm-floating-preview-bar" id="pm-floating-preview-bar">
				<!-- Diagnostics Status Pill -->
				<div class="pm-toolbar-pill-group pm-status-group">
					<span class="pm-status-dot ready" id="pm-float-status-dot"></span>
					<span class="pm-status-label" id="pm-float-status-label" title="Renderer ready">Ready</span>
				</div>

				<div class="pm-toolbar-divider"></div>

				<!-- Page Navigation (always visible so reader knows current position) -->
				<div class="pm-toolbar-pill-group">
					<button id="pm-prev-page-btn" class="pm-pill-btn pm-pill-icon" title="Previous Page">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="15 18 9 12 15 6"></polyline>
						</svg>
					</button>
					<span id="pm-page-indicator" class="pm-page-indicator">0 pages</span>
					<button id="pm-next-page-btn" class="pm-pill-btn pm-pill-icon" title="Next Page">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="9 18 15 12 9 6"></polyline>
						</svg>
					</button>
				</div>

				<!-- Expand Button (only visible when minimized) -->
				<button id="pm-toolbar-expand-btn" class="pm-pill-btn pm-show-when-minimized" title="Expand Toolbar">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="18 15 12 9 6 15"></polyline>
					</svg>
					<span>Controls</span>
				</button>

				<div class="pm-toolbar-divider pm-hide-when-minimized"></div>

				<!-- View Mode Toggle -->
				<div class="pm-toolbar-pill-group pm-hide-when-minimized">
					<button id="pm-single-view-btn" class="pm-pill-btn ${initialViewMode === "single" ? "active" : ""}" title="Single Page View (Vertical Continuous Stack)">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
						</svg>
						<span>Single</span>
					</button>
					<button id="pm-spread-view-btn" class="pm-pill-btn ${initialViewMode === "spread" ? "active" : ""}" title="Spread View (Grid Pages Display, Left to Right Flow)">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="7" height="7"></rect>
							<rect x="14" y="3" width="7" height="7"></rect>
							<rect x="14" y="14" width="7" height="7"></rect>
							<rect x="3" y="14" width="7" height="7"></rect>
						</svg>
						<span>Spread</span>
					</button>
					<button id="pm-flipbook-view-btn" class="pm-pill-btn ${initialViewMode === "flipbook" ? "active" : ""}" title="Book View (Digital Book Reading Experience, Smooth 3D Flip)">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
							<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
						</svg>
						<span>Book</span>
					</button>
				</div>

				<!-- Grid Controls (Visible in Spread mode) -->
				<div class="pm-toolbar-pill-group pm-grid-controls pm-hide-when-minimized" id="pm-grid-controls" style="display: ${initialViewMode === "spread" ? "flex" : "none"};">
					<div class="pm-toolbar-divider"></div>
					<span class="pm-grid-label">Grid</span>
					<select id="pm-grid-cols-select" class="pm-zoom-select pm-grid-select" title="Grid Columns">
						<option value="2" selected>2 Cols</option>
						<option value="3">3 Cols</option>
						<option value="4">4 Cols</option>
						<option value="5">5 Cols</option>
						<option value="6">6 Cols</option>
					</select>
				</div>

				<div class="pm-toolbar-divider pm-hide-when-minimized"></div>

				<!-- Zoom Controls -->
				<div class="pm-toolbar-pill-group pm-hide-when-minimized">
					<button id="pm-zoom-out-btn" class="pm-pill-btn pm-pill-icon" title="Zoom Out (-)">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							<line x1="8" y1="11" x2="14" y2="11"></line>
						</svg>
					</button>
					<select id="pm-zoom-select" class="pm-zoom-select" title="Select Zoom">
						${ZOOM_PRESETS.map(
							(p) =>
								`<option value="${p.value}" ${p.value === initialZoom ? "selected" : ""}>${p.label}</option>`,
						).join("")}
					</select>
					<button id="pm-zoom-in-btn" class="pm-pill-btn pm-pill-icon" title="Zoom In (+)">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							<line x1="11" y1="8" x2="11" y2="14"></line>
							<line x1="8" y1="11" x2="14" y2="11"></line>
						</svg>
					</button>
					<button id="pm-zoom-fit-btn" class="pm-pill-btn" title="Fit Content to Viewport">
						Fit
					</button>
				</div>

				<div class="pm-toolbar-divider pm-hide-when-minimized"></div>

				<!-- Actions: Overlay, Print, Trace -->
				<div class="pm-toolbar-pill-group pm-hide-when-minimized">
					<button id="pm-float-overlay-btn" class="pm-pill-btn ${this.isOverlayVisible ? "active" : ""}" title="Toggle Devtools Box Sizing &amp; Layout Overlay">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
							<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
							<line x1="12" y1="22.08" x2="12" y2="12"></line>
						</svg>
						<span>Overlay</span>
					</button>

					<button id="pm-float-print-btn" class="pm-pill-btn" title="Print Document or Save PDF">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 6 2 18 2 18 9"></polyline>
							<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
							<rect x="6" y="14" width="12" height="8"></rect>
						</svg>
						<span>Print</span>
					</button>

					<button id="pm-float-trace-btn" class="pm-pill-btn" title="Toggle Execution Trace &amp; Lifecycle Events">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
						</svg>
						<span>Trace</span>
					</button>
				</div>

				<div class="pm-toolbar-divider pm-hide-when-minimized"></div>

				<!-- Minimize Toolbar Handle -->
				<div class="pm-toolbar-pill-group pm-hide-when-minimized">
					<button id="pm-toolbar-collapse-btn" class="pm-pill-btn pm-pill-icon" title="Minimize toolbar to bottom">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</button>
				</div>
			</div>

			<!-- Trace details popover panel (positioned above floating bar) -->
			<div class="pm-trace-popover" id="pm-trace-popover">
				<div class="pm-trace-popover-header">
					<strong style="color: var(--pm-accent-sky);">Execution Lifecycle &amp; Trace Events</strong>
					<span id="pm-trace-summary" style="color: var(--pm-text-muted);">No events recorded</span>
					<button id="pm-trace-close-btn" class="pm-pill-btn pm-pill-icon" title="Close Trace Panel">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
				<div class="pm-trace-popover-content" id="pm-trace-content">
					<div style="color: var(--pm-text-faint); padding: 8px 0;">Render a document to view phase breakdown.</div>
				</div>
			</div>
		`;

		this.canvasScrollEl = this.element.querySelector<HTMLElement>("#pm-canvas-scroll")!;
		this.renderViewport = this.element.querySelector<HTMLElement>("#render-viewport")!;
		this.zoomContainer = this.element.querySelector<HTMLElement>("#pm-zoom-container")!;
		this.zoomSelect = this.element.querySelector<HTMLSelectElement>("#pm-zoom-select")!;
		this.singleViewBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-single-view-btn")!;
		this.spreadViewBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-spread-view-btn")!;
		this.flipbookViewBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-flipbook-view-btn",
		)!;
		this.pageIndicatorEl = this.element.querySelector<HTMLElement>("#pm-page-indicator")!;
		this.overlayBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-float-overlay-btn",
		)!;
		this.traceBtn = this.element.querySelector<HTMLButtonElement>("#pm-float-trace-btn")!;
		this.tracePopover = this.element.querySelector<HTMLElement>("#pm-trace-popover")!;
		this.traceContentEl = this.element.querySelector<HTMLElement>("#pm-trace-content")!;
		this.traceSummaryEl = this.element.querySelector<HTMLElement>("#pm-trace-summary")!;
		this.statusDot = this.element.querySelector<HTMLElement>("#pm-float-status-dot")!;
		this.statusLabel = this.element.querySelector<HTMLElement>("#pm-float-status-label")!;
		this.floatingBarEl = this.element.querySelector<HTMLElement>(
			"#pm-floating-preview-bar",
		)!;
		this.gridControlsEl = this.element.querySelector<HTMLElement>("#pm-grid-controls")!;
		this.gridColsSelect =
			this.element.querySelector<HTMLSelectElement>("#pm-grid-cols-select")!;
		this.collapseBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-toolbar-collapse-btn",
		)!;
		this.expandBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-toolbar-expand-btn",
		)!;
		this.bookSidePrev =
			this.element.querySelector<HTMLButtonElement>("#pm-book-side-prev")!;
		this.bookSideNext =
			this.element.querySelector<HTMLButtonElement>("#pm-book-side-next")!;

		const isInitialBook = isFlipbookMode(initialViewMode);

		this.bookSidePrev.style.display = isInitialBook ? "flex" : "none";
		this.bookSideNext.style.display = isInitialBook ? "flex" : "none";

		const zoomOutBtn = this.element.querySelector<HTMLButtonElement>("#pm-zoom-out-btn")!;
		const zoomInBtn = this.element.querySelector<HTMLButtonElement>("#pm-zoom-in-btn")!;
		const zoomFitBtn = this.element.querySelector<HTMLButtonElement>("#pm-zoom-fit-btn")!;

		const prevPageBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-prev-page-btn")!;

		const nextPageBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-next-page-btn")!;

		const printBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-float-print-btn")!;

		const traceCloseBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-trace-close-btn")!;

		this.zoomSelect.addEventListener("change", () => {
			this.setZoom(parseFloat(this.zoomSelect.value));
			callbacks.onZoomChange(this.currentZoom);
		});

		zoomInBtn.addEventListener("click", () => {
			this.setZoom(Math.min(2.0, Math.round((this.currentZoom + 0.1) * 10) / 10));
			callbacks.onZoomChange(this.currentZoom);
		});

		zoomOutBtn.addEventListener("click", () => {
			this.setZoom(Math.max(0.3, Math.round((this.currentZoom - 0.1) * 10) / 10));
			callbacks.onZoomChange(this.currentZoom);
		});

		zoomFitBtn.addEventListener("click", () => {
			this.fitToView();
		});

		prevPageBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.handlePrevPage();
		});
		nextPageBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.handleNextPage();
		});
		this.bookSidePrev.addEventListener("click", () => this.handlePrevPage());
		this.bookSideNext.addEventListener("click", () => this.handleNextPage());

		this.singleViewBtn.addEventListener("click", () => {
			this.setViewMode("single");
			callbacks.onViewModeChange("single");
		});

		this.spreadViewBtn.addEventListener("click", () => {
			this.setViewMode("spread");
			callbacks.onViewModeChange("spread");
		});

		this.flipbookViewBtn.addEventListener("click", () => {
			this.setViewMode("flipbook");
			callbacks.onViewModeChange("flipbook");
		});

		this.collapseBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.setToolbarMinimized(true);
		});

		this.expandBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.setToolbarMinimized(false);
		});

		this.floatingBarEl.addEventListener("click", (e) => {
			if (!this.isToolbarMinimized) return;
			const target = e.target instanceof HTMLElement ? e.target : null;

			if (
				target?.closest(
					"#pm-prev-page-btn, #pm-next-page-btn, #pm-page-indicator, button, select, input",
				)
			) {
				return;
			}

			this.setToolbarMinimized(false);
		});

		this.gridColsSelect.addEventListener("change", () => {
			this.gridCols = parseInt(this.gridColsSelect.value, 10) || 2;
			this.applyGridDimensions();
		});

		if (typeof window !== "undefined") {
			window.addEventListener("keydown", (e: KeyboardEvent) => {
				if (
					e.key === "Escape" &&
					!(e.target instanceof HTMLInputElement) &&
					!(e.target instanceof HTMLTextAreaElement)
				) {
					this.setToolbarMinimized(!this.isToolbarMinimized);
				}
			});
		}

		this.overlayBtn.addEventListener("click", () => {
			this.isOverlayVisible = !this.isOverlayVisible;
			this.overlayBtn.classList.toggle("active", this.isOverlayVisible);
			callbacks.onOverlayToggle?.(this.isOverlayVisible);
		});

		this.traceBtn.addEventListener("click", () => {
			this.isTraceOpen = !this.isTraceOpen;
			this.traceBtn.classList.toggle("active", this.isTraceOpen);
			this.tracePopover.classList.toggle("open", this.isTraceOpen);
		});

		traceCloseBtn?.addEventListener("click", () => {
			this.isTraceOpen = false;
			this.traceBtn.classList.remove("active");
			this.tracePopover.classList.remove("open");
		});

		printBtn.addEventListener("click", () => {
			callbacks.onPrintClick?.();
		});

		this.renderViewport.addEventListener("flipbook:change", this.onFlipbookChange);
		this.renderViewport.addEventListener("page:change", this.onPageChangeEvent);
		this.renderViewport.addEventListener("views:page-change", this.onPageChangeEvent);
		this.canvasScrollEl.addEventListener("scroll", this.onCanvasScroll, {
			passive: true,
		});

		if (typeof window !== "undefined") {
			window.addEventListener("resize", this.onCanvasScroll, {
				passive: true,
			});
		}

		this.setZoom(initialZoom);
	}

	private getFlipBookController(): FlipBookController | null {
		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);

		const doc = iframe?.contentDocument ?? this.renderViewport;

		const pagesContainer = doc.querySelector<HTMLElement>(
			".printedjs_pages, .pagedjs_pages",
		);

		if (!pagesContainer) return null;

		// SAFETY: pages container element in DOM hosts flipbook controller instance
		const host = pagesContainer as FlipbookHostElement;

		return host.__printedjs_flipbook ?? null;
	}

	private handlePrevPage(): void {
		if (this.currentViewMode === "flipbook") {
			const flipBook = this.getFlipBookController();

			if (flipBook) {
				void flipBook.prev();

				return;
			}
		}

		if (this.currentViewMode === "spread") {
			const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
				"iframe[data-playground-frame]",
			);

			const doc = iframe?.contentDocument ?? this.renderViewport;

			const pages = Array.from(
				doc.querySelectorAll<HTMLElement>(".printedjs_page, .pagedjs_page"),
			);

			const rows = this.getPageRows(pages);

			const currentRowIndex = rows.findIndex((row) =>
				row.some((p) => this.getPageNumber(p) === this.currentPageIndex),
			);

			if (currentRowIndex > 0) {
				const prevRow = rows[currentRowIndex - 1]!;
				const targetPage = this.getPageNumber(prevRow[0]!);
				this.scrollToPage(targetPage);

				return;
			}

			return;
		}

		this.scrollToPage(this.currentPageIndex - 1);
	}

	private handleNextPage(): void {
		if (this.currentViewMode === "flipbook") {
			const flipBook = this.getFlipBookController();

			if (flipBook) {
				void flipBook.next();

				return;
			}
		}

		if (this.currentViewMode === "spread") {
			const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
				"iframe[data-playground-frame]",
			);

			const doc = iframe?.contentDocument ?? this.renderViewport;

			const pages = Array.from(
				doc.querySelectorAll<HTMLElement>(".printedjs_page, .pagedjs_page"),
			);

			const rows = this.getPageRows(pages);

			const currentRowIndex = rows.findIndex((row) =>
				row.some((p) => this.getPageNumber(p) === this.currentPageIndex),
			);

			if (currentRowIndex >= 0 && currentRowIndex < rows.length - 1) {
				const nextRow = rows[currentRowIndex + 1]!;
				const targetPage = this.getPageNumber(nextRow[0]!);
				this.scrollToPage(targetPage);

				return;
			}

			return;
		}

		this.scrollToPage(this.currentPageIndex + 1);
	}

	getContentWidth(): number {
		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);

		const doc = iframe?.contentDocument ?? this.renderViewport;

		const pagesContainer = doc.querySelector<HTMLElement>(
			".printedjs_pages, .pagedjs_pages",
		);

		const pages = Array.from(
			doc.querySelectorAll<HTMLElement>(".printedjs_page, .pagedjs_page"),
		);

		if (pages.length === 0) {
			return this.currentViewMode === "spread" || this.currentViewMode === "flipbook"
				? 1680
				: 860;
		}

		if (isFlipbookMode(this.currentViewMode)) {
			const pinned = parseFloat(pagesContainer?.style.width || "");

			if (pinned > 0) return Math.ceil(pinned + 48);
		}

		let maxPageWidth = 0;

		for (const page of pages) {
			const view = page.ownerDocument?.defaultView || window;
			const computed = view.getComputedStyle ? view.getComputedStyle(page) : null;

			const w =
				parseFloat(computed?.width || "") ||
				page.offsetWidth ||
				parseFloat(page.style.width) ||
				794;

			if (w > maxPageWidth) maxPageWidth = w;
		}

		if (maxPageWidth <= 0) maxPageWidth = 794;

		if (this.currentViewMode === "single") {
			return Math.max(860, Math.ceil(maxPageWidth + 64));
		}

		if (isFlipbookMode(this.currentViewMode)) {
			const isMobile = "innerWidth" in globalThis && globalThis.innerWidth <= 768;

			if (isMobile) return Math.ceil(maxPageWidth + 48);

			return Math.ceil(maxPageWidth * 2 + 48);
		}

		if (this.currentViewMode === "spread") {
			const cols = Math.max(1, this.gridCols);

			return Math.ceil(maxPageWidth * cols + (cols - 1) * 24 + 32);
		}

		return 860;
	}

	private pageSize(): PageDimensions {
		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);

		const doc = iframe?.contentDocument ?? this.renderViewport;
		const page = doc.querySelector<HTMLElement>(".printedjs_page, .pagedjs_page");

		if (!page) {
			return { width: 794, height: 1123 };
		}

		const view = page.ownerDocument?.defaultView || window;
		const computed = view.getComputedStyle ? view.getComputedStyle(page) : null;

		const width =
			parseFloat(computed?.width || "") ||
			page.offsetWidth ||
			parseFloat(page.style.width || "") ||
			794;

		const height =
			parseFloat(computed?.height || "") ||
			page.offsetHeight ||
			parseFloat(page.style.height || "") ||
			1123;

		return {
			width: width > 0 ? width : 794,
			height: height > 0 ? height : 1123,
		};
	}

	getContentHeight(): number {
		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);

		const doc = iframe?.contentDocument ?? this.renderViewport;

		const pagesContainer = doc.querySelector<HTMLElement>(
			".printedjs_pages, .pagedjs_pages",
		);

		const pageHeight = this.pageSize().height;

		if (isFlipbookMode(this.currentViewMode)) {
			const pinned = parseFloat(pagesContainer?.style.height || "");

			if (pinned > 0) return Math.ceil(pinned + 48);

			return Math.ceil(pageHeight + 48);
		}

		if (this.currentViewMode === "spread") {
			return Math.ceil(pageHeight + 48);
		}

		if (pageHeight > 0) return pageHeight + 32;

		return 1123;
	}

	fitToView(): void {
		const canvasStyle = window.getComputedStyle?.(this.canvasScrollEl);

		const padX = canvasStyle
			? (parseFloat(canvasStyle.paddingLeft) || 0) +
				(parseFloat(canvasStyle.paddingRight) || 0)
			: 80;

		const padY = canvasStyle
			? (parseFloat(canvasStyle.paddingTop) || 0) +
				(parseFloat(canvasStyle.paddingBottom) || 0)
			: 180;

		const availableWidth = this.canvasScrollEl.clientWidth - padX;
		const availableHeight = this.canvasScrollEl.clientHeight - padY;
		const contentWidth = this.getContentWidth();
		const contentHeight = this.getContentHeight();

		if (availableWidth <= 0 || contentWidth <= 0) return;

		const scaleX = availableWidth / contentWidth;

		const scaleY =
			availableHeight > 0 && contentHeight > 0 ? availableHeight / contentHeight : scaleX;

		const bestScale = Math.min(scaleX, scaleY);
		let calculatedZoom = Math.floor(bestScale * 100) / 100;
		calculatedZoom = Math.max(0.1, Math.min(1.5, calculatedZoom));
		this.setZoom(calculatedZoom);
		this.callbacks.onZoomChange(calculatedZoom);
	}

	setZoom(zoom: number): void {
		this.currentZoom = zoom;

		// SAFETY: zoom property is supported in Chromium/WebKit CSSStyleDeclaration
		const styleWithZoom = this.zoomContainer.style as CSSStyleDeclarationWithZoom;
		const supportsZoom = "zoom" in styleWithZoom;

		if (supportsZoom) {
			styleWithZoom.zoom = String(zoom);
			styleWithZoom.transform = "none";
		} else {
			styleWithZoom.transform = `scale(${zoom})`;
			styleWithZoom.transformOrigin = "top center";
		}

		const zoomStr = String(zoom);
		const percentText = `${Math.round(zoom * 100)}%`;

		const matchedPreset = Array.from(this.zoomSelect.options).find(
			(opt) =>
				!opt.hasAttribute("data-custom") &&
				(opt.value === zoomStr ||
					Math.round(parseFloat(opt.value) * 100) === Math.round(zoom * 100)),
		);

		let customOpt = this.zoomSelect.querySelector<HTMLOptionElement>(
			'option[data-custom="true"]',
		);

		if (matchedPreset) {
			if (customOpt) {
				customOpt.remove();
			}

			matchedPreset.selected = true;
		} else {
			if (!customOpt) {
				customOpt = document.createElement("option");
				customOpt.setAttribute("data-custom", "true");
				this.zoomSelect.appendChild(customOpt);
			}

			customOpt.value = zoomStr;
			customOpt.textContent = percentText;
			customOpt.selected = true;
		}
	}

	setOverlayVisible(visible: boolean): void {
		this.isOverlayVisible = visible;
		this.overlayBtn.classList.toggle("active", visible);
	}

	setToolbarMinimized(minimized: boolean): void {
		this.isToolbarMinimized = minimized;
		this.floatingBarEl.classList.toggle("is-minimized", minimized);
	}

	private applyGridDimensions(): void {
		const cols = this.gridCols;

		this.renderViewport.style.setProperty("--pm-grid-cols", String(cols));

		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);

		const doc = iframe?.contentDocument;

		if (doc) {
			if (doc.documentElement) {
				doc.documentElement.style.setProperty("--pm-grid-cols", String(cols));
			}

			if (doc.body) {
				doc.body.style.setProperty("--pm-grid-cols", String(cols));

				const pagesContainer = doc.querySelector<HTMLElement>(
					".printedjs_pages, .pagedjs_pages",
				);

				if (pagesContainer) {
					pagesContainer.style.setProperty("--pm-grid-cols", String(cols));
					pagesContainer.setAttribute("data-grid-cols", String(cols));
				}
			}
		}

		if (this.currentViewMode === "spread") {
			this.adjustIframe();
			this.fitToView();
		}
	}

	setViewMode(mode: ViewMode): void {
		this.currentViewMode = mode;
		const isSingle = mode === "single";
		const isSpread = mode === "spread";
		const isBook = isFlipbookMode(mode);

		this.singleViewBtn.classList.toggle("active", isSingle);
		this.spreadViewBtn.classList.toggle("active", isSpread);
		this.flipbookViewBtn.classList.toggle("active", isBook);

		this.element.classList.toggle("pm-single-view", isSingle);
		this.element.classList.toggle("pm-spread-view", isSpread);
		this.element.classList.toggle("pm-flipbook-view", isBook);

		this.gridControlsEl.style.display = isSpread ? "flex" : "none";
		this.bookSidePrev.style.display = isBook ? "flex" : "none";
		this.bookSideNext.style.display = isBook ? "flex" : "none";

		if (isSpread) {
			this.applyGridDimensions();
		}

		if (isBook) {
			const flipBook = this.getFlipBookController();

			if (flipBook) {
				this.currentPageIndex = flipBook.currentPage;
				this.updateBookPageIndicator(
					flipBook.currentSpread,
					flipBook.totalSpreads,
					flipBook.currentPage,
					flipBook.currentRange?.left,
					flipBook.currentRange?.right,
				);
			} else {
				this.updateBookPageIndicator(0, Math.ceil((this.totalPages + 1) / 2), 1);
			}
		} else {
			this.updatePageStats(this.totalPages);
		}

		this.adjustIframe();
		this.fitToView();

		if (!isBook) {
			this.updateActivePagesFromScroll();
		}
	}

	adjustIframe(targetIframe?: HTMLIFrameElement | null): void {
		const iframe =
			targetIframe ??
			this.renderViewport.querySelector<HTMLIFrameElement>(
				"iframe[data-playground-frame]",
			);

		if (!iframe?.contentDocument || !iframe.contentDocument.body) return;
		const doc = iframe.contentDocument;
		const isSpread = this.currentViewMode === "spread";

		const isFlipbook = isFlipbookMode(this.currentViewMode);

		doc.documentElement.classList.toggle("pm-spread-view", isSpread);
		doc.body.classList.toggle("pm-spread-view", isSpread);
		doc.documentElement.classList.toggle("pm-flipbook-view", isFlipbook);
		doc.body.classList.toggle("pm-flipbook-view", isFlipbook);
		doc.documentElement.classList.toggle("pm-single-view", !isSpread && !isFlipbook);
		doc.body.classList.toggle("pm-single-view", !isSpread && !isFlipbook);

		if (isSpread) {
			doc.documentElement.style.setProperty("--pm-grid-cols", String(this.gridCols));
			doc.body.style.setProperty("--pm-grid-cols", String(this.gridCols));

			const pagesContainer = doc.querySelector<HTMLElement>(
				".printedjs_pages, .pagedjs_pages",
			);

			if (pagesContainer) {
				pagesContainer.style.setProperty("--pm-grid-cols", String(this.gridCols));
			}
		}

		doc.removeEventListener("flipbook:change", this.onFlipbookChange);
		doc.addEventListener("flipbook:change", this.onFlipbookChange);
		doc.removeEventListener("page:change", this.onPageChangeEvent);
		doc.addEventListener("page:change", this.onPageChangeEvent);
		doc.removeEventListener("views:page-change", this.onPageChangeEvent);
		doc.addEventListener("views:page-change", this.onPageChangeEvent);

		// SAFETY: doc contains either .printedjs_pages, .pagedjs_pages, or fallback body element
		const pagesContainer = (doc.querySelector(".printedjs_pages") ??
			doc.querySelector(".pagedjs_pages") ??
			doc.body) as HTMLElement;

		const targetWidth = this.getContentWidth();
		iframe.style.width = `${targetWidth}px`;

		const contentHeight = isFlipbook
			? this.getContentHeight() + 96
			: Math.max(
					doc.documentElement.scrollHeight,
					doc.body.scrollHeight,
					pagesContainer.scrollHeight + 48,
				);

		iframe.style.height = `${Math.ceil(contentHeight) + 48}px`;
		iframe.style.overflow = "hidden";
		iframe.setAttribute("scrolling", "no");
		doc.documentElement.style.overflow = "hidden";
		doc.body.style.overflow = isFlipbook ? "hidden" : "";

		if (!isFlipbook) {
			this.updateActivePagesFromScroll();
		}
	}

	updatePageStats(pageCount: number): void {
		this.totalPages = pageCount;

		if (pageCount === 0) {
			this.pageIndicatorEl.textContent = "0 pages";
			this.currentPageIndex = 0;

			return;
		}

		if (isFlipbookMode(this.currentViewMode)) {
			const flipBook = this.getFlipBookController();

			if (flipBook) {
				this.currentPageIndex = flipBook.currentPage;
				this.updateBookPageIndicator(
					flipBook.currentSpread,
					flipBook.totalSpreads,
					flipBook.currentPage,
					flipBook.currentRange?.left,
					flipBook.currentRange?.right,
				);
			} else {
				this.currentPageIndex = 1;
				this.updateBookPageIndicator(0, Math.ceil((pageCount + 1) / 2), 1);
			}

			return;
		}

		if (this.currentViewMode === "single" || this.currentViewMode === "spread") {
			this.updateActivePagesFromScroll();

			return;
		}

		this.currentPageIndex = 1;
		this.pageIndicatorEl.textContent = `1 of ${pageCount}`;
	}

	getPageNumber(pageEl: HTMLElement, fallbackIndex = 1): number {
		const attr = pageEl.getAttribute("data-page-number")?.trim();

		if (attr) {
			const parsed = parseInt(attr, 10);

			if (Number.isFinite(parsed) && parsed > 0) return parsed;
		}

		return fallbackIndex;
	}

	getPageLabel(pageEl: HTMLElement, fallbackNumber: number): string | number {
		const frozen = pageEl
			.querySelector<HTMLElement>('[data-folio-frozen="true"]')
			?.textContent?.trim();

		if (frozen) {
			const num = Number(frozen);

			return Number.isFinite(num) && String(num) === frozen ? num : frozen;
		}

		const formatted = pageEl.getAttribute("data-page-formatted")?.trim();

		if (formatted) {
			const num = Number(formatted);

			return Number.isFinite(num) && String(num) === formatted ? num : formatted;
		}

		const style = (
			pageEl.getAttribute("data-page-style") ||
			pageEl.getAttribute("data-counter-style") ||
			pageEl.getAttribute("data-page-counter-style")
		)
			?.toLowerCase()
			.trim();

		const logical = this.getPageNumber(pageEl, fallbackNumber);

		if (style && style !== "decimal" && Number.isFinite(logical)) {
			// SAFETY: style attribute from page element cast to supported PageCounterStyle
			return formatPageNumber(logical, style as PageCounterStyle);
		}

		return logical;
	}

	getPageRows(pages: HTMLElement[]): HTMLElement[][] {
		if (pages.length === 0) return [];

		if (this.currentViewMode === "single") {
			return pages.map((p) => [p]);
		}

		const firstTop = pages[0]?.offsetTop ?? 0;
		const secondTop = pages[1]?.offsetTop ?? 0;
		const hasLayoutOffsets = pages.length > 1 && (firstTop !== 0 || secondTop !== 0);

		if (hasLayoutOffsets) {
			const rows: HTMLElement[][] = [];
			let currentRow: HTMLElement[] = [];
			let currentRowTop: number | null = null;

			for (const page of pages) {
				const top = page.offsetTop;

				if (currentRowTop === null || Math.abs(top - currentRowTop) <= 8) {
					currentRow.push(page);

					if (currentRowTop === null) currentRowTop = top;
				} else {
					rows.push(currentRow);
					currentRow = [page];
					currentRowTop = top;
				}
			}

			if (currentRow.length > 0) {
				rows.push(currentRow);
			}

			return rows;
		}

		const cols = Math.max(1, this.gridCols);
		const rows: HTMLElement[][] = [];

		const hasCoverOffset =
			pages[0]?.classList.contains("printedjs_right_page") ||
			pages[0]?.style.gridColumn === "2";

		let startIndex = 0;

		if (hasCoverOffset && cols === 2) {
			rows.push([pages[0]!]);
			startIndex = 1;
		}

		for (let i = startIndex; i < pages.length; i += cols) {
			rows.push(pages.slice(i, i + cols));
		}

		return rows;
	}

	updateActivePagesFromScroll(): void {
		if (isFlipbookMode(this.currentViewMode)) {
			return;
		}

		if (this.totalPages <= 0) return;

		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);

		const doc = iframe?.contentDocument ?? this.renderViewport;

		const pages = Array.from(
			doc.querySelectorAll<HTMLElement>(".printedjs_page, .pagedjs_page"),
		);

		if (pages.length === 0) {
			this.currentPageIndex = 1;
			this.pageIndicatorEl.textContent = `1 of ${this.totalPages}`;

			return;
		}

		const rows = this.getPageRows(pages);

		if (rows.length === 0) return;

		const containerRect = this.canvasScrollEl.getBoundingClientRect();
		const iframeRect = iframe ? iframe.getBoundingClientRect() : null;
		const hasContainerDimensions = containerRect.height > 0;

		let bestRowIndex = 0;

		if (hasContainerDimensions) {
			let maxVisibleHeight = -1;
			let minCenterDistance = Number.POSITIVE_INFINITY;
			const viewportCenter = containerRect.height / 2;

			for (let i = 0; i < rows.length; i++) {
				const row = rows[i]!;
				const firstPage = row[0]!;
				const pageRect = firstPage.getBoundingClientRect();
				const pageTopInWindow = (iframeRect ? iframeRect.top : 0) + pageRect.top;
				const relTop = pageTopInWindow - containerRect.top;
				const relBottom = relTop + pageRect.height;

				const visibleTop = Math.max(0, relTop);
				const visibleBottom = Math.min(containerRect.height, relBottom);
				const visibleHeight = Math.max(0, visibleBottom - visibleTop);

				const rowCenter = (relTop + relBottom) / 2;
				const centerDist = Math.abs(rowCenter - viewportCenter);

				if (visibleHeight > maxVisibleHeight) {
					maxVisibleHeight = visibleHeight;
					minCenterDistance = centerDist;
					bestRowIndex = i;
				} else if (
					Math.abs(visibleHeight - maxVisibleHeight) < 5 &&
					centerDist < minCenterDistance
				) {
					minCenterDistance = centerDist;
					bestRowIndex = i;
				}
			}
		} else if (this.canvasScrollEl.scrollTop > 0) {
			const maxScroll = Math.max(
				1,
				this.canvasScrollEl.scrollHeight - this.canvasScrollEl.clientHeight,
			);

			const ratio = Math.max(0, Math.min(1, this.canvasScrollEl.scrollTop / maxScroll));
			bestRowIndex = Math.min(rows.length - 1, Math.floor(ratio * rows.length));
		} else if (this.currentPageIndex > 1) {
			const foundIdx = rows.findIndex((row) =>
				row.some((p) => this.getPageNumber(p) === this.currentPageIndex),
			);

			bestRowIndex = foundIdx >= 0 ? foundIdx : 0;
		}

		const winningRow = rows[bestRowIndex] ?? rows[0]!;
		const firstPage = winningRow[0]!;
		const lastPage = winningRow[winningRow.length - 1]!;

		const firstPageNum = this.getPageNumber(firstPage, 1);
		const lastPageNum = this.getPageNumber(lastPage, firstPageNum);

		const firstLabel = this.getPageLabel(firstPage, firstPageNum);
		const lastLabel = this.getPageLabel(lastPage, lastPageNum);

		const rowNumbers = winningRow.map((p, idx) =>
			this.getPageNumber(p, firstPageNum + idx),
		);

		this.currentPageIndex = firstPageNum;

		if (this.currentViewMode === "single") {
			this.pageIndicatorEl.textContent = `${firstLabel} of ${this.totalPages}`;
		} else {
			if (winningRow.length === 1) {
				this.pageIndicatorEl.textContent = `${firstLabel} of ${this.totalPages}`;
			} else {
				this.pageIndicatorEl.textContent = `${firstLabel}–${lastLabel} of ${this.totalPages}`;
			}
		}

		this.emitActivePageChange({
			viewMode: this.currentViewMode,
			currentPage: this.currentPageIndex,
			totalPages: this.totalPages,
			currentSpread: bestRowIndex,
			totalSpreads: rows.length,
			leftPage: firstLabel,
			rightPage: winningRow.length > 1 ? lastLabel : null,
			visiblePages: rowNumbers,
		});
	}

	private emitActivePageChange(detail: ActivePageChangeDetail): void {
		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);

		const doc = iframe?.contentDocument;

		const pagesContainer = doc?.querySelector<HTMLElement>(
			".printedjs_pages, .pagedjs_pages",
		);

		const eventInit = { detail, bubbles: true, composed: true };

		if (pagesContainer) {
			pagesContainer.dispatchEvent(new CustomEvent("page:change", eventInit));
			pagesContainer.dispatchEvent(new CustomEvent("views:page-change", eventInit));
		}

		if (doc) {
			doc.dispatchEvent(new CustomEvent("page:change", eventInit));
			doc.dispatchEvent(new CustomEvent("views:page-change", eventInit));
		}

		this.renderViewport.dispatchEvent(new CustomEvent("page:change", eventInit));
		this.renderViewport.dispatchEvent(new CustomEvent("views:page-change", eventInit));
	}

	updateBookPageIndicator(
		spread: number,
		_totalSpreads: number,
		currentPage?: number,
		leftPage?: number | string | null,
		rightPage?: number | string | null,
	): void {
		const total = this.totalPages;

		if (total <= 0) {
			this.pageIndicatorEl.textContent = "0 pages";

			return;
		}

		const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

		if (isMobile) {
			const pageNum = rightPage ?? currentPage ?? spread + 1;
			this.pageIndicatorEl.textContent = `${pageNum} of ${total}`;

			return;
		}

		const right = rightPage ?? (spread === 0 ? 1 : Math.min(total, spread * 2 + 1));

		const left =
			leftPage === undefined
				? spread === 0
					? null
					: isNumber(right)
						? right - 1
						: null
				: leftPage;

		const isLeftValid =
			left != null &&
			left !== "" &&
			(isNumber(left) ? left >= 1 : true) &&
			left !== right;

		if (!isLeftValid) {
			this.pageIndicatorEl.textContent = `${right} of ${total}`;
		} else {
			this.pageIndicatorEl.textContent = `${left}–${right} of ${total}`;
		}
	}

	scrollToPage(targetPageNumber: number): void {
		if (targetPageNumber < 1 || targetPageNumber > this.totalPages) return;

		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);

		const doc = iframe?.contentDocument ?? this.renderViewport;

		const pageEl = doc.querySelector<HTMLElement>(
			`[data-page-number="${targetPageNumber}"]`,
		);

		if (pageEl) {
			const containerRect = this.canvasScrollEl.getBoundingClientRect();
			const iframeRect = iframe ? iframe.getBoundingClientRect() : null;
			const pageRect = pageEl.getBoundingClientRect();

			if (containerRect.height > 0 && pageRect.height > 0) {
				const pageTopInWindow = (iframeRect ? iframeRect.top : 0) + pageRect.top;
				const delta = pageTopInWindow - containerRect.top - 24;
				this.canvasScrollEl.scrollBy({ top: delta, behavior: "smooth" });
			} else {
				pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
			}

			this.currentPageIndex = targetPageNumber;
			this.updateActivePagesFromScroll();
		}
	}

	setRendering(): void {
		this.statusDot.className = "pm-status-dot rendering";
		this.statusLabel.textContent = "Rendering...";
		this.statusLabel.style.color = "var(--pm-accent-sky)";
	}

	setSuccess(stats: RenderStats): void {
		this.currentStats = stats;
		this.statusDot.className = "pm-status-dot success";
		this.statusLabel.textContent = `${Math.round(stats.totalDurationMs)}ms`;
		this.statusLabel.style.color = "var(--pm-accent-emerald)";
		this.statusLabel.title = `Total: ${Math.round(stats.totalDurationMs)}ms (tpl: ${Math.round(stats.compileDurationMs)}ms, layout: ${Math.round(stats.layoutDurationMs)}ms, pages: ${stats.pageCount})`;

		this.renderTraceTable();
	}

	setError(message: string): void {
		this.statusDot.className = "pm-status-dot error";
		this.statusLabel.textContent = "Error";
		this.statusLabel.style.color = "var(--pm-accent-rose)";
		this.statusLabel.title = message;
	}

	setCleared(): void {
		this.currentStats = null;
		this.statusDot.className = "pm-status-dot ready";
		this.statusLabel.textContent = "Ready";
		this.statusLabel.style.color = "var(--pm-text-secondary)";
		this.statusLabel.title = "Renderer ready";
		this.updatePageStats(0);
		this.traceContentEl.innerHTML =
			'<div style="color: var(--pm-text-faint); padding: 8px 0;">Renderer cleared. Ready for next run.</div>';
	}

	private renderTraceTable(): void {
		const report = this.currentStats?.traceReport;

		if (!report || report.events.length === 0) {
			this.traceSummaryEl.textContent = "No events recorded";
			this.traceContentEl.innerHTML =
				'<div style="color: var(--pm-text-faint); padding: 8px 0;">No trace events captured.</div>';

			return;
		}

		this.traceSummaryEl.textContent = `${report.events.length} events | ${Math.round(report.totalDurationMs)}ms`;

		this.traceContentEl.innerHTML = `
			<table class="pm-trace-table">
				<thead>
					<tr>
						<th style="width: 80px;">Type</th>
						<th style="width: 160px;">Name</th>
						<th style="width: 90px;">Duration</th>
						<th>Details</th>
					</tr>
				</thead>
				<tbody>
					${report.events
						.map(
							(e) => `
						<tr>
							<td><span style="color: ${e.type === "phase" ? "var(--pm-accent-sky)" : "var(--pm-accent-emerald)"};">[${e.type}]</span></td>
							<td><strong>${e.name}</strong></td>
							<td>${e.durationMs !== undefined ? `${Math.round(e.durationMs * 10) / 10}ms` : "&mdash;"}</td>
							<td>${e.details ? JSON.stringify(e.details) : "&mdash;"}</td>
						</tr>
					`,
						)
						.join("")}
				</tbody>
			</table>
		`;
	}
}
