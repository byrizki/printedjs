import { createRenderer, type BrowserRenderer } from "@printedjs/browser";
import {
	createDevtoolsOverlay,
	devtoolsPlugin,
	type DevtoolsOverlay,
	type TraceReport,
} from "@printedjs/devtools";
import { standardPreset } from "@printedjs/plugins";
import type { RenderStats } from "../types/playground.js";

export interface RenderServiceOptions {
	readonly rootElement: HTMLElement;
	readonly viewportElement: HTMLElement;
}

export interface RenderExecutionOptions {
	readonly compiledHtml: string;
	readonly isolation: "root" | "iframe";
	readonly viewMode?: "single" | "spread";
	readonly compileDurationMs: number;
	readonly showOverlay: boolean;
	readonly onIframeReady?: (iframe: HTMLIFrameElement) => void;
}

const IFRAME_VIEWPORT_STYLES = `
html, body {
	margin: 0;
	padding: 0;
	background: transparent;
	overflow: visible;
}
body {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24px 16px;
	box-sizing: border-box;
}
[data-printedjs-root="true"] {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
}
.printedjs_pages, .pagedjs_pages {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 32px;
	width: 100%;
}
.printedjs_page, .pagedjs_page {
	background: #ffffff;
	color: #0f172a;
	box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
	border-radius: 2px;
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
	margin-bottom: 32px;
	transition: transform 0.15s ease, box-shadow 0.15s ease;
}
@media screen {
	.pm-spread-view [data-printedjs-root="true"] {
		display: block !important;
		width: auto !important;
	}
	.pm-spread-view .printedjs_pages,
	.pm-spread-view .pagedjs_pages {
		display: grid !important;
		grid-template-columns: repeat(2, max-content) !important;
		justify-content: center !important;
		gap: 24px !important;
		width: max-content !important;
		margin: 0 auto !important;
	}
	.pm-spread-view .printedjs_page,
	.pm-spread-view .pagedjs_page {
		margin-bottom: 0 !important;
		margin-left: 0 !important;
		margin-right: 0 !important;
		display: block !important;
	}
}
@media print {
	html, body, [data-printedjs-root="true"] {
		margin: 0 !important;
		padding: 0 !important;
		background: #ffffff !important;
		overflow: visible !important;
		width: auto !important;
		min-width: 0 !important;
		max-width: none !important;
		height: auto !important;
		min-height: 0 !important;
		max-height: none !important;
		display: block !important;
		zoom: 1 !important;
	}
	body {
		display: block !important;
		padding: 0 !important;
	}
	.pm-spread-view .printedjs_pages,
	.pm-spread-view .pagedjs_pages,
	.printedjs_pages, .pagedjs_pages {
		display: block !important;
		grid-template-columns: none !important;
		width: auto !important;
		height: auto !important;
		min-height: 0 !important;
		max-height: none !important;
		margin: 0 !important;
		padding: 0 !important;
		gap: 0 !important;
	}
	.pm-spread-view .printedjs_page,
	.pm-spread-view .pagedjs_page,
	.printedjs_page, .pagedjs_page {
		box-shadow: none !important;
		margin: 0 !important;
		padding: 0 !important;
		border-radius: 0 !important;
		page-break-after: always !important;
		break-after: page !important;
		display: block !important;
	}
	.pm-spread-view .printedjs_page:last-child,
	.pm-spread-view .pagedjs_page:last-child,
	.printedjs_page:last-child,
	.pagedjs_page:last-child {
		page-break-after: avoid !important;
		break-after: avoid !important;
	}
}
`;

export class RenderService {
	private currentRenderer: BrowserRenderer | null = null;
	private currentOverlay: DevtoolsOverlay | null = null;
	private readonly rootElement: HTMLElement;
	private readonly viewportElement: HTMLElement;

	constructor(options: RenderServiceOptions) {
		this.rootElement = options.rootElement;
		this.viewportElement = options.viewportElement;
	}

	async executeRender(options: RenderExecutionOptions): Promise<RenderStats> {
		this.clear();

		const { compiledHtml, isolation, compileDurationMs, showOverlay } = options;

		let capturedReport: TraceReport | null = null;
		const devtools = devtoolsPlugin({
			onReport(report) {
				capturedReport = report;
			},
		});

		const plugins = [...standardPreset(), devtools];

		let target: HTMLElement = this.viewportElement;
		let createdIframe: HTMLIFrameElement | null = null;
		if (isolation === "iframe") {
			this.viewportElement.innerHTML =
				'<iframe data-playground-frame style="border: none; background: transparent; display: block; overflow: visible; margin: 0 auto;"></iframe>';
			const iframe = this.viewportElement.querySelector<HTMLIFrameElement>(
				"iframe[data-playground-frame]",
			);
			if (iframe) {
				target = iframe;
				createdIframe = iframe;
			}
		} else {
			this.viewportElement.innerHTML = "";
		}

		this.currentRenderer = createRenderer({
			target,
			isolation,
			plugins,
		});

		const renderStart = performance.now();
		const result = await this.currentRenderer.render({
			content: { html: compiledHtml },
		});
		const layoutDurationMs = performance.now() - renderStart;

		if (createdIframe?.contentDocument) {
			const doc = createdIframe.contentDocument;
			let styleEl = doc.getElementById(
				"pm-iframe-viewport-styles",
			) as HTMLStyleElement | null;
			if (!styleEl) {
				styleEl = doc.createElement("style");
				styleEl.id = "pm-iframe-viewport-styles";
				styleEl.textContent = IFRAME_VIEWPORT_STYLES;
				doc.head.appendChild(styleEl);
			}
			options.onIframeReady?.(createdIframe);
		}

		if (showOverlay) {
			this.currentOverlay = createDevtoolsOverlay(
				this.rootElement,
				capturedReport ?? undefined,
			);
		}

		const totalDurationMs = compileDurationMs + layoutDurationMs;

		return {
			pageCount: result.pages.length,
			totalDurationMs,
			compileDurationMs,
			layoutDurationMs,
			isolation,
			traceReport: capturedReport ?? undefined,
		};
	}

	setOverlayVisible(visible: boolean, report?: TraceReport): void {
		if (this.currentOverlay) {
			this.currentOverlay.destroy();
			this.currentOverlay = null;
		}
		if (visible) {
			this.currentOverlay = createDevtoolsOverlay(this.rootElement, report);
		}
	}

	clear(): void {
		if (this.currentRenderer) {
			this.currentRenderer.destroy();
			this.currentRenderer = null;
		}
		if (this.currentOverlay) {
			this.currentOverlay.destroy();
			this.currentOverlay = null;
		}
		this.viewportElement.innerHTML = "";
	}

	destroy(): void {
		this.clear();
	}
}
