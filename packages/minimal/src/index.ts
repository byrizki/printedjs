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
import { standardPreset } from "@printedjs/plugins";

export interface PolyfillOptions extends PagedjsCompatibilityOptions {
	readonly target?: HTMLElement | undefined;
	readonly isolation?: "root" | "iframe" | undefined;
	readonly plugins?: readonly PrintedjsPlugin[] | undefined;
	readonly auto?: boolean | undefined;
}

export interface PagedHandlerInstance {
	beforeParsed?(content: unknown): void | Promise<void>;
	afterParsed?(parsed: unknown): void | Promise<void>;
	beforePageLayout?(
		page: unknown,
		index?: number,
		breakToken?: unknown,
	): void | Promise<void>;
	afterPageLayout?(
		pageElement: unknown,
		page?: unknown,
		breakToken?: unknown,
		chunker?: unknown,
	): void | Promise<void>;
	afterRendered?(pages: unknown): void | Promise<void>;
}

export type PagedHandler = PagedHandlerInstance | (new () => PagedHandlerInstance);

export class Handler implements PagedHandlerInstance {
	beforeParsed?(_content: unknown): void | Promise<void>;
	afterParsed?(_parsed: unknown): void | Promise<void>;
	beforePageLayout?(
		_page: unknown,
		_index?: number,
		_breakToken?: unknown,
	): void | Promise<void>;
	afterPageLayout?(
		_pageElement: unknown,
		_page?: unknown,
		_breakToken?: unknown,
		_chunker?: unknown,
	): void | Promise<void>;
	afterRendered?(_pages: unknown): void | Promise<void>;
}

export interface PagedConfig {
	auto?: boolean | undefined;
	before?: (() => void | Promise<void>) | undefined;
	after?: ((flow: unknown) => void) | undefined;
	content?: string | HTMLElement | undefined;
	renderTo?: string | HTMLElement | undefined;
	stylesheets?: readonly string[] | undefined;
	pagedjsCompatible?: boolean | undefined;
}

const registeredHandlers: PagedHandler[] = [];

export function registerHandlers(...handlers: PagedHandler[]): void {
	registeredHandlers.push(...handlers);
}

