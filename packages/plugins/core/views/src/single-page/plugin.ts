import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";
import type { SinglePageViewOptions } from "../types.js";

export function singlePageViewPlugin(
	options: SinglePageViewOptions = {},
): PrintedjsPlugin {
	const gapValue = Number.isFinite(options.gap)
		? `${options.gap}px`
		: (options.gap ?? "32px");

	const showShadow = options.shadow ?? true;

	const singlePageCss = `
@media screen {
	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="single"] {
		display: flex !important;
		flex-direction: column !important;
		align-items: center !important;
		gap: ${gapValue} !important;
		width: max-content !important;
		max-width: none !important;
		margin: 0 auto !important;
		padding: 24px 0 !important;
		box-sizing: border-box !important;
	}

	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="single"] > :is(.printedjs_page, .pagedjs_page) {
		margin-left: auto !important;
		margin-right: auto !important;
		margin-bottom: 0 !important;
		background: #ffffff;
		${
			showShadow
				? "box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.2) !important;"
				: ""
		}
		border-radius: 2px !important;
		display: block !important;
		transition: transform 0.15s ease, box-shadow 0.15s ease !important;
	}
}

@media print {
	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="single"] {
		display: block !important;
		gap: 0 !important;
		padding: 0 !important;
		margin: 0 !important;
	}

	:is(.printedjs_pages, .pagedjs_pages)[data-view-mode="single"] > :is(.printedjs_page, .pagedjs_page) {
		box-shadow: none !important;
		border-radius: 0 !important;
		margin: 0 !important;
	}
}
`;

	return {
		name: "single-page-view",
		transformStyles(css: string): string {
			return `${css}\n\n${singlePageCss}`;
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata.document;

			if (!doc) return;

			const pagesContainer = doc.querySelector<HTMLElement>(
				".printedjs_pages, .pagedjs_pages",
			);

			if (pagesContainer) {
				pagesContainer.setAttribute("data-view-mode", "single");
			}
		},
	};
}
