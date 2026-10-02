import type { PluginContext, PrintedjsPlugin } from "@printedjs/core";
import { singlePageViewPlugin } from "./single-page/plugin.js";
import { spreadPageViewPlugin } from "./spread-page/plugin.js";
import type {
	PageViewsController,
	PageViewsPluginOptions,
	ViewMode,
	ViewModeAdapter,
} from "./types.js";

export class DomPageViewsController implements PageViewsController {
	private readonly container: HTMLElement;
	private readonly options: PageViewsPluginOptions;
	private readonly adapters = new Map<string, ViewModeAdapter>();
	private _currentMode: ViewMode;
	private activeAdapter: ViewModeAdapter | null = null;
	private activeController: unknown = null;

	constructor(container: HTMLElement, options: PageViewsPluginOptions = {}) {
		this.container = container;
		this.options = options;
		this._currentMode = options.initialMode ?? "single";

		if (options.adapters) {
			for (const adapter of options.adapters) {
				this.registerAdapter(adapter);
			}
		}

		this.applyMode(this._currentMode);
	}

	get currentMode(): ViewMode {
		return this._currentMode;
	}

	registerAdapter(adapter: ViewModeAdapter): void {
		const modes = Array.isArray(adapter.mode) ? adapter.mode : [adapter.mode];
		for (const mode of modes) {
			this.adapters.set(mode, adapter);
		}
	}

	setMode(mode: ViewMode, overrideOptions?: unknown): void {
		if (this._currentMode === mode) return;
		this._currentMode = mode;
		this.applyMode(mode, overrideOptions);
	}

	getAdapterController<T = unknown>(mode?: string): T | null {
		const targetMode = mode ?? this._currentMode;
		const adapter = this.adapters.get(targetMode);
		if (adapter && adapter === this.activeAdapter) {
			return (this.activeController as T) ?? null;
		}
		return null;
	}

	getFlipBook(): unknown {
		return (
			((this.container as unknown as Record<string, unknown>).__printedjs_flipbook as unknown) ??
			this.getAdapterController("flipbook") ??
			this.getAdapterController("book")
		);
	}

	private applyMode(mode: ViewMode, overrideOptions?: unknown): void {
		if (this.activeAdapter) {
			this.activeAdapter.detach?.(this.container);
			this.activeAdapter = null;
			this.activeController = null;
		}

		this.container.setAttribute("data-view-mode", mode);

		const adapter = this.adapters.get(mode);
		if (adapter) {
			this.activeAdapter = adapter;
			this.activeController = adapter.attach(this.container, overrideOptions);
		}
	}

	destroy(): void {
		if (this.activeAdapter) {
			this.activeAdapter.detach?.(this.container);
			this.activeAdapter = null;
			this.activeController = null;
		}
		delete (this.container as unknown as Record<string, unknown>).__printedjs_page_views;
		this.container.removeAttribute("data-view-mode");
	}
}

export function pageViewsPlugin(options: PageViewsPluginOptions = {}): PrintedjsPlugin {
	const singlePlugin = singlePageViewPlugin(options.single);
	const spreadPlugin = spreadPageViewPlugin(options.spread);
	const adapters = options.adapters ?? [];

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
			for (const adapter of adapters) {
				if (adapter.transformStyles) {
					result = adapter.transformStyles(result, context);
				}
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
