import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";
import type { SpreadPageViewOptions } from "../types.js";

export function spreadPageViewPlugin(
	options: SpreadPageViewOptions = {},
): PrintedjsPlugin {
	const gutterValue = Number.isFinite(options.gutter)
		? `${options.gutter}px`
		: (options.gutter ?? "24px");

	const defaultCols = options.columns ?? 2;
	const coverPage = options.coverPage ?? false;
	const spineShadow = options.spineShadow ?? false;

	const spreadPageCss = `
@media screen {
	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="spread"] {
		display: grid !important;
		grid-template-columns: repeat(${defaultCols}, max-content) !important;
		grid-template-columns: repeat(var(--pm-grid-cols, ${defaultCols}), max-content) !important;
		grid-auto-flow: row !important;
		justify-content: center !important;
		column-gap: ${gutterValue} !important;
		row-gap: 32px !important;
		width: max-content !important;
		max-width: none !important;
		margin: 0 auto !important;
		padding: 24px 16px !important;
		box-sizing: border-box !important;
	}

	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="spread"][data-grid-rows]:not([data-grid-rows="auto"]) {
		grid-template-rows: repeat(var(--pm-grid-rows, 2), max-content) !important;
	}

	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="spread"] > :is(.printedjs_page, .pagedjs_page) {
		grid-column: auto !important;
		margin-bottom: 0 !important;
		margin-left: 0 !important;
		margin-right: 0 !important;
		display: block !important;
		border-radius: 2px !important;
		background: #ffffff;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35) !important;
		flex-shrink: 0 !important;
		transition: transform 0.15s ease, box-shadow 0.15s ease !important;
	}

	${
		coverPage
			? `
	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="spread"] > :is(.printedjs_page, .pagedjs_page):first-child {
		grid-column: 2 !important;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35) !important;
	}
	`
			: ""
	}

	${
		spineShadow
			? `
	/* Verso (Left facing page) spine shadow on right edge */
	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="spread"] > :is(.printedjs_page, .pagedjs_page):nth-child(even) {
		box-shadow: inset -15px 0 25px -10px rgba(0, 0, 0, 0.18), 0 10px 25px -5px rgba(0, 0, 0, 0.35) !important;
	}

	/* Recto (Right facing page) spine shadow on left edge */
	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="spread"] > :is(.printedjs_page, .pagedjs_page):nth-child(odd):not(:first-child) {
		box-shadow: inset 15px 0 25px -10px rgba(0, 0, 0, 0.18), 0 10px 25px -5px rgba(0, 0, 0, 0.35) !important;
	}
	`
			: ""
	}
}

@media print {
	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="spread"] {
		display: block !important;
		grid-template-columns: none !important;
		width: auto !important;
		padding: 0 !important;
		margin: 0 !important;
		column-gap: 0 !important;
		row-gap: 0 !important;
	}

	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="spread"] > :is(.printedjs_page, .pagedjs_page) {
		grid-column: auto !important;
		box-shadow: none !important;
		border-radius: 0 !important;
		margin: 0 !important;
		page-break-after: always !important;
		break-after: page !important;
	}

	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="spread"] > :is(.printedjs_page, .pagedjs_page):last-child {
		page-break-after: avoid !important;
		break-after: avoid !important;
	}
}
`;

	return {
		name: "spread-page-view",
		transformStyles(css: string): string {
			return `${css}\n\n${spreadPageCss}`;
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata.document;

			if (!doc) return;

			const pagesContainer = doc.querySelector<HTMLElement>(
				".printedjs_pages, .pagedjs_pages",
			);

			if (pagesContainer) {
				pagesContainer.setAttribute("data-view-mode", "spread");
			}
		},
	};
}
