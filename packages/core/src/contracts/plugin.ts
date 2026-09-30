import type { PagedjsCompatibilityOptions } from "./compatibility.js";
import type { DiagnosticsLevel } from "./request.js";

export interface PluginContext extends PagedjsCompatibilityOptions {
	readonly metadata: Record<string, unknown>;
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
