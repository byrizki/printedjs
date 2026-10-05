import {
	createRenderer,
	type BrowserRenderer,
	type RenderResult,
} from "@printedjs/browser";
import type {
	PagedjsCompatibilityOptions,
	PrintedjsPlugin,
	StylesheetSource,
} from "@printedjs/core";
import { standardPreset } from "@printedjs/plugin-preset";
import {
	pageViewsPlugin,
	singlePageViewPlugin,
	spreadPageViewPlugin,
} from "@printedjs/plugin-views";

export type MinimalViewMode = "single" | "spread" | "none" | false;

export interface PolyfillOptions extends PagedjsCompatibilityOptions {
	readonly target?: HTMLElement | undefined;
	readonly isolation?: "root" | "iframe" | undefined;
	readonly plugins?: readonly PrintedjsPlugin[] | undefined;
	readonly auto?: boolean | undefined;
	readonly viewMode?: MinimalViewMode | undefined;
}

export interface PagedPageLayoutInfo {
	readonly number: number;
	readonly element: HTMLElement;
	readonly total: number;
	readonly pageCount: number;
	readonly totalPages: number;
}

export interface PagedBreakTokenInfo {
	readonly page?: number | undefined;
	readonly finished?: boolean | undefined;
}

export interface PagedChunkerInfo {
	readonly pages?: readonly HTMLElement[] | undefined;
}

export interface PagedHandlerInstance {
	beforeParsed?(content?: HTMLElement | Document | null): void | Promise<void>;
	afterParsed?(parsed?: HTMLElement | Document | null): void | Promise<void>;
	beforePageLayout?(
		page?: HTMLElement | null,
		index?: number,
		breakToken?: PagedBreakTokenInfo | null,
	): void | Promise<void>;
	afterPageLayout?(
		pageElement?: HTMLElement | null,
		page?: PagedPageLayoutInfo | null,
		breakToken?: PagedBreakTokenInfo | null,
		chunker?: PagedChunkerInfo | null,
	): void | Promise<void>;
	afterRendered?(pages?: readonly unknown[]): void | Promise<void>;
}

export type PagedHandler = PagedHandlerInstance | (new () => PagedHandlerInstance);

export class Handler implements PagedHandlerInstance {
	beforeParsed?(_content?: HTMLElement | Document | null): void | Promise<void>;
	afterParsed?(_parsed?: HTMLElement | Document | null): void | Promise<void>;
	beforePageLayout?(
		_page?: HTMLElement | null,
		_index?: number,
		_breakToken?: PagedBreakTokenInfo | null,
	): void | Promise<void>;
	afterPageLayout?(
		_pageElement?: HTMLElement | null,
		_page?: PagedPageLayoutInfo | null,
		_breakToken?: PagedBreakTokenInfo | null,
		_chunker?: PagedChunkerInfo | null,
	): void | Promise<void>;
	afterRendered?(_pages?: readonly unknown[]): void | Promise<void>;
}

export interface PagedFlowInfo {
	readonly pages: readonly unknown[];
	readonly total: number;
	readonly pageCount: number;
	readonly totalPages: number;
}

export interface PagedConfig {
	auto?: boolean | undefined;
	before?: (() => void | Promise<void>) | undefined;
	after?: ((flow: PagedFlowInfo) => void) | undefined;
	content?: string | HTMLElement | undefined;
	renderTo?: string | HTMLElement | undefined;
	stylesheets?: readonly string[] | undefined;
	pagedjsCompatible?: boolean | undefined;
	viewMode?: MinimalViewMode | undefined;
}

export interface WindowWithPrintedjsMinimal extends Window {
	__pagedRenderFinished?: boolean | undefined;
	__printedjsRenderFinished?: boolean | undefined;
	__pagedPageCount?: number | undefined;
	__printedjsOriginalContent?: string | undefined;
	PRINTEDJS_AUTO?: boolean | undefined;
	PagedConfig?: PagedConfig | undefined;
	PrintedjsConfig?:
		| {
				readonly pagedjsCompatible?: boolean | undefined;
				readonly viewMode?: MinimalViewMode | undefined;
		  }
		| undefined;
	Paged?: unknown;
	PagedPolyfill?: unknown;
	Printed?: unknown;
	PrintedJS?: unknown;
	Printedjs?: unknown;
	PrintedjsMinimal?: unknown;
	PrintedjsPolyfill?: unknown;
}

