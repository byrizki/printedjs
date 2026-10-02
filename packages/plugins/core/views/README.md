# @printedjs/plugin-views

Page view modes and interactive viewing controller plugin for Printedjs.

Provides core document viewing layouts: single page scrolling, two-page facing spreads, and an extensible `ViewModeAdapter` architecture for pluggable custom view modes (e.g., 3D flipbooks via `@printedjs/plugin-page-flip`).

---

## Features

- **Multi-Mode View Controller (`DomPageViewsController`)** — Seamless runtime switching between `single`, `spread`, and pluggable adapter modes.
- **Single Page View (`singlePageViewPlugin`)** — Vertical stacked page view optimized for continuous scrolling and standard previews.
- **Two-Page Spread View (`spreadPageViewPlugin`)** — Side-by-side facing pages (book spread) with automatic recto/verso alignment.
- **Pluggable View Adapters (`ViewModeAdapter`)** — Register custom view modes (e.g. `@printedjs/plugin-page-flip`).

---

## Installation

```bash
pnpm add @printedjs/plugin-views @printedjs/core
```

---

## Usage

### Unified View Mode Manager

```typescript
import { createRenderer } from "@printedjs/browser";
import { pageViewsPlugin, DomPageViewsController } from "@printedjs/plugin-views";
import { flipBookViewAdapter } from "@printedjs/plugin-page-flip";

const target = document.querySelector("#viewport") as HTMLElement;

const renderer = createRenderer({
	target,
	plugins: [
		pageViewsPlugin({
			initialMode: "spread", // "single" | "spread" | custom adapter mode
			adapters: [flipBookViewAdapter({ sound: true })],
		}),
	],
});

await renderer.render({
	content: { html: "<p>Continuous content...</p>" },
});

// Access the runtime controller:
const controller = new DomPageViewsController(target, {
	adapters: [flipBookViewAdapter()],
});
controller.setMode("flipbook");

// Programmatic adapter navigation:
const flipBook = controller.getAdapterController("flipbook");
if (flipBook) {
	await flipBook.next();
}
```

### Standalone View Plugins

```typescript
import {
	singlePageViewPlugin,
	spreadPageViewPlugin,
} from "@printedjs/plugin-views";

// Use only single page layout:
renderer.use(singlePageViewPlugin());

// Or use only two-page spread layout:
renderer.use(spreadPageViewPlugin({ gap: "24px" }));
```

---

## View Modes

| Mode         | Identifier              | Description                          | Provider |
| :----------- | :---------------------- | :----------------------------------- | :------- |
| **Single**   | `"single"`              | Vertical column of isolated pages    | Built-in |
| **Spread**   | `"spread"`              | Side-by-side facing page pairs       | Built-in |
| **Flipbook** | `"flipbook"` / `"book"` | Interactive 3D animated book turning | `@printedjs/plugin-page-flip` |

