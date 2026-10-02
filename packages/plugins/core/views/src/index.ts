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

if (typeof window !== "undefined") {
	const win = window as unknown as Record<string, unknown>;
	win.PrintedjsViews = {
		singlePageViewPlugin,
		spreadPageViewPlugin,
		pageViewsPlugin,
		DomPageViewsController,
	};
}