const registeredHandlers: PagedHandler[] = [];

export function registerHandlers(...handlers: PagedHandler[]): void {
	registeredHandlers.push(...handlers);
}

function isString(value: unknown): value is string {
	return Object.prototype.toString.call(value) === "[object String]";
}

function resolveViewPlugin(
	viewMode: MinimalViewMode | undefined,
	existingPlugins: readonly PrintedjsPlugin[],
): PrintedjsPlugin | null {
	if (viewMode === "none" || viewMode === false) {
		return null;
	}

	const hasViewPlugin = existingPlugins.some(
		(p) =>
			p.name === "single-page-view" ||
			p.name === "spread-page-view" ||
			p.name === "page-views",
	);

	if (hasViewPlugin) {
		return null;
	}

	if (viewMode === "spread") {
		return spreadPageViewPlugin();
	}

	return singlePageViewPlugin();
}

function createHandlersPlugin(handlers: readonly PagedHandler[]): PrintedjsPlugin {
	let instances: PagedHandlerInstance[] = [];

	return {
		name: "pagedjs-handlers-lifecycle",
		setup() {
			instances = handlers.map((h) => (h instanceof Function ? new h() : h));
		},
		async beforeLayout(context) {
			// SAFETY: contentRoot in plugin context metadata represents target root element
			const contentRoot = context.metadata["contentRoot"] as HTMLElement | undefined;

			for (const inst of instances) {
				if (inst.beforeParsed) {
					await inst.beforeParsed(contentRoot);
				}

				if (inst.afterParsed) {
					await inst.afterParsed(contentRoot);
				}
			}
		},
		async afterRender(context) {
			// SAFETY: document in plugin context metadata represents target Document
			const doc = context.metadata["document"] as Document | undefined;

			// SAFETY: pages in plugin context metadata represents rendered page results
			let pages: readonly unknown[] =
				(context.metadata["pages"] as readonly unknown[] | undefined) ?? [];

			if (pages.length === 0 && doc) {
				pages = Array.from(
					doc.querySelectorAll<HTMLElement>(".printedjs_page, .pagedjs_page"),
				);
			}

			const totalCount = pages.length || context.metadata.pageCount || 0;

			for (let i = 0; i < pages.length; i++) {
				const pageEl = pages[i]!;

				// SAFETY: pageEl is the rendered page HTMLElement
				const pageElement = pageEl as HTMLElement;

				const pageObj: PagedPageLayoutInfo = {
					number: i + 1,
					element: pageElement,
					total: totalCount,
					pageCount: totalCount,
					totalPages: totalCount,
				};

				for (const inst of instances) {
					if (inst.beforePageLayout) {
						await inst.beforePageLayout(pageElement, i);
					}

					if (inst.afterPageLayout) {
						await inst.afterPageLayout(pageElement, pageObj);
					}
				}
			}

			for (const inst of instances) {
				if (inst.afterRendered) {
					await inst.afterRendered(pages);
				}
			}
		},
	};
}

let activeRenderer: BrowserRenderer | null = null;

let activeRenderPromise: Promise<RenderResult> | null = null;

