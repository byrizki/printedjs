import type { PagedjsCompatibilityOptions } from "./compatibility.js";
import type { DiagnosticsLevel } from "./request.js";
import type { PageResult } from "./result.js";

export interface PluginMetadata {
	blank?: boolean | undefined;
	document?: Document | undefined;
	contentRoot?: unknown;
	pages?: readonly PageResult[] | readonly unknown[] | undefined;
	pageCount?: number | undefined;
	totalPages?: number | undefined;
	total?: number | undefined;
	bookmarks?: unknown;
	flipBook?: unknown;
	pageFlip?: unknown;
	pageViews?: unknown;
	eta?: unknown;
	"printedjs:breakRules"?: unknown;
	"printedjs:stringRules"?: unknown;
	"printedjs:footnoteRules"?: unknown;
}

export interface PluginContext extends PagedjsCompatibilityOptions {
	readonly metadata: PluginMetadata;
	readonly diagnostics?: DiagnosticsLevel | undefined;
}

export interface PrintedjsPlugin {
	readonly name: string;
	readonly before?: readonly string[] | undefined;
	readonly after?: readonly string[] | undefined;
	readonly setup?: (context: PluginContext) => void | Promise<void>;
	readonly transformStyles?: (
		css: string,
		context: PluginContext,
	) => string | Promise<string>;
	readonly beforeLayout?: (context: PluginContext) => void | Promise<void>;
	readonly afterRender?: (context: PluginContext) => void | Promise<void>;
}
