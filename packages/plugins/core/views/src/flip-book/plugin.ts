import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";
import type { FlipBookViewOptions } from "../types.js";
import { DomFlipBookController } from "./controller.js";

export function flipBookViewPlugin(options: FlipBookViewOptions = {}): PrintedjsPlugin {
	const flipBookCss = `
@keyframes pm-flip-turn-next-out {
	0% {
		transform: rotateY(0deg) skewY(0deg);
		box-shadow: inset 15px 0 25px -10px rgba(0, 0, 0, 0.2), 0 10px 30px -5px rgba(0, 0, 0, 0.4);
	}
	35% {
		transform: rotateY(-32deg) skewY(-4.5deg) scale(0.98);
		box-shadow: inset 20px 0 28px -10px rgba(0, 0, 0, 0.3), -18px 12px 35px -5px rgba(0, 0, 0, 0.45);
	}
	70% {
		transform: rotateY(-68deg) skewY(-5deg) scale(0.96);
		box-shadow: inset 28px 0 36px -10px rgba(0, 0, 0, 0.4), -28px 18px 45px -5px rgba(0, 0, 0, 0.5);
	}
	100% {
		transform: rotateY(-90deg) skewY(0deg) scale(0.95);
		box-shadow: -35px 20px 50px -5px rgba(0, 0, 0, 0.5);
	}
}

@keyframes pm-flip-turn-next-in {
	0% {
		transform: rotateY(90deg) skewY(0deg) scale(0.95);
		box-shadow: 35px 20px 50px -5px rgba(0, 0, 0, 0.5);
	}
	30% {
		transform: rotateY(68deg) skewY(5deg) scale(0.96);
		box-shadow: inset -28px 0 36px -10px rgba(0, 0, 0, 0.4), 28px 18px 45px -5px rgba(0, 0, 0, 0.5);
	}
	65% {
		transform: rotateY(32deg) skewY(4.5deg) scale(0.98);
		box-shadow: inset -20px 0 28px -10px rgba(0, 0, 0, 0.3), 18px 12px 35px -5px rgba(0, 0, 0, 0.45);
	}
	100% {
		transform: rotateY(0deg) skewY(0deg);
		box-shadow: inset -15px 0 25px -10px rgba(0, 0, 0, 0.2), 0 10px 30px -5px rgba(0, 0, 0, 0.4);
	}
}

@keyframes pm-flip-turn-prev-out {
	0% {
		transform: rotateY(0deg) skewY(0deg);
		box-shadow: inset -15px 0 25px -10px rgba(0, 0, 0, 0.2), 0 10px 30px -5px rgba(0, 0, 0, 0.4);
	}
	35% {
		transform: rotateY(32deg) skewY(4.5deg) scale(0.98);
		box-shadow: inset -20px 0 28px -10px rgba(0, 0, 0, 0.3), 18px 12px 35px -5px rgba(0, 0, 0, 0.45);
	}
	70% {
		transform: rotateY(68deg) skewY(5deg) scale(0.96);
		box-shadow: inset -28px 0 36px -10px rgba(0, 0, 0, 0.4), 28px 18px 45px -5px rgba(0, 0, 0, 0.5);
	}
	100% {
		transform: rotateY(90deg) skewY(0deg) scale(0.95);
		box-shadow: 35px 20px 50px -5px rgba(0, 0, 0, 0.5);
	}
}

@keyframes pm-flip-turn-prev-in {
	0% {
		transform: rotateY(-90deg) skewY(0deg) scale(0.95);
		box-shadow: -35px 20px 50px -5px rgba(0, 0, 0, 0.5);
	}
	30% {
		transform: rotateY(-68deg) skewY(-5deg) scale(0.96);
		box-shadow: inset 28px 0 36px -10px rgba(0, 0, 0, 0.4), -28px 18px 45px -5px rgba(0, 0, 0, 0.5);
	}
	65% {
		transform: rotateY(-32deg) skewY(-4.5deg) scale(0.98);
		box-shadow: inset 20px 0 28px -10px rgba(0, 0, 0, 0.3), -18px 12px 35px -5px rgba(0, 0, 0, 0.45);
	}
	100% {
		transform: rotateY(0deg) skewY(0deg);
		box-shadow: inset 15px 0 25px -10px rgba(0, 0, 0, 0.2), 0 10px 30px -5px rgba(0, 0, 0, 0.4);
	}
}

.stf__parent {
	position: relative !important;
	display: block !important;
	box-sizing: border-box !important;
	transform: translateZ(0) !important;
	touch-action: pan-y !important;
	margin: 0 auto !important;
	overflow: visible !important;
}

/* page-flip moves pages into .stf__block and positions them absolutely.
   Do not reapply the DOM-fallback grid/display rules to that host. */
:is(.printedjs_pages, .pagedjs_pages).stf__parent {
	display: block !important;
	grid-template-columns: none !important;
	width: auto !important;
	max-width: none !important;
	padding: 0 !important;
	perspective: none !important;
}

:is(.printedjs_pages, .pagedjs_pages).stf__parent > .stf__wrapper,
:is(.printedjs_pages, .pagedjs_pages).stf__parent .stf__block {
	display: block !important;
	width: 100% !important;
	margin: 0 !important;
	padding: 0 !important;
}

:is(.printedjs_pages, .pagedjs_pages).stf__parent .stf__item {
	margin: 0 !important;
	flex-shrink: unset !important;
	cursor: default !important;
	transition: none !important;
	will-change: auto !important;
	overflow: hidden !important;
}

:is(.printedjs_pages, .pagedjs_pages).stf__parent .stf__item[data-flip-clone="true"] {
	counter-increment: none !important;
}

.printedjs_margin-content[data-folio-frozen="true"]::after,
.pagedjs_margin-content[data-folio-frozen="true"]::after {
	content: none !important;
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

@media screen {
	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) {
		display: grid !important;
		grid-template-columns: repeat(2, max-content) !important;
		justify-content: center !important;
		align-items: center !important;
		perspective: 2500px !important;
		transform-style: preserve-3d !important;
		width: max-content !important;
		max-width: none !important;
		margin: 0 auto !important;
		padding: 32px 16px !important;
		box-sizing: border-box !important;
		user-select: none !important;
		touch-action: pan-y !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) > :is(.printedjs_page, .pagedjs_page) {
		grid-row: 1 !important;
		position: relative !important;
		display: block !important;
		margin: 0 !important;
		box-sizing: border-box !important;
		border-radius: 2px !important;
		cursor: pointer !important;
		flex-shrink: 0 !important;
		backface-visibility: hidden !important;
		will-change: transform, box-shadow;
		transition: transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.22s ease !important;
	}

	.pm-book-spacer {
		grid-row: 1 !important;
		visibility: hidden !important;
		pointer-events: none !important;
		flex-shrink: 0 !important;
	}

	.pm-book-spacer[data-flipbook-side="left"] {
		grid-column: 1 !important;
	}

	.pm-book-spacer[data-flipbook-side="right"] {
		grid-column: 2 !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) > :is(.printedjs_page, .pagedjs_page)[data-flipbook-side="left"] {
		grid-column: 1 !important;
		box-shadow: inset -15px 0 25px -10px rgba(0, 0, 0, 0.18), 0 10px 30px -5px rgba(0, 0, 0, 0.35) !important;
		transform-origin: right center !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) > :is(.printedjs_page, .pagedjs_page)[data-flipbook-side="right"] {
		grid-column: 2 !important;
		box-shadow: inset 15px 0 25px -10px rgba(0, 0, 0, 0.18), 0 10px 30px -5px rgba(0, 0, 0, 0.35) !important;
		transform-origin: left center !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) > :is(.printedjs_page, .pagedjs_page).pm-flip-turn-next-out {
		animation: pm-flip-turn-next-out 0.22s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
		transform-origin: left center !important;
		z-index: 20 !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) > :is(.printedjs_page, .pagedjs_page).pm-flip-turn-next-in {
		animation: pm-flip-turn-next-in 0.22s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
		transform-origin: right center !important;
		z-index: 20 !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) > :is(.printedjs_page, .pagedjs_page).pm-flip-turn-prev-out {
		animation: pm-flip-turn-prev-out 0.22s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
		transform-origin: right center !important;
		z-index: 20 !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) > :is(.printedjs_page, .pagedjs_page).pm-flip-turn-prev-in {
		animation: pm-flip-turn-prev-in 0.22s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
		transform-origin: left center !important;
		z-index: 20 !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) > :is(.printedjs_page, .pagedjs_page)[data-flipbook-hidden="true"] {
		display: none !important;
	}

	@media (max-width: 768px) {
		:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) {
			grid-template-columns: 1fr !important;
			padding: 16px 8px !important;
		}

		:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]):not(.stf__parent) > :is(.printedjs_page, .pagedjs_page) {
			grid-column: 1 !important;
			transform-origin: center center !important;
			box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35) !important;
		}

		.pm-book-spacer {
			display: none !important;
		}
	}
}

@media print {
	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]) {
		display: block !important;
		perspective: none !important;
		transform: none !important;
		width: auto !important;
		padding: 0 !important;
		margin: 0 !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]) > :is(.printedjs_page, .pagedjs_page) {
		display: block !important;
		box-shadow: none !important;
		border-radius: 0 !important;
		margin: 0 !important;
		page-break-after: always !important;
		break-after: page !important;
	}

	:is(.printedjs_pages, .pagedjs_pages):is([data-view-mode="flipbook"], [data-view-mode="book"]) > :is(.printedjs_page, .pagedjs_page):last-child {
		page-break-after: avoid !important;
		break-after: avoid !important;
	}

	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="flipbook"] > :is(.printedjs_page, .pagedjs_page)[data-flipbook-hidden="true"] {
		display: block !important;
	}
}
`;

	return {
		name: "flip-book-view",
		transformStyles(css: string): string {
			return `${css}\n\n${flipBookCss}`;
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata["document"] as Document | undefined;
			if (!doc) return;

			const pagesContainer = doc.querySelector<HTMLElement>(
				".printedjs_pages, .pagedjs_pages",
			);
			if (pagesContainer) {
				const controller = new DomFlipBookController(pagesContainer, options);
				context.metadata["flipBook"] = controller;
				(pagesContainer as unknown as Record<string, unknown>).__printedjs_flipbook =
					controller;
			}
		},
	};
}
