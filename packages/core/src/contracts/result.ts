export interface PageBox {
	readonly width: number;
	readonly height: number;
}

export interface ResultMetadata {
	readonly blank?: boolean | undefined;
	readonly document?: Document | undefined;
	readonly contentRoot?: unknown;
	readonly pages?: readonly PageResult[] | readonly unknown[] | undefined;
	readonly pageCount?: number | undefined;
	readonly totalPages?: number | undefined;
	readonly total?: number | undefined;
	readonly bookmarks?: unknown;
	readonly flipBook?: unknown;
	readonly pageFlip?: unknown;
	readonly pageViews?: unknown;
	readonly eta?: unknown;
	readonly "printedjs:breakRules"?: unknown;
	readonly "printedjs:stringRules"?: unknown;
	readonly "printedjs:footnoteRules"?: unknown;
}

export interface PageResult {
	readonly pageNumber: number;
	readonly box: PageBox;
	readonly classes: readonly string[];
	readonly metadata: ResultMetadata;
}

export interface RenderMetrics {
	readonly durationMs: number;
	readonly pageCount: number;
	readonly layoutPasses: number;
}

export interface RenderWarning {
	readonly code: string;
	readonly message: string;
	readonly sourceRef?: string;
}

export interface RenderResult {
	readonly pages: readonly PageResult[];
	readonly metrics: RenderMetrics;
	readonly warnings: readonly RenderWarning[];
	readonly metadata: ResultMetadata;
}
