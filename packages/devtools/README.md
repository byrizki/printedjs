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

### 2. Diagnostic HUD Overlay

Display an on-screen diagnostic badge over the preview:

```typescript
import { createDevtoolsOverlay } from "@printedjs/devtools";

const container = document.querySelector("#preview") as HTMLElement;

// Create HUD overlay
const overlay = createDevtoolsOverlay(container);

// Clean up when destroying preview:
overlay.destroy();
```

---

## API Reference

### `devtoolsPlugin(options?: DevtoolsPluginOptions): PrintedjsPlugin`

Creates a Printedjs plugin that records lifecycle trace events.

- `options.onReport?: (report: TraceReport) => void` — Callback invoked with the final trace report after pagination completes.

### `createDevtoolsOverlay(container: HTMLElement, report?: TraceReport): DevtoolsOverlay`

Renders an on-screen badge in the bottom-right corner of the container displaying render statistics.

- Returns `{ element: HTMLElement, destroy(): void }`.

### `TraceCollector`

Standalone collector class:

- `start(): void` — Resets collector and records start timestamp.
- `recordEvent(event: TraceEvent): void` — Adds a phase or warning event.
- `generateReport(pageCount: number): TraceReport` — Compiles and returns all recorded events with total duration.

---

## License

MIT
