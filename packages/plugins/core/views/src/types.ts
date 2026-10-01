export type ViewMode = "single" | "spread" | "flipbook" | "book";

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

export interface FlipBookViewOptions {
	readonly sound?: boolean | undefined;
	readonly turnDurationMs?: number | undefined;
	readonly keyboardNavigation?: boolean | undefined;
}

export interface PageViewsPluginOptions {
	readonly initialMode?: ViewMode | undefined;
	readonly single?: SinglePageViewOptions | undefined;
	readonly spread?: SpreadPageViewOptions | undefined;
	readonly flipbook?: FlipBookViewOptions | undefined;
}

export interface FlipBookController {
	readonly currentPage: number;
	readonly currentSpread: number;
	readonly totalSpreads: number;
	next(): Promise<void>;
	prev(): Promise<void>;
	flipTo(pageNumber: number): Promise<void>;
	destroy(): void;
}

export interface PageViewsController {
	readonly currentMode: ViewMode;
	setMode(mode: ViewMode): void;
	getFlipBook(): FlipBookController | null;
	destroy(): void;
}
