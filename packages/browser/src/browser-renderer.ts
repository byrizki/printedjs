import {
	orderPlugins,
	PrintedjsInputError,
	Paginator,
	RenderSession,
	type DiagnosticsLevel,
	type PageResult,
	type PagedjsCompatibilityOptions,
	type PrintedjsPlugin,
	type PluginMetadata,
	type ProgressListener,
	type RenderLimits,
	type RenderProgressEvent,
	type RenderRequest,
	type RenderResult,
	type StylesheetSource,
} from "@printedjs/core";
import { DomLayoutAdapter } from "./dom/layout-adapter.js";
import { PAGE_SHELL_CSS } from "./dom/page-shell.js";
import { normalizeSource } from "./dom/source-normalizer.js";
import { StyleRegistry } from "./styles/style-registry.js";
import { loadStylesheets, type LoadedStylesheet } from "./styles/stylesheet-loader.js";
import { IframeSurface } from "./surface/iframe-surface.js";
import { RootSurface } from "./surface/root-surface.js";
import type { IsolationMode, RenderSurface, SurfaceTarget } from "./surface/types.js";

interface MutablePluginContext {
	metadata: PluginMetadata;
	pagedjsCompatible: boolean;
	diagnostics?: DiagnosticsLevel;
}

interface MutableLoadedStylesheet {
	type: "inline" | "url";
	css: string;
	url?: string;
}

interface MutableDomLayoutAdapterOptions {
	surface: RenderSurface;
	sourceRoot: Node;
	pagedjsCompatible: boolean;
	fixedSelectors: readonly string[];
	fromPage?: number;
}

interface MutablePaginatorOptions {
	signal?: AbortSignal;
	limits?: RenderLimits;
	startPage?: number;
	initialPages?: readonly PageResult[];
	onProgress: (e: RenderProgressEvent) => void;
}

export interface CreateRendererOptions extends PagedjsCompatibilityOptions {
	readonly target: SurfaceTarget;
	readonly isolation?: IsolationMode | undefined;
	readonly plugins?: readonly PrintedjsPlugin[] | undefined;
	readonly diagnostics?: DiagnosticsLevel | undefined;
}

export interface IncrementalRenderRequest extends RenderRequest {
	readonly fromPage: number;
	readonly cachedPages?: readonly PageResult[] | undefined;
}

export class BrowserRenderer {
	readonly surface: RenderSurface;
	readonly pagedjsCompatible: boolean;
	private readonly styleRegistry: StyleRegistry;
	private readonly plugins: readonly PrintedjsPlugin[];
	private readonly diagnostics: DiagnosticsLevel;
	private readonly progressListeners: ProgressListener[] = [];
	private isRendering = false;
	private isDestroyed = false;
	private currentSession: RenderSession | undefined;
	private lastResult: RenderResult | null = null;

	constructor(options: CreateRendererOptions) {
		if (!options || !options.target) {
			throw new PrintedjsInputError("A valid target element is required");
		}

		this.pagedjsCompatible = options.pagedjsCompatible ?? false;

		const isIframe =
			options.target instanceof HTMLIFrameElement || options.target.tagName === "IFRAME";

		const isolation = options.isolation ?? (isIframe ? "iframe" : "root");

		if (isolation === "iframe") {
			if (!isIframe) {
				throw new PrintedjsInputError(
					"Iframe isolation requires an HTMLIFrameElement target",
				);
			}

			// SAFETY: options.target verified as iframe via isIframe check above
			this.surface = new IframeSurface(options.target as HTMLIFrameElement);
		} else {
			// SAFETY: options.target is validated as non-null HTMLElement in root isolation
			this.surface = new RootSurface(options.target as HTMLElement);
		}

		this.styleRegistry = new StyleRegistry(this.surface.document);
		this.plugins = options.plugins ? orderPlugins(options.plugins) : [];
		this.diagnostics = options.diagnostics ?? "none";
	}

	onProgress(listener: ProgressListener): () => void {
		this.progressListeners.push(listener);

		return () => {
			const idx = this.progressListeners.indexOf(listener);

			if (idx !== -1) {
				this.progressListeners.splice(idx, 1);
			}
		};
	}

	async render(request: RenderRequest): Promise<RenderResult> {
		return this.executeRender(request);
	}

	async renderIncremental(request: IncrementalRenderRequest): Promise<RenderResult> {
		return this.executeRender(request, request.fromPage, request.cachedPages);
	}

