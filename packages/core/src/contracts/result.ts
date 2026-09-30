export interface PageBox {
	readonly width: number;
	readonly height: number;
}

export interface PageResult {
	readonly pageNumber: number;
	readonly box: PageBox;
	readonly classes: readonly string[];
	readonly metadata: Readonly<Record<string, unknown>>;
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
	readonly metadata: Readonly<Record<string, unknown>>;
}
