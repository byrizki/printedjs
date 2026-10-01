export { singlePageViewPlugin } from "./single-page/plugin.js";
export { spreadPageViewPlugin } from "./spread-page/plugin.js";
export { flipBookViewPlugin } from "./flip-book/plugin.js";
export { DomFlipBookController } from "./flip-book/controller.js";
export { playPageTurnSound } from "./flip-book/sound.js";
export { pageViewsPlugin, DomPageViewsController } from "./manager.js";
export type {
	FlipBookController,
	FlipBookViewOptions,
	PageViewsController,
	PageViewsPluginOptions,
	SinglePageViewOptions,
	SpreadPageViewOptions,
	ViewMode,
} from "./types.js";

import { singlePageViewPlugin } from "./single-page/plugin.js";
import { spreadPageViewPlugin } from "./spread-page/plugin.js";
import { flipBookViewPlugin } from "./flip-book/plugin.js";
import { DomFlipBookController } from "./flip-book/controller.js";
import { playPageTurnSound } from "./flip-book/sound.js";
import { pageViewsPlugin, DomPageViewsController } from "./manager.js";

if (typeof window !== "undefined") {
	const win = window as unknown as Record<string, unknown>;
	win.PrintedjsViews = {
		singlePageViewPlugin,
		spreadPageViewPlugin,
		flipBookViewPlugin,
		DomFlipBookController,
		playPageTurnSound,
		pageViewsPlugin,
		DomPageViewsController,
	};
}