export async function polyfill(options?: PolyfillOptions): Promise<RenderResult> {
	if (typeof window === "undefined" || typeof document === "undefined") {
		throw new Error("Printedjs minimal bundle requires a browser environment.");
	}

	if (activeRenderPromise) {
		return activeRenderPromise;
	}

	// SAFETY: Window augmented with Printedjs minimal globals
	const win = window as WindowWithPrintedjsMinimal;

	if (!win.__printedjsOriginalContent) {
		win.__printedjsOriginalContent = document.body.innerHTML;
	}

	const pagedConfig = win.PagedConfig;

	if (pagedConfig?.before) {
		await pagedConfig.before();
	}

	let contentHtml = win.__printedjsOriginalContent;

	if (pagedConfig?.content instanceof HTMLElement) {
		contentHtml = pagedConfig.content.innerHTML;
	} else if (pagedConfig?.content) {
		contentHtml = String(pagedConfig.content);
	}

	if (activeRenderer) {
		activeRenderer.destroy();
		activeRenderer = null;
	}

	let target = options?.target;

	if (!target && pagedConfig?.renderTo) {
		if (pagedConfig.renderTo instanceof HTMLElement) {
			target = pagedConfig.renderTo;
		} else {
			target = document.querySelector<HTMLElement>(pagedConfig.renderTo) ?? undefined;
		}
	}

	if (!target) {
		target = document.body;
	}

	const isolation = options?.isolation ?? "root";
	const basePlugins = options?.plugins ?? standardPreset();

	const scriptViewAttr =
		typeof document !== "undefined"
			? (document.currentScript?.getAttribute("data-printedjs-view") ??
				document.currentScript?.getAttribute("data-view-mode"))
			: null;

	const resolvedScriptViewMode: MinimalViewMode | undefined =
		scriptViewAttr === "none" || scriptViewAttr === "false"
			? "none"
			: scriptViewAttr === "spread"
				? "spread"
				: scriptViewAttr === "single"
					? "single"
					: undefined;

	const viewMode: MinimalViewMode | undefined =
		options?.viewMode ??
		win.PrintedjsConfig?.viewMode ??
		win.PagedConfig?.viewMode ??
		resolvedScriptViewMode;

	const viewPlugin = resolveViewPlugin(viewMode, basePlugins);
	const pluginsWithViews = viewPlugin ? [...basePlugins, viewPlugin] : basePlugins;

	const plugins =
		registeredHandlers.length > 0
			? [...pluginsWithViews, createHandlersPlugin(registeredHandlers)]
			: pluginsWithViews;

	const compatAttr =
		typeof document !== "undefined"
			? (document.currentScript?.getAttribute("data-pagedjs-compatible") ??
				document.currentScript?.getAttribute("data-printedjs-pagedjs-compatible"))
			: null;

	const resolvedCompatAttr =
		compatAttr === "false" || compatAttr === "0"
			? false
			: compatAttr === "true" || compatAttr === "1"
				? true
				: undefined;

	const pagedjsCompatible: boolean =
		options?.pagedjsCompatible ??
		win.PrintedjsConfig?.pagedjsCompatible ??
		win.PagedConfig?.pagedjsCompatible ??
		resolvedCompatAttr ??
		false;

	// Extract inline styles and external stylesheets, removing original elements to prevent duplicate rules
	const styleElements = document.querySelectorAll(
		"style:not([data-printedjs-styles]):not([data-printedjs-ignore]):not([data-pagedjs-ignore]), link[rel='stylesheet']:not([data-printedjs-ignore]):not([data-pagedjs-ignore])",
	);

	const styles: string[] = [];

	styleElements.forEach((el) => {
		if (el.tagName.toLowerCase() === "style") {
			styles.push(el.textContent ?? "");
			el.remove();
		} else if (el.tagName.toLowerCase() === "link") {
			const href = el.getAttribute("href");

			if (href) {
				styles.push(`@import url("${href}");`);
			}

			el.remove();
		}
	});

	if (pagedConfig?.stylesheets && Array.isArray(pagedConfig.stylesheets)) {
		for (const sheet of pagedConfig.stylesheets) {
			styles.push(`@import url("${sheet}");`);
		}
	}

	if (target === document.body) {
		document.body.replaceChildren();
	}

	activeRenderer = createRenderer({
		target,
		isolation,
		plugins,
		pagedjsCompatible,
	});

	activeRenderPromise = (async () => {
		try {
			const effectiveStyles = styles.length > 0 ? styles : [""];

			const result = await activeRenderer!.render({
				content: {
					html: contentHtml,
				},
				stylesheets: effectiveStyles.map((content) => ({
					type: "inline" as const,
					content,
				})),
				pagedjsCompatible,
			});

			win.__pagedRenderFinished = true;
			win.__printedjsRenderFinished = true;
			win.__pagedPageCount = result.pages.length;

			const pageCount = result.pages.length;

			const eventDetail = {
				result,
				pages: result.pages,
				pageCount,
				totalPages: pageCount,
				total: pageCount,
				flow: {
					pages: result.pages,
					pageCount,
					totalPages: pageCount,
					total: pageCount,
				},
			};

			window.dispatchEvent(
				new CustomEvent("printedjs:rendered", { detail: eventDetail }),
			);
			window.dispatchEvent(new CustomEvent("pagedjs:rendered", { detail: eventDetail }));

			// Notify PagedConfig.after if defined
			if (pagedConfig?.after) {
				try {
					pagedConfig.after({
						pages: result.pages,
						total: pageCount,
						pageCount,
						totalPages: pageCount,
					});
				} catch (err) {
					console.error("Error in PagedConfig.after:", err);
				}
			}

			return result;
		} finally {
			activeRenderPromise = null;
		}
	})();

	return activeRenderPromise;
}

