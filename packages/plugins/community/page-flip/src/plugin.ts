import type { PluginContext, PrintedjsPlugin } from "@printedjs/core";
import { PageFlipController, type PageFlipOptions } from "./controller.js";

const pageFlipCss = `
.stf__parent {
	position: relative !important;
	display: block !important;
	box-sizing: border-box !important;
	transform: translateZ(0) !important;
	touch-action: pan-y !important;
	margin: 0 auto !important;
	box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.5);
}

.stf__wrapper {
	position: relative !important;
	width: 100% !important;
	height: 100% !important;
	padding-bottom: 0 !important;
	box-sizing: border-box !important;
	margin: 0 auto !important;
	overflow: visible !important;
}

.stf__parent canvas {
	position: absolute !important;
	width: 100% !important;
	height: 100% !important;
	left: 0 !important;
	top: 0 !important;
}

.stf__block {
	position: absolute !important;
	width: 100% !important;
	height: 100% !important;
	box-sizing: border-box !important;
	perspective: 2000px !important;
}

.stf__item {
	visibility: hidden;
	opacity: 0;
	pointer-events: none;
	position: absolute !important;
	transform-style: preserve-3d !important;
	box-sizing: border-box !important;
	overflow: hidden !important;
	background-color: #ffffff;
	transition: none !important;
	animation: none !important;
}

.stf__item,
.stf__item *,
.stf__parent :is(.printedjs_page, .pagedjs_page),
.stf__parent :is(.printedjs_page, .pagedjs_page) * {
	box-shadow: none !important;
	border-radius: 0 !important;
	border: none !important;
	transition: none !important;
	backface-visibility: hidden !important;
	-webkit-backface-visibility: hidden !important;
}

.stf__item.--left {
	box-shadow: inset -10px 0 16px -8px rgba(0, 0, 0, 0.15) !important;
}

.stf__item.--right {
	box-shadow: inset 10px 0 16px -8px rgba(0, 0, 0, 0.15) !important;
}

.stf__outerShadow,
.stf__innerShadow,
.stf__hardShadow,
.stf__hardInnerShadow {
	position: absolute !important;
	pointer-events: none !important;
}

.stf__item[data-flip-clone="true"],
.stf__item[data-flip-clone="true"] * {
	counter-increment: none !important;
	counter-reset: none !important;
}

.printedjs_margin-content[data-folio-frozen="true"]::after,
.pagedjs_margin-content[data-folio-frozen="true"]::after {
	content: none !important;
}

@media print {
	.stf__parent {
		position: static !important;
	}
	.stf__wrapper,
	.stf__block {
		position: static !important;
		perspective: none !important;
	}
	.stf__item,
	:is(.printedjs_page, .pagedjs_page) {
		display: block !important;
		position: static !important;
		page-break-after: always !important;
		break-after: page !important;
	}
	:is(.printedjs_page, .pagedjs_page):last-child {
		page-break-after: avoid !important;
		break-after: avoid !important;
	}
}
`;

interface FlipbookHostElement extends HTMLElement {
	__printedjs_flipbook?: PageFlipController | undefined;
}

export interface ViewModeAdapter {
	readonly mode: string | readonly string[];
	attach(container: HTMLElement, options?: PageFlipOptions): PageFlipController;
	detach?(container: HTMLElement): void;
	transformStyles?(css: string, context?: PluginContext): string;
}

export function flipBookViewAdapter(options: PageFlipOptions = {}): ViewModeAdapter {
	return {
		mode: ["flipbook", "book"],
		attach(
			container: HTMLElement,
			overrideOptions?: PageFlipOptions,
		): PageFlipController {
			const merged: PageFlipOptions = { ...options };

			if (overrideOptions) {
				Object.assign(merged, overrideOptions);
			}

			const controller = new PageFlipController(container, merged);
			// SAFETY: assigning controller to custom property on DOM node
			const host = container as FlipbookHostElement;
			host.__printedjs_flipbook = controller;

			return controller;
		},
		detach(container: HTMLElement): void {
			// SAFETY: accessing controller from custom property on DOM node
			const host = container as FlipbookHostElement;
			host.__printedjs_flipbook?.destroy();
			delete host.__printedjs_flipbook;
		},
		transformStyles(css: string): string {
			return `${css}\n\n${pageFlipCss}`;
		},
	};
}

export const flipBookViewPlugin = pageFlipPlugin;

export function pageFlipPlugin(options: PageFlipOptions = {}): PrintedjsPlugin {
	return {
		name: "page-flip",
		transformStyles(css: string): string {
			return `${css}\n\n${pageFlipCss}`;
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata.document;

			if (!doc) return;

			const pagesContainer = doc.querySelector<HTMLElement>(
				".printedjs_pages, .pagedjs_pages",
			);

			if (pagesContainer) {
				const controller = new PageFlipController(pagesContainer, options);
				context.metadata.flipBook = controller;
				context.metadata.pageFlip = controller;
				// SAFETY: assigning controller to custom property on DOM node
				const host = pagesContainer as FlipbookHostElement;
				host.__printedjs_flipbook = controller;
			}
		},
	};
}
