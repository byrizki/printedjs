import type { TraceReport } from "@printedjs/devtools";

export interface PlaygroundFixture {
	readonly id: string;
	readonly title: string;
	readonly category: "templates" | "paged-media" | "test-fixtures";
	readonly description: string;
	readonly html: string;
	readonly data?: Record<string, unknown> | undefined;
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