function createHandlersPlugin(handlers: readonly PagedHandler[]): PrintedjsPlugin {
	let instances: PagedHandlerInstance[] = [];

	return {
		name: "pagedjs-handlers-lifecycle",
		setup() {
			instances = handlers.map((h) => (typeof h === "function" ? new h() : h));
		},
		async beforeLayout(context) {
			const contentRoot = context.metadata["contentRoot"] as HTMLElement | undefined;
			for (const inst of instances) {
				if (typeof inst.beforeParsed === "function") {
					await inst.beforeParsed(contentRoot);
				}
				if (typeof inst.afterParsed === "function") {
					await inst.afterParsed(contentRoot);
				}
			}
		},
		async afterRender(context) {
			const doc = context.metadata["document"] as Document | undefined;
			let pages: unknown[] = (context.metadata["pages"] as unknown[] | undefined) ?? [];
			if (pages.length === 0 && doc) {
				pages = Array.from(
					doc.querySelectorAll<HTMLElement>(".printedjs_page, .pagedjs_page"),
				);
			}
			const totalCount =
				pages.length || (context.metadata["pageCount"] as number | undefined) || 0;

			for (let i = 0; i < pages.length; i++) {
				const pageEl = pages[i]!;
				const pageObj = {
					number: i + 1,
					element: pageEl,
					total: totalCount,
					pageCount: totalCount,
					totalPages: totalCount,
				};
				for (const inst of instances) {
					if (typeof inst.beforePageLayout === "function") {
						await inst.beforePageLayout(pageEl as HTMLElement, i);
					}
					if (typeof inst.afterPageLayout === "function") {
						await inst.afterPageLayout(pageEl as HTMLElement, pageObj);
					}
				}
			}

			for (const inst of instances) {
				if (typeof inst.afterRendered === "function") {
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

	const win = window as unknown as {
		__printedjsOriginalContent?: string;
	};

	if (!win.__printedjsOriginalContent) {
		win.__printedjsOriginalContent = document.body.innerHTML;
	}

	const winConfig = window as unknown as {
		PrintedjsConfig?: { pagedjsCompatible?: boolean };
		PagedConfig?: PagedConfig;
	};
	const pagedConfig = winConfig.PagedConfig;

	if (typeof pagedConfig?.before === "function") {
		await pagedConfig.before();
	}

	let contentHtml = win.__printedjsOriginalContent;
	if (pagedConfig?.content) {
		if (typeof pagedConfig.content === "string") {
			contentHtml = pagedConfig.content;
		} else if (pagedConfig.content instanceof HTMLElement) {
			contentHtml = pagedConfig.content.innerHTML;
		}
	}

	if (activeRenderer) {
		activeRenderer.destroy();
		activeRenderer = null;
	}

	let target = options?.target;
	if (!target && pagedConfig?.renderTo) {
		if (typeof pagedConfig.renderTo === "string") {
			target = document.querySelector<HTMLElement>(pagedConfig.renderTo) ?? undefined;
		} else if (pagedConfig.renderTo instanceof HTMLElement) {
			target = pagedConfig.renderTo;
		}
	}
	if (!target) {
		target = document.body;
	}

	const isolation = options?.isolation ?? "root";
	const basePlugins = options?.plugins ?? standardPreset();
	const plugins =
		registeredHandlers.length > 0
			? [...basePlugins, createHandlersPlugin(registeredHandlers)]
			: basePlugins;

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
		winConfig.PrintedjsConfig?.pagedjsCompatible ??
		winConfig.PagedConfig?.pagedjsCompatible ??
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
			const result = await activeRenderer!.render({
				content: {
					html: contentHtml,
				},
				stylesheets: styles.map((content) => ({ type: "inline" as const, content })),
				pagedjsCompatible,
			});

			// Set global flags for headless runners
			const winObj = window as unknown as {
				__pagedRenderFinished?: boolean;
				__printedjsRenderFinished?: boolean;
				__pagedPageCount?: number;
			};
			winObj.__pagedRenderFinished = true;
			winObj.__printedjsRenderFinished = true;
			winObj.__pagedPageCount = result.pages.length;

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
			if (typeof pagedConfig?.after === "function") {
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
		const plugins =
			registeredHandlers.length > 0
				? [...basePlugins, createHandlersPlugin(registeredHandlers)]
				: basePlugins;

		const renderer = createRenderer({
			target: container,
			isolation: this.options.isolation ?? "root",
			plugins,
			pagedjsCompatible: this.options.pagedjsCompatible ?? false,
		});

		let html = "";
		let element: HTMLElement | undefined;

		if (typeof content === "string") {
			html = content;
		} else if (content instanceof HTMLElement) {
			element = content;
		} else {
			html = document.body.innerHTML;
		}

		const normalizedStyles: StylesheetSource[] = (stylesheets ?? []).map((s) => {
			if (typeof s === "string") {
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

			const winObj = window as unknown as {
				__pagedRenderFinished?: boolean;
				__printedjsRenderFinished?: boolean;
				__pagedPageCount?: number;
			};
			winObj.__pagedRenderFinished = true;
			winObj.__printedjsRenderFinished = true;
			winObj.__pagedPageCount = result.pages.length;

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

	const win = window as unknown as {
		PRINTEDJS_AUTO?: boolean;
		PagedConfig?: PagedConfig;
		Printedjs?: unknown;
		Paged?: unknown;
	};

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

		// Only auto-run if document contains @page or pagedjs/printedjs markers
		const hasPageCss = Array.from(document.querySelectorAll("style")).some((s) =>
			/@page\b/i.test(s.textContent ?? ""),
		);

		if (hasPageCss || scriptTag?.hasAttribute("data-printedjs-auto")) {
			void polyfill({
				target,
				isolation,
				...(pagedjsCompatible !== undefined ? { pagedjsCompatible } : {}),
			});
		}
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", run, { once: true });
	} else {
		setTimeout(run, 0);
	}
}

if (typeof window !== "undefined") {
	const win = window as unknown as {
		Paged?: unknown;
		PagedPolyfill?: unknown;
		Printed?: unknown;
		PrintedJS?: unknown;
		Printedjs?: unknown;
		PrintedjsMinimal?: unknown;
		PrintedjsPolyfill?: unknown;
	};
	const pagedCompat = {
		polyfill,
		Previewer,
		Handler,
		registerHandlers,
		createRenderer,
		standardPreset,
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
export { standardPreset } from "@printedjs/plugins";
export type { PageResult, RenderResult } from "@printedjs/core";
