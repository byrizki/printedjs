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

export class ViewportComponent {
	readonly element: HTMLElement;
	readonly renderViewport: HTMLElement;
	private readonly canvasScrollEl: HTMLElement;
	private readonly zoomContainer: HTMLElement;
	private readonly zoomSelect: HTMLSelectElement;
	private readonly singleViewBtn: HTMLButtonElement;
	private readonly spreadViewBtn: HTMLButtonElement;
	private readonly pageIndicatorEl: HTMLElement;
	private readonly overlayBtn: HTMLButtonElement;
	private readonly traceBtn: HTMLButtonElement;
	private readonly tracePopover: HTMLElement;
	private readonly traceContentEl: HTMLElement;
	private readonly traceSummaryEl: HTMLElement;
	private readonly statusDot: HTMLElement;
	private readonly statusLabel: HTMLElement;

	private currentZoom: number;
	private currentViewMode: ViewMode;
	private currentPageIndex: number = 1;
	private totalPages: number = 0;
	private isOverlayVisible: boolean = false;
	private isTraceOpen: boolean = false;
	private currentStats: RenderStats | null = null;
	private readonly callbacks: ViewportCallbacks;

	constructor(options: ViewportOptions) {
		const { initialZoom, initialViewMode, initialOverlayVisible, callbacks } = options;
		this.currentZoom = initialZoom;
		this.currentViewMode = initialViewMode;
		this.isOverlayVisible = initialOverlayVisible ?? false;
		this.callbacks = callbacks;

		this.element = document.createElement("main");
		this.element.className = "pm-viewport-wrapper";
		if (initialViewMode === "spread") {
			this.element.classList.add("pm-spread-view");
		} else {
			this.element.classList.add("pm-single-view");
		}

		this.element.innerHTML = `
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

				<!-- View Mode Toggle -->
				<div class="pm-toolbar-pill-group">
					<button id="pm-single-view-btn" class="pm-pill-btn ${initialViewMode === "single" ? "active" : ""}" title="Single Page View">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
						</svg>
						<span>Single</span>
					</button>
					<button id="pm-spread-view-btn" class="pm-pill-btn ${initialViewMode === "spread" ? "active" : ""}" title="Book Spread View (2-Page Facing)">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
							<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
						</svg>
						<span>Spread</span>
					</button>
				</div>

				<div class="pm-toolbar-divider"></div>

				<!-- Page Navigation -->
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

				<div class="pm-toolbar-divider"></div>

				<!-- Zoom Controls -->
				<div class="pm-toolbar-pill-group">
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

				<div class="pm-toolbar-divider"></div>

				<!-- Actions: Overlay, Print, Trace -->
				<div class="pm-toolbar-pill-group">
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

		this.singleViewBtn.addEventListener("click", () => {
			this.setViewMode("single");
			callbacks.onViewModeChange("single");
		});

		this.spreadViewBtn.addEventListener("click", () => {
			this.setViewMode("spread");
			callbacks.onViewModeChange("spread");
		});

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

		prevPageBtn.addEventListener("click", () => {
			this.scrollToPage(this.currentPageIndex - 1);
		});

		nextPageBtn.addEventListener("click", () => {
			this.scrollToPage(this.currentPageIndex + 1);
		});

		this.setZoom(initialZoom);
	}

	getContentWidth(): number {
		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);
		const doc = iframe?.contentDocument ?? this.renderViewport;
		const pages = Array.from(
			doc.querySelectorAll<HTMLElement>(".printedjs_page, .pagedjs_page"),
		);

		if (pages.length === 0) {
			return this.currentViewMode === "spread" ? 1680 : 860;
		}

		if (this.currentViewMode === "single") {
			let maxPageWidth = 0;
			for (const page of pages) {
				const w = page.offsetWidth || parseFloat(page.style.width) || 794;
				if (w > maxPageWidth) maxPageWidth = w;
			}
			return Math.ceil(maxPageWidth);
		}

		// In spread view, measure the pages container directly if available
		const pagesContainer = doc.querySelector<HTMLElement>(
			".printedjs_pages, .pagedjs_pages",
		);
		if (pagesContainer && pagesContainer.offsetWidth > 0) {
			return Math.ceil(pagesContainer.offsetWidth);
		}

		if (pages.length === 1) {
			const w = pages[0]?.offsetWidth || parseFloat(pages[0]?.style.width || "0") || 794;
			return Math.ceil(w);
		}

		let maxCol1 = 0;
		let maxCol2 = 0;
		for (let i = 0; i < pages.length; i++) {
			const page = pages[i];
			if (!page) continue;
			const w = page.offsetWidth || parseFloat(page.style.width) || 794;
			if (i % 2 === 0) {
				if (w > maxCol1) maxCol1 = w;
			} else {
				if (w > maxCol2) maxCol2 = w;
			}
		}

		return Math.ceil(maxCol1 + maxCol2 + 24);
	}

	fitToView(): void {
		const availableWidth = this.canvasScrollEl.clientWidth - 80;
		const contentWidth = this.getContentWidth();
		if (availableWidth <= 0 || contentWidth <= 0) return;

		let calculatedZoom = Math.floor((availableWidth / contentWidth) * 20) / 20;
		calculatedZoom = Math.max(0.3, Math.min(1.5, calculatedZoom));
		this.setZoom(calculatedZoom);
		this.callbacks.onZoomChange(calculatedZoom);
	}

	setZoom(zoom: number): void {
		this.currentZoom = zoom;

		if ("zoom" in this.zoomContainer.style) {
			(this.zoomContainer.style as unknown as { zoom: string }).zoom = String(zoom);
			this.zoomContainer.style.transform = "none";
		} else {
			this.zoomContainer.style.transform = `scale(${zoom})`;
			this.zoomContainer.style.transformOrigin = "top center";
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

	setViewMode(mode: ViewMode): void {
		this.currentViewMode = mode;
		if (mode === "spread") {
			this.element.classList.add("pm-spread-view");
			this.element.classList.remove("pm-single-view");
			this.spreadViewBtn.classList.add("active");
			this.singleViewBtn.classList.remove("active");
		} else {
			this.element.classList.remove("pm-spread-view");
			this.element.classList.add("pm-single-view");
			this.singleViewBtn.classList.add("active");
			this.spreadViewBtn.classList.remove("active");
		}
		this.adjustIframe();
		this.fitToView();
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

		doc.documentElement.classList.toggle("pm-spread-view", isSpread);
		doc.body.classList.toggle("pm-spread-view", isSpread);
		doc.documentElement.classList.toggle("pm-single-view", !isSpread);
		doc.body.classList.toggle("pm-single-view", !isSpread);

		const pagesContainer = (doc.querySelector(".printedjs_pages") ??
			doc.querySelector(".pagedjs_pages") ??
			doc.body) as HTMLElement;

		const targetWidth = this.getContentWidth();
		iframe.style.width = `${targetWidth}px`;

		const contentHeight = Math.max(
			doc.documentElement.scrollHeight,
			doc.body.scrollHeight,
			pagesContainer.scrollHeight + 48,
		);
		iframe.style.height = `${Math.ceil(contentHeight) + 48}px`;
	}

	updatePageStats(pageCount: number): void {
		this.totalPages = pageCount;
		if (pageCount === 0) {
			this.pageIndicatorEl.textContent = "0 pages";
			this.currentPageIndex = 0;
		} else {
			this.currentPageIndex = 1;
			this.pageIndicatorEl.textContent = `1 of ${pageCount}`;
		}
	}

	scrollToPage(targetPageNumber: number): void {
		if (targetPageNumber < 1 || targetPageNumber > this.totalPages) return;
		const iframe = this.renderViewport.querySelector<HTMLIFrameElement>(
			"iframe[data-playground-frame]",
		);
		const doc = iframe?.contentDocument ?? this.renderViewport;
		const pageEl = doc.querySelector(`[data-page-number="${targetPageNumber}"]`);
		if (pageEl) {
			pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
			this.currentPageIndex = targetPageNumber;
			this.pageIndicatorEl.textContent = `${targetPageNumber} of ${this.totalPages}`;
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
