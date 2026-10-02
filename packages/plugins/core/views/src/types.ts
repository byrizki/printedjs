import type { PluginContext } from "@printedjs/core";

export type ViewMode = "single" | "spread" | (string & {});

export interface SinglePageViewOptions {
	readonly gap?: number | string | undefined;
	readonly shadow?: boolean | undefined;
	readonly autoCenter?: boolean | undefined;
}

export interface SpreadPageViewOptions {
	readonly columns?: number | undefined;
	readonly rows?: number | undefined;
	readonly coverPage?: boolean | undefined;
	readonly spineShadow?: boolean | undefined;
	readonly gutter?: number | string | undefined;
}

export interface ViewModeAdapter<TOptions = unknown, TController = unknown> {
	readonly mode: string | readonly string[];
	attach(container: HTMLElement, options?: TOptions): TController;
	detach?(container: HTMLElement): void;
	transformStyles?(css: string, context?: PluginContext): string;
}

export interface PageViewsPluginOptions {
	readonly initialMode?: ViewMode | undefined;
	readonly single?: SinglePageViewOptions | undefined;
	readonly spread?: SpreadPageViewOptions | undefined;
	readonly adapters?: readonly ViewModeAdapter[] | undefined;
}

export interface PageViewsController {
	readonly currentMode: ViewMode;
	setMode(mode: ViewMode, options?: unknown): void;
	getAdapterController<T = unknown>(mode?: string): T | null;
	getFlipBook?(): unknown;
	destroy(): void;
}
