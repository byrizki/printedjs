export { createPageGuides, type PageGuides } from "./guides/page-guides.js";

export {
	createHoverInspector,
	type HoverInspector,
	type HoverInspectorOptions,
} from "./inspector/hover-inspector.js";

export {
	extractPrintMetrics,
	generateElementSelector,
	pxToMm,
} from "./inspector/print-metrics.js";

export { findSourceLine, injectSourceLineNumbers } from "./locator/source-locator.js";

export { createDevtoolsOverlay, type DevtoolsOverlay } from "./overlay.js";

export {
	devtoolsPlugin,
	TraceCollector,
	type DevtoolsPluginOptions,
	type TraceEvent,
	type TraceReport,
} from "./trace.js";

export type {
	BoxDimensions,
	BoxOffsets,
	BreakRules,
	DevtoolsOverlayOptions,
	ElementBoxModel,
	ElementPrintMetrics,
} from "./types.js";
