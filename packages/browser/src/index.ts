import {
	BrowserRenderer,
	type CreateRendererOptions,
	type IncrementalRenderRequest,
} from "./browser-renderer.js";
import { createRenderer } from "./create-renderer.js";
import { createPageShell, PAGE_SHELL_CSS } from "./dom/page-shell.js";
import { DomLayoutAdapter, type DomLayoutAdapterOptions } from "./dom/layout-adapter.js";
import { normalizeSource, type NormalizedContent } from "./dom/source-normalizer.js";
import {
	loadStylesheet,
	loadStylesheets,
	type LoadedStylesheet,
} from "./styles/stylesheet-loader.js";
import { StyleRegistry } from "./styles/style-registry.js";
import { IframeSurface } from "./surface/iframe-surface.js";
import { RootSurface } from "./surface/root-surface.js";
import type { IsolationMode, RenderSurface, SurfaceTarget } from "./surface/types.js";
import {
	virtualizePages,
	type VirtualizeOptions,
	type Virtualizer,
} from "./surface/virtualizer.js";
import type { PageResult, RenderResult } from "@printedjs/core";

export {
	BrowserRenderer,
	type CreateRendererOptions,
	type IncrementalRenderRequest,
	createRenderer,
	createPageShell,
	PAGE_SHELL_CSS,
	DomLayoutAdapter,
	type DomLayoutAdapterOptions,
	normalizeSource,
	type NormalizedContent,
	loadStylesheet,
	loadStylesheets,
	type LoadedStylesheet,
	StyleRegistry,
	IframeSurface,
	RootSurface,
	type IsolationMode,
	type RenderSurface,
	type SurfaceTarget,
	virtualizePages,
	type VirtualizeOptions,
	type Virtualizer,
	type PageResult,
	type RenderResult,
};

if (typeof window !== "undefined") {
	const win = window as unknown as Record<string, unknown>;
	const api = {
		BrowserRenderer,
		createRenderer,
		createPageShell,
		PAGE_SHELL_CSS,
		DomLayoutAdapter,
		normalizeSource,
		loadStylesheet,
		loadStylesheets,
		StyleRegistry,
		IframeSurface,
		RootSurface,
		virtualizePages,
	};
	win.Printed = api;
	win.Printedjs = api;
	win.PrintedJS = api;
}
