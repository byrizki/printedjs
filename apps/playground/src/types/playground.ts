import type { TraceReport } from "@printedjs/devtools";

export type PlaygroundDataScalar = string | number | boolean | null | undefined;

export type PlaygroundDataValue =
	| PlaygroundDataScalar
	| readonly PlaygroundDataValue[]
	| { readonly [key: string]: PlaygroundDataValue | undefined };

export interface PlaygroundDataMap {
	readonly [key: string]: PlaygroundDataValue | undefined;
}

export interface PlaygroundFixture {
	readonly id: string;
	readonly title: string;
	readonly category: "templates" | "paged-media" | "test-fixtures";
	readonly description: string;
	readonly html: string;
	readonly data?: PlaygroundDataMap | undefined;
}

export interface RenderStats {
	readonly pageCount: number;
	readonly totalDurationMs: number;
	readonly compileDurationMs: number;
	readonly layoutDurationMs: number;
	readonly isolation: "root" | "iframe";
	readonly traceReport?: TraceReport | undefined;
}

export interface PlaygroundState {
	currentFixture: PlaygroundFixture;
	templateContent: string;
	dataJsonContent: string;
	compiledHtml: string;
	isolationMode: "root" | "iframe";
	autoRender: boolean;
	zoomLevel: number;
	viewMode: "single" | "spread" | "flipbook";
	showDevtoolsOverlay: boolean;
	activeTab: "template" | "data";
	stats: RenderStats | null;
	isRendering: boolean;
	error: string | null;
}

export interface PlaygroundApp {
	readonly currentFixture: PlaygroundFixture;
	render(): Promise<void>;
	destroy(): void;
	getState(): Readonly<PlaygroundState>;
	setFixture(fixtureId: string): Promise<void>;
}
