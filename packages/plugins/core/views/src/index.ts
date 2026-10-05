export { singlePageViewPlugin } from "./single-page/plugin.js";

export { spreadPageViewPlugin } from "./spread-page/plugin.js";

export { pageViewsPlugin, DomPageViewsController } from "./manager.js";

export type {
	ActivePageChangeDetail,
	PageViewsController,
	PageViewsPluginOptions,
	SinglePageViewOptions,
	SpreadPageViewOptions,
	ViewMode,
	ViewModeAdapter,
} from "./types.js";

import { singlePageViewPlugin } from "./single-page/plugin.js";
import { spreadPageViewPlugin } from "./spread-page/plugin.js";
import { pageViewsPlugin, DomPageViewsController } from "./manager.js";

interface WindowWithPrintedjsViews {
	PrintedjsViews?: unknown;
}

if (typeof window !== "undefined") {
	// SAFETY: Window object augmented with views plugin exports
	const win = window as Window & WindowWithPrintedjsViews;
	win.PrintedjsViews = {
		singlePageViewPlugin,
		spreadPageViewPlugin,
		pageViewsPlugin,
		DomPageViewsController,
	};
}