	private async executeRender(
		request: RenderRequest,
		fromPage?: number | undefined,
		cachedPages?: readonly PageResult[] | undefined,
	): Promise<RenderResult> {
		if (this.isDestroyed) {
			throw new PrintedjsInputError("Renderer has been destroyed");
		}

		if (this.isRendering) {
			throw new PrintedjsInputError("Render call already active on this renderer");
		}

		this.isRendering = true;
		const startTime = performance.now();

		const session = new RenderSession(request.signal ? { signal: request.signal } : {});

		this.currentSession = session;

		for (const listener of this.progressListeners) {
			session.onProgress(listener);
		}

		try {
			session.start();
			session.assertNotAborted();

			const isIncremental = Boolean(fromPage && fromPage > 1);

			if (!isIncremental) {
				this.surface.clear();
				this.styleRegistry.clear();
			}

			const {
				root: normalizedContent,
				inlineStyles,
				externalStylesheets,
				documentBaseUrl,
			} = normalizeSource(request.content, this.surface.document);

			session.assertNotAborted();

			const effectiveBaseUrl =
				request.baseUrl ?? request.content.baseUrl ?? documentBaseUrl;

			if (effectiveBaseUrl) {
				const doc = this.surface.document;
				let baseEl = doc.querySelector("base");

				if (!baseEl) {
					baseEl = doc.createElement("base");

					if (doc.head) {
						doc.head.prepend(baseEl);
					} else {
						doc.documentElement.prepend(baseEl);
					}
				}

				baseEl.setAttribute("href", effectiveBaseUrl);
			}

			const allStylesheetSources: StylesheetSource[] = [
				...(request.stylesheets ?? []),
				...(externalStylesheets?.map((url): StylesheetSource => ({ type: "url", url })) ??
					[]),
				...inlineStyles.map((content): StylesheetSource => ({ type: "inline", content })),
			];

			const loadedSheets = await loadStylesheets(allStylesheetSources, request.signal);
			session.assertNotAborted();

			const effectivePagedjsCompatible =
				request.pagedjsCompatible ?? this.pagedjsCompatible;

			const metadata: PluginMetadata = {
				document: this.surface.document,
				contentRoot: normalizedContent,
			};

			const pluginContext: MutablePluginContext = {
				metadata,
				pagedjsCompatible: effectivePagedjsCompatible,
			};

			if (this.diagnostics !== "none") {
				pluginContext.diagnostics = this.diagnostics;
			}

			for (const plugin of this.plugins) {
				if (plugin.setup) {
					await plugin.setup(pluginContext);
				}

				session.assertNotAborted();
			}

			const transformedSheets: LoadedStylesheet[] = [];

			for (const sheet of loadedSheets) {
				let currentCss = sheet.css;

				for (const plugin of this.plugins) {
					if (plugin.transformStyles) {
						currentCss = await plugin.transformStyles(currentCss, pluginContext);
					}
				}

				const transformedSheet: MutableLoadedStylesheet = {
					type: sheet.type,
					css: currentCss,
				};

				if (sheet.url) {
					transformedSheet.url = sheet.url;
				}

				transformedSheets.push(transformedSheet);
			}

			const fixedSelectors: string[] = [];

			const cleanedSheets = transformedSheets.map((sheet) => {
				if (!sheet.css.includes("fixed")) {
					return sheet;
				}

				const fixedRegex = /position\s*:\s*fixed\s*;?/gi;
				let match: RegExpExecArray | null;

				while ((match = fixedRegex.exec(sheet.css)) !== null) {
					const fixedPos = match.index;
					const openBrace = sheet.css.lastIndexOf("{", fixedPos);
					const closeBrace = sheet.css.indexOf("}", fixedPos);

					if (
						openBrace !== -1 &&
						closeBrace !== -1 &&
						openBrace < fixedPos &&
						fixedPos < closeBrace
					) {
						const prevDelimiter = Math.max(
							sheet.css.lastIndexOf("}", openBrace),
							sheet.css.lastIndexOf(";", openBrace),
							0,
						);

						const selectorText = sheet.css
							.slice(prevDelimiter === 0 ? 0 : prevDelimiter + 1, openBrace)
							.trim();

						const selectors = selectorText
							.split(",")
							.map((s) => s.trim())
							.filter((s) => s.length > 0 && !s.startsWith("@"));

						fixedSelectors.push(...selectors);
					}
				}

				const css = sheet.css.replace(fixedRegex, "");

				return { ...sheet, css };
			});

			this.styleRegistry.apply([
				{ type: "inline", css: PAGE_SHELL_CSS },
				...cleanedSheets,
			]);

			const doc = this.surface.document;

			if (doc.fonts) {
				try {
					await Promise.race([
						(async () => {
							await doc.fonts.ready;
							const fontPromises: Promise<unknown>[] = [];
							doc.fonts.forEach((fontFace) => {
								if (fontFace.status !== "loaded") {
									fontPromises.push(fontFace.load().catch(() => fontFace.family));
								}
							});

							if (fontPromises.length > 0) {
								await Promise.all(fontPromises);
							}

							await doc.fonts.ready;
						})(),
						new Promise((resolve) => setTimeout(resolve, 5000)),
					]);
				} catch {
					// Fall through if font loading fails
				}
			}

			for (const plugin of this.plugins) {
				if (plugin.beforeLayout) {
					await plugin.beforeLayout(pluginContext);
				}

				session.assertNotAborted();
			}

			const adapterOptions: MutableDomLayoutAdapterOptions = {
				surface: this.surface,
				sourceRoot: normalizedContent,
				pagedjsCompatible: effectivePagedjsCompatible,
				fixedSelectors,
			};

			if (isIncremental && fromPage !== undefined) {
				adapterOptions.fromPage = fromPage;
			}

			const adapter = new DomLayoutAdapter(adapterOptions);

			// SAFETY: isIncremental guarantees fromPage is defined and is a valid page index
			const incrementalPreservedSliceIndex = (fromPage as number) - 1;

			const preservedPages: readonly PageResult[] = isIncremental
				? (cachedPages ??
					(this.lastResult
						? this.lastResult.pages.slice(0, incrementalPreservedSliceIndex)
						: []))
				: [];

			const paginatorOptions: MutablePaginatorOptions = {
				onProgress: (e) => session.emitProgress(e),
			};

			if (request.signal) {
				paginatorOptions.signal = request.signal;
			}

			if (request.limits) {
				paginatorOptions.limits = request.limits;
			}

			if (isIncremental && fromPage !== undefined) {
				paginatorOptions.startPage = fromPage;
				paginatorOptions.initialPages = preservedPages;
			}

			const paginator = new Paginator(adapter, paginatorOptions);

			const result = await paginator.paginate();
			session.assertNotAborted();

			const count = result.pages.length;
			metadata["pages"] = result.pages;
			metadata["pageCount"] = count;
			metadata["totalPages"] = count;
			metadata["total"] = count;

			for (const plugin of this.plugins) {
				if (plugin.afterRender) {
					await plugin.afterRender(pluginContext);
				}

				session.assertNotAborted();
			}

			session.complete(count);
			const durationMs = performance.now() - startTime;

			const finalResult: RenderResult = {
				pages: result.pages,
				metrics: {
					durationMs,
					pageCount: count,
					layoutPasses: result.metrics.layoutPasses,
				},
				warnings: result.warnings,
				metadata: {
					...metadata,
					...result.metadata,
				},
			};

			this.lastResult = finalResult;

			const eventDetail = {
				result: finalResult,
				pages: result.pages,
				pageCount: count,
				totalPages: count,
				total: count,
				flow: {
					pages: result.pages,
					pageCount: count,
					totalPages: count,
					total: count,
				},
			};

			const dispatchTargets: readonly (EventTarget | undefined)[] = [
				this.surface.window,
				this.surface.document,
				typeof window !== "undefined" ? window : undefined,
				typeof document !== "undefined" ? document : undefined,
			];

			const seenTargets = new Set<EventTarget>();

			for (const target of dispatchTargets) {
				if (target && !seenTargets.has(target) && "dispatchEvent" in target) {
					seenTargets.add(target);

					try {
						target.dispatchEvent(
							new CustomEvent("printedjs:rendered", { detail: eventDetail }),
						);
						target.dispatchEvent(
							new CustomEvent("printedjs:afterRender", { detail: eventDetail }),
						);
						target.dispatchEvent(
							new CustomEvent("afterRendered", { detail: eventDetail }),
						);

						if (effectivePagedjsCompatible) {
							target.dispatchEvent(
								new CustomEvent("pagedjs:rendered", { detail: eventDetail }),
							);
						}
					} catch {
						// Fall through on cross-origin / destroyed dispatch
					}
				}
			}

			return finalResult;
		} finally {
			this.isRendering = false;
			this.currentSession = undefined;
		}
	}

	destroy(): void {
		if (this.isDestroyed) {
			return;
		}

		this.isDestroyed = true;

		if (this.currentSession) {
			void this.currentSession.destroy();
		}

		this.styleRegistry.destroy();
		this.surface.destroy();
	}
}
