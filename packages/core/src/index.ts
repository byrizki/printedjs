export {
	PrintedjsAbortError,
	PrintedjsError,
	PrintedjsInputError,
	PrintedjsLayoutLimitError,
	PrintedjsPluginError,
	PrintedjsPluginOrderError,
	PrintedjsStylesheetError,
} from "./contracts/errors.js";

export type { PagedjsCompatibilityOptions } from "./contracts/compatibility.js";

export type {
	ContentSource,
	DiagnosticsLevel,
	DomContent,
	HtmlContent,
	InlineStylesheet,
	RenderLimits,
	RenderRequest,
	StylesheetSource,
	UrlStylesheet,
} from "./contracts/request.js";

export type {
	PageBox,
	PageResult,
	RenderMetrics,
	RenderResult,
	RenderWarning,
} from "./contracts/result.js";

export type { PrintedjsPlugin, PluginContext } from "./contracts/plugin.js";

export { orderPlugins } from "./plugins/order.js";

export {
	RenderSession,
	type CleanupTask,
	type ProgressListener,
	type RenderProgressEvent,
	type RenderSessionOptions,
	type SessionState,
} from "./runtime/render-session.js";

export type { BreakCursor, BreakToken } from "./layout/break-state.js";

export {
	LayoutProgressGuard,
	type ProgressGuardOptions,
} from "./layout/progress-guard.js";

export {
	Paginator,
	type LayoutStepResult,
	type PaginatorAdapter,
	type PaginatorOptions,
} from "./layout/paginator.js";

export type {
	CssAst,
	CssAtRule,
	CssDeclaration,
	CssMarginBoxRule,
	CssPageRule,
	CssRule,
	SourceLocation,
} from "./css/ast.js";

export { generateCss, parseCss, stripPageRules } from "./css/parser.js";
export { CssTransformContext } from "./css/transform-context.js";
