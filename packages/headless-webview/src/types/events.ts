export type PageLoadStatus = "loading" | "loaded" | "error";

export interface HeadlessRenderResult {
	pdfBytes: Uint8Array;
	pageCount?: number;
	durationMs: number;
}
