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
	display: none;
	position: absolute !important;
	transform-style: preserve-3d !important;
	box-sizing: border-box !important;
}

.stf__outerShadow,
.stf__innerShadow,
.stf__hardShadow,
.stf__hardInnerShadow {
	position: absolute !important;
	left: 0 !important;
	top: 0 !important;
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

export function pageFlipPlugin(options: PageFlipOptions = {}): PrintedjsPlugin {
	return {
		name: "page-flip",
		transformStyles(css: string): string {
			return `${css}\n\n${pageFlipCss}`;
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata["document"] as Document | undefined;
			if (!doc) return;

			const pagesContainer = doc.querySelector<HTMLElement>(
				".printedjs_pages, .pagedjs_pages",
			);
			if (pagesContainer) {
				const controller = new PageFlipController(pagesContainer, options);
				context.metadata["flipBook"] = controller;
				context.metadata["pageFlip"] = controller;
				(pagesContainer as unknown as Record<string, unknown>).__printedjs_flipbook =
					controller;
			}
		},
	};
}