export class Previewer {
	private readonly options: PolyfillOptions;
	private activeRenderer: BrowserRenderer | null = null;

	constructor(options: PolyfillOptions = {}) {
		this.options = options;
	}

	registerHandlers(...handlers: PagedHandler[]): void {
		registerHandlers(...handlers);
	}

	async preview(
		content?: string | HTMLElement,
		stylesheets?: string[] | { type: "inline" | "url"; content?: string; url?: string }[],
		target?: HTMLElement,
	): Promise<RenderResult> {
		if (typeof window === "undefined" || typeof document === "undefined") {
			throw new Error("Previewer requires a browser environment.");
		}

		const container = target ?? document.body;
		const basePlugins = this.options.plugins ?? standardPreset();
		const viewPlugin = resolveViewPlugin(this.options.viewMode, basePlugins);
		const pluginsWithViews = viewPlugin ? [...basePlugins, viewPlugin] : basePlugins;

		const plugins =
			registeredHandlers.length > 0
				? [...pluginsWithViews, createHandlersPlugin(registeredHandlers)]
				: pluginsWithViews;

		const renderer = createRenderer({
			target: container,
			isolation: this.options.isolation ?? "root",
			plugins,
			pagedjsCompatible: this.options.pagedjsCompatible ?? false,
		});

		let html = "";
		let element: HTMLElement | undefined;

		if (content instanceof HTMLElement) {
			element = content;
		} else if (content) {
			html = content;
		} else {
			html = document.body.innerHTML;
		}

		const rawStyles = stylesheets && stylesheets.length > 0 ? stylesheets : [""];

		const normalizedStyles: StylesheetSource[] = rawStyles.map((s) => {
			if (isString(s)) {
				return { type: "inline" as const, content: s };
			}

			if (s.type === "url" && s.url) {
				return { type: "url" as const, url: s.url };
			}

			return { type: "inline" as const, content: s.content ?? "" };
		});

		try {
			const result = await renderer.render({
				content: element ? { node: element } : { html },
				stylesheets: normalizedStyles,
				pagedjsCompatible: this.options.pagedjsCompatible ?? false,
			});

			this.activeRenderer = renderer;

			// SAFETY: Window augmented with Printedjs minimal globals
			const win = window as WindowWithPrintedjsMinimal;

			win.__pagedRenderFinished = true;
			win.__printedjsRenderFinished = true;
			win.__pagedPageCount = result.pages.length;

			const pageCount = result.pages.length;

			const eventDetail = {
				result,
				pages: result.pages,
				pageCount,
				totalPages: pageCount,
				total: pageCount,
				flow: {
					pages: result.pages,
					pageCount,
					totalPages: pageCount,
					total: pageCount,
				},
			};

			window.dispatchEvent(
				new CustomEvent("printedjs:rendered", { detail: eventDetail }),
			);
			window.dispatchEvent(new CustomEvent("pagedjs:rendered", { detail: eventDetail }));

			return result;
		} catch (error) {
			renderer.destroy();
			this.activeRenderer = null;
			throw error;
		}
	}

