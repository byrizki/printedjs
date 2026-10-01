import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";
import { singlePageViewPlugin } from "./single-page/plugin.js";
import { spreadPageViewPlugin } from "./spread-page/plugin.js";
import { flipBookViewPlugin } from "./flip-book/plugin.js";
import { DomFlipBookController } from "./flip-book/controller.js";
import type {
	FlipBookController,
	PageViewsController,
	PageViewsPluginOptions,
	ViewMode,
} from "./types.js";

export class DomPageViewsController implements PageViewsController {
	private readonly container: HTMLElement;
	private readonly options: PageViewsPluginOptions;
	private _currentMode: ViewMode;
	private flipBookController: DomFlipBookController | null = null;

	constructor(container: HTMLElement, options: PageViewsPluginOptions = {}) {
		this.container = container;
		this.options = options;
		this._currentMode = options.initialMode ?? "single";
		this.applyMode(this._currentMode);
	}

	get currentMode(): ViewMode {
		return this._currentMode;
	}

	setMode(mode: ViewMode): void {
		if (this._currentMode === mode) return;
		this._currentMode = mode;
		this.applyMode(mode);
	}

	getFlipBook(): FlipBookController | null {
		return this.flipBookController;
	}

	private applyMode(mode: ViewMode): void {
		if (this.flipBookController) {
			this.flipBookController.destroy();
			this.flipBookController = null;
		}

		this.container.setAttribute("data-view-mode", mode);

		if (mode === "flipbook" || mode === "book") {
			this.flipBookController = new DomFlipBookController(
				this.container,
				this.options.flipbook ?? {},
			);
			(this.container as unknown as Record<string, unknown>).__printedjs_flipbook =
				this.flipBookController;
		} else {
			delete (this.container as unknown as Record<string, unknown>).__printedjs_flipbook;
		}
	}

	destroy(): void {
		if (this.flipBookController) {
			this.flipBookController.destroy();
			this.flipBookController = null;
		}
		delete (this.container as unknown as Record<string, unknown>).__printedjs_flipbook;
		this.container.removeAttribute("data-view-mode");
	}
}

export function pageViewsPlugin(options: PageViewsPluginOptions = {}): PrintedjsPlugin {
	const singlePlugin = singlePageViewPlugin(options.single);
	const spreadPlugin = spreadPageViewPlugin(options.spread);
	const flipbookPlugin = flipBookViewPlugin(options.flipbook);

	return {
		name: "page-views",
		transformStyles(css: string, context: PluginContext): string {
			let result = css;
			if (singlePlugin.transformStyles) {
				result = singlePlugin.transformStyles(result, context) as string;
			}
			if (spreadPlugin.transformStyles) {
				result = spreadPlugin.transformStyles(result, context) as string;
			}
			if (flipbookPlugin.transformStyles) {
				result = flipbookPlugin.transformStyles(result, context) as string;
			}
			return result;
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata["document"] as Document | undefined;
			if (!doc) return;

			const pagesContainer = doc.querySelector<HTMLElement>(
				".printedjs_pages, .pagedjs_pages",
			);
			if (pagesContainer) {
				const controller = new DomPageViewsController(pagesContainer, options);
				context.metadata["pageViews"] = controller;
				(pagesContainer as unknown as Record<string, unknown>).__printedjs_page_views =
					controller;
			}
		},
	};
}
