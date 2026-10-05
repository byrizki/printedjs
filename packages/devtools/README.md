# @printedjs/devtools

Diagnostic tracing and developer HUD overlay for Printedjs.

`@printedjs/devtools` provides lifecycle performance instrumentation, trace event collection, and an unobtrusive visual inspection overlay for document layout debugging.

---

## Features

- **Lifecycle Phase Tracing (`devtoolsPlugin`)** — Records high-resolution timestamps for style transformation, DOM parsing, layout steps, and plugin execution.
- **Trace Event Collector (`TraceCollector`)** — Collects structured events and outputs a comprehensive `TraceReport` including phase durations and page counts.
- **Non-Print Visual Overlay (`createDevtoolsOverlay`)** — Injects a lightweight fixed diagnostic HUD into the preview container displaying page count and total render time without interfering with print styles.

---

## Installation

```bash
pnpm add -D @printedjs/devtools @printedjs/core
```

---

## Usage

### 1. Tracing Lifecycle Performance

Attach `devtoolsPlugin` to monitor and benchmark document layout:

```typescript
import { createRenderer } from "@printedjs/browser";
import { devtoolsPlugin, type TraceReport } from "@printedjs/devtools";
import { standardPreset } from "@printedjs/plugins";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [
		devtoolsPlugin({
			onReport: (report: TraceReport) => {
				console.log(
					`Rendered ${report.pageCount} pages in ${report.totalDurationMs.toFixed(1)}ms`,
				);
				console.table(report.events);
			},
		}),
		...standardPreset(),
	],
});

await renderer.render({
	content: { html: documentSource },
});
```

### 2. Diagnostic HUD Overlay & Hover Inspector

Display an on-screen diagnostic HUD with interactive element inspection and visual page guides:

```typescript
import { createDevtoolsOverlay } from "@printedjs/devtools";

const container = document.querySelector("#preview") as HTMLElement;

// Create HUD overlay with hover inspection and page guides enabled
const overlay = createDevtoolsOverlay(container, {
	inspectEnabled: true,
	guidesEnabled: true,
	onInspect: (metrics) => {
		if (metrics) {
			console.log(`Inspecting ${metrics.selector} on Page ${metrics.pageNumber}`);
		}
	},
});

// Toggle features programmatically:
overlay.setInspectEnabled(false);
overlay.setGuidesEnabled(true);

// Clean up when destroying preview:
overlay.destroy();
```

---

## API Reference

### `createDevtoolsOverlay(container: HTMLElement, options?: DevtoolsOverlayOptions | TraceReport): DevtoolsOverlay`

Renders an on-screen HUD badge in the bottom-right corner of the container with interactive `[Inspect]` and `[Guides]` buttons.

- Returns `{ element, hoverInspector, pageGuides, setInspectEnabled, setGuidesEnabled, updateReport, destroy }`.

### `createHoverInspector(container: HTMLElement, options?: HoverInspectorOptions): HoverInspector`

Creates an interactive pointer tracker that renders a multi-layer box model overlay (margin, border, padding, content) and a floating print diagnostics tooltip over hovered elements.

- Returns `{ enable(), disable(), isEnabled(), destroy() }`.

### `createPageGuides(container: HTMLElement, initialEnabled?: boolean): PageGuides`

Injects and manages non-invasive CSS paged media guide styles:

- Dashed outlines and labels for all 16 margin boxes (`@top-left` .. `@bottom-right`).
- Outlines for sheet trim boundaries and bleed zones.
- Split continuity markers for `[data-split-to]` and `[data-split-from]`.

### `extractPrintMetrics(element: HTMLElement): ElementPrintMetrics | null`

Extracts computed print metrics for any element inside a `.printedjs_page`:

- Selector, tag name, ID, and classes.
- Physical dimensions in `px` and `mm`.
- Page number and total pages.
- Four-layer box model (margin, border, padding, content).
- Break constraints (`break-inside`, `break-before`, `break-after`, split flags).
- Vertical clearance: Remaining space in px and mm before the page bottom margin.

### `devtoolsPlugin(options?: DevtoolsPluginOptions): PrintedjsPlugin`

Creates a Printedjs plugin that records lifecycle trace events.

- `options.onReport?: (report: TraceReport) => void` — Callback invoked with the final trace report after pagination completes.

### `TraceCollector`

Standalone collector class:

- `start(): void` — Resets collector and records start timestamp.
- `recordEvent(event: TraceEvent): void` — Adds a phase or warning event.
- `generateReport(pageCount: number): TraceReport` — Compiles and returns all recorded events with total duration.

---

## License

MIT