	destroy(): void {
		if (this.activeRenderer) {
			this.activeRenderer.destroy();
			this.activeRenderer = null;
		}
	}
}

// Auto-run if running in browser script context
function autoInit(): void {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return;
	}

	const scriptTag = document.currentScript;
	const autoAttr = scriptTag?.getAttribute("data-printedjs-auto");

	if (autoAttr === "false") {
		return;
	}

	// SAFETY: Window augmented with Printedjs minimal globals
	const win = window as WindowWithPrintedjsMinimal;

	if (win.PRINTEDJS_AUTO === false || win.PagedConfig?.auto === false) {
		return;
	}

	const run = () => {
		const targetSelector = scriptTag?.getAttribute("data-printedjs-target");

		const target = targetSelector
			? (document.querySelector<HTMLElement>(targetSelector) ?? undefined)
			: undefined;

		const isolation =
			scriptTag?.getAttribute("data-printedjs-isolation") === "iframe"
				? "iframe"
				: "root";

		const compatAttr =
			scriptTag?.getAttribute("data-pagedjs-compatible") ??
			scriptTag?.getAttribute("data-printedjs-pagedjs-compatible");

		const pagedjsCompatible =
			compatAttr === "false" || compatAttr === "0"
				? false
				: compatAttr === "true" || compatAttr === "1"
					? true
					: undefined;

		const viewAttr =
			scriptTag?.getAttribute("data-printedjs-view") ??
			scriptTag?.getAttribute("data-view-mode");

		const viewMode: MinimalViewMode | undefined =
			viewAttr === "none" || viewAttr === "false"
				? "none"
				: viewAttr === "spread"
					? "spread"
					: viewAttr === "single"
						? "single"
						: undefined;

		// Only auto-run if document contains @page or pagedjs/printedjs markers
		const hasPageCss = Array.from(document.querySelectorAll("style")).some((s) =>
			/@page\b/i.test(s.textContent ?? ""),
		);

		if (hasPageCss || scriptTag?.hasAttribute("data-printedjs-auto")) {
			interface MutablePolyfillOptions {
				target?: HTMLElement | undefined;
				isolation?: "root" | "iframe" | undefined;
				pagedjsCompatible?: boolean | undefined;
				viewMode?: MinimalViewMode | undefined;
			}

			const polyfillOpts: MutablePolyfillOptions = {
				target,
				isolation,
			};

			if (pagedjsCompatible !== undefined) {
				polyfillOpts.pagedjsCompatible = pagedjsCompatible;
			}

			if (viewMode !== undefined) {
				polyfillOpts.viewMode = viewMode;
			}

			void polyfill(polyfillOpts);
		}
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", run, { once: true });
	} else {
		setTimeout(run, 0);
	}
}

if (typeof window !== "undefined") {
	// SAFETY: Window augmented with Printedjs minimal globals
	const win = window as WindowWithPrintedjsMinimal;

	const pagedCompat = {
		polyfill,
		Previewer,
		Handler,
		registerHandlers,
		createRenderer,
		standardPreset,
		singlePageViewPlugin,
		spreadPageViewPlugin,
		pageViewsPlugin,
	};

	win.Paged = pagedCompat;
	win.PagedPolyfill = pagedCompat;
	win.Printed = pagedCompat;
	win.PrintedJS = pagedCompat;
	win.Printedjs = pagedCompat;
	win.PrintedjsMinimal = pagedCompat;
	win.PrintedjsPolyfill = pagedCompat;

	autoInit();
}

export { createRenderer } from "@printedjs/browser";

export { standardPreset } from "@printedjs/plugin-preset";

export {
	singlePageViewPlugin,
	spreadPageViewPlugin,
	pageViewsPlugin,
	type SinglePageViewOptions,
	type SpreadPageViewOptions,
	type ViewMode,
} from "@printedjs/plugin-views";

export type { PageResult, RenderResult } from "@printedjs/core";
