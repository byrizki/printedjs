# @printedjs/plugin-views

Page view modes and interactive viewing controller plugin for Printedjs.

Provides multiple document viewing layouts: single page scrolling, two-page facing spreads, and realistic 3D animated flipbooks.

---

## Credits & Attribution

The 3D flipbook engine in this package is powered by `@printedjs/plugin-page-flip`, which is adapted from the open-source **[StPageFlip](https://github.com/Nodlik/StPageFlip)** library created by **[Oleg Nodlik](https://github.com/Nodlik)**.

---

## Features

- **Multi-Mode View Controller (`DomPageViewsController`)** — Seamless runtime switching between `single`, `spread`, and `flipbook` modes.
- **Single Page View (`singlePageViewPlugin`)** — Vertical stacked page view optimized for continuous scrolling and standard previews.
- **Two-Page Spread View (`spreadPageViewPlugin`)** — Side-by-side facing pages (book spread) with automatic recto/verso alignment.
- **Interactive Flipbook (`flipBookViewPlugin`)** — 3D page curl physics, page dragging, navigation buttons, and page turn audio.

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

const target = document.querySelector("#viewport") as HTMLElement;

const renderer = createRenderer({
	target,
	plugins: [
		pageViewsPlugin({
			initialMode: "spread", // "single" | "spread" | "flipbook"
			flipBook: {
				sound: true,
				flippingTime: 700,
			},
		}),
	],
});

await renderer.render({
	content: { html: "<p>Continuous content...</p>" },
});

// Access the runtime controller:
const controller = new DomPageViewsController(target);
controller.setMode("flipbook");

// Programmatic flipbook navigation:
const flipBook = controller.getFlipBook();
if (flipBook) {
	await flipBook.next();
}
```

### Standalone View Plugins

```typescript
import {
	singlePageViewPlugin,
	spreadPageViewPlugin,
	flipBookViewPlugin,
} from "@printedjs/plugin-views";

// Use only single page layout:
renderer.use(singlePageViewPlugin());

// Or use only two-page spread layout:
renderer.use(spreadPageViewPlugin({ gap: "24px" }));

// Or use only 3D flipbook layout:
renderer.use(flipBookViewPlugin({ sound: true }));
```

---

## View Modes

| Mode         | Identifier              | Description                          |
| :----------- | :---------------------- | :----------------------------------- |
| **Single**   | `"single"`              | Vertical column of isolated pages    |
| **Spread**   | `"spread"`              | Side-by-side facing page pairs       |
| **Flipbook** | `"flipbook"` / `"book"` | Interactive 3D animated book turning |
