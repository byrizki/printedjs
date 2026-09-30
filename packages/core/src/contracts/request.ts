import type { PagedjsCompatibilityOptions } from "./compatibility.js";

export type HtmlContent = {
	readonly html: string;
};

export type DomContent = {
	readonly node: Node;
};

export type ContentSource = HtmlContent | DomContent;

export type InlineStylesheet = {
	readonly type: "inline";
	readonly content: string;
};

export type UrlStylesheet = {
	readonly type: "url";
	readonly url: string;
};

export type StylesheetSource = InlineStylesheet | UrlStylesheet;

export interface RenderLimits {
	readonly maxPages?: number;
	readonly maxLayoutPasses?: number;
}

export type DiagnosticsLevel = "none" | "warn" | "debug" | "trace";

export interface RenderRequest extends PagedjsCompatibilityOptions {
	readonly content: ContentSource;
	readonly stylesheets?: readonly StylesheetSource[];
	readonly limits?: RenderLimits;
	readonly signal?: AbortSignal;
	readonly diagnostics?: DiagnosticsLevel;
}
