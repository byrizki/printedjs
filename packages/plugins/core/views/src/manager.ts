import type { PluginContext, PrintedjsPlugin } from "@printedjs/core";
import { singlePageViewPlugin } from "./single-page/plugin.js";
import { spreadPageViewPlugin } from "./spread-page/plugin.js";
import type {
	ActivePageChangeDetail,
	PageFlipInstance,
	PageViewsController,
	PageViewsModeOptions,
	PageViewsPluginOptions,
	ViewMode,
	ViewModeAdapter,
} from "./types.js";

interface PageViewsHostElement extends HTMLElement {
	__printedjs_page_views?: DomPageViewsController | undefined;
	__printedjs_flipbook?: PageFlipInstance | undefined;
}

interface ActiveViewController {
	destroy?(): void;
}

export class DomPageViewsController implements PageViewsController {
	private readonly container: HTMLElement;
	private readonly options: PageViewsPluginOptions;
	private readonly adapters = new Map<string, ViewModeAdapter>();
	private _currentMode: ViewMode;
	private _currentPage: number = 1;
	private _activePages: readonly number[] = [1];
	private activeAdapter: ViewModeAdapter | null = null;
	private activeController: ActiveViewController | null = null;
	private readonly onPageChange = (e: Event): void => {
		// SAFETY: custom page change events dispatch ActivePageChangeDetail in detail property
		const detail = (e as CustomEvent<ActivePageChangeDetail>).detail;

		if (detail?.currentPage) {
			this._currentPage = detail.currentPage;

			if (detail.visiblePages && detail.visiblePages.length > 0) {
				this._activePages = [...detail.visiblePages];
			} else {
				this._activePages = [detail.currentPage];
			}
		}
	};

	constructor(container: HTMLElement, options: PageViewsPluginOptions = {}) {
		this.container = container;
		this.options = options;
		this._currentMode = options.initialMode ?? "single";

		this.container.addEventListener("page:change", this.onPageChange);
		this.container.addEventListener("flipbook:change", this.onPageChange);

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

	get currentPage(): number {
		return this._currentPage;
	}

	get activePages(): readonly number[] {
		return this._activePages;
	}

	emitPageChange(detail: ActivePageChangeDetail): void {
		this._currentPage = detail.currentPage;
		this._activePages =
			detail.visiblePages && detail.visiblePages.length > 0
				? [...detail.visiblePages]
				: [detail.currentPage];

		const eventInit = { detail, bubbles: true, composed: true };
		this.container.dispatchEvent(new CustomEvent("page:change", eventInit));
		this.container.dispatchEvent(new CustomEvent("views:page-change", eventInit));
	}

	registerAdapter(adapter: ViewModeAdapter): void {
		const modes = Array.isArray(adapter.mode) ? adapter.mode : [adapter.mode];

		for (const mode of modes) {
			this.adapters.set(mode, adapter);
		}
	}

	setMode(mode: ViewMode, overrideOptions?: PageViewsModeOptions): void {
		if (this._currentMode === mode) return;
		this._currentMode = mode;
		this.applyMode(mode, overrideOptions);
	}

	getAdapterController<T = unknown>(mode?: string): T | null {
		const targetMode = mode ?? this._currentMode;
		const adapter = this.adapters.get(targetMode);

		if (adapter && adapter === this.activeAdapter) {
			// SAFETY: controller matches generic controller interface requested by caller
			return (this.activeController as T) ?? null;
		}

		return null;
	}

	getFlipBook(): PageFlipInstance | null {
		// SAFETY: container DOM node may hold an attached flipbook controller instance
		const host = this.container as PageViewsHostElement;

		return (
			host.__printedjs_flipbook ??
			this.getAdapterController<PageFlipInstance>("flipbook") ??
			this.getAdapterController<PageFlipInstance>("book")
		);
	}

	private applyMode(mode: ViewMode, overrideOptions?: PageViewsModeOptions): void {
		if (this.activeAdapter) {
			this.activeAdapter.detach?.(this.container);
			this.activeAdapter = null;
			this.activeController = null;
		}

		this.container.setAttribute("data-view-mode", mode);

		const adapter = this.adapters.get(mode);

		if (adapter) {
			this.activeAdapter = adapter;
			// SAFETY: adapter attach optionally returns controller object with destroy hook
			this.activeController =
				(adapter.attach(
					this.container,
					overrideOptions,
				) as ActiveViewController | null) ?? null;
		}
	}

	destroy(): void {
		this.container.removeEventListener("page:change", this.onPageChange);
		this.container.removeEventListener("flipbook:change", this.onPageChange);

		if (this.activeAdapter) {
			this.activeAdapter.detach?.(this.container);
			this.activeAdapter = null;
			this.activeController = null;
		}

		// SAFETY: removing controller reference from container DOM node
		const host = this.container as PageViewsHostElement;
		delete host.__printedjs_page_views;
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
				// SAFETY: singlePageViewPlugin transformStyles is synchronous
				result = singlePlugin.transformStyles(result, context) as string;
			}

			if (spreadPlugin.transformStyles) {
				// SAFETY: spreadPageViewPlugin transformStyles is synchronous
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
			const doc = context.metadata.document;

			if (!doc) return;

			const pagesContainer = doc.querySelector<HTMLElement>(
				".printedjs_pages, .pagedjs_pages",
			);

			if (pagesContainer) {
				const controller = new DomPageViewsController(pagesContainer, options);
				context.metadata.pageViews = controller;
				// SAFETY: attaching controller reference to container DOM node
				const host = pagesContainer as PageViewsHostElement;
				host.__printedjs_page_views = controller;
			}
		},
	};
}
