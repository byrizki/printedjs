# @printedjs/browser

Browser-native rendering engine and DOM layout adapter for Printedjs.

`@printedjs/browser` coordinates DOM measurement, page box structure generation, stylesheet loading, isolated sandbox rendering (`root` or `iframe`), and page virtualization for paginated documents.

---

## Features

- **Surface Isolation (`RootSurface` / `IframeSurface`)** — Render directly into an existing DOM container (`root`) or into a clean, sandboxed `iframe` to isolate external styles and scripts.
- **W3C Paged Media Shell (`createPageShell`)** — Generates complete page box hierarchy with bleed areas, crop marks, and 16 standard margin boxes (`@top-left`, `@top-center`, `@bottom-right`, etc.).
- **Scoped DOM Layout Adapter (`DomLayoutAdapter`)** — Content slicing and chunking engine with strict table header/footer isolation and nested table boundary protection.
- **Dynamic Stylesheet Registry (`StyleRegistry`, `loadStylesheets`)** — Concurrent fetching, `@import` resolution, and scoping of inline and remote CSS stylesheets.
- **Page Virtualization (`virtualizePages`)** — Intersection-observer-backed DOM virtualizer for smooth scrolling and minimal memory consumption when previewing 100+ page documents.
- **Non-Destructive Teardown (`renderer.destroy()`)** — Complete restoration of original target DOM elements with zero leak of injected styles.

---

## Installation

```bash
pnpm add @printedjs/browser @printedjs/core
```

---

## Usage

### Basic Rendering

```typescript
import { createRenderer } from "@printedjs/browser";

const target = document.querySelector("#preview-container")!;

const renderer = createRenderer({
	target,
	isolation: "root", // or "iframe"
	pagedjsCompatible: false, // Set to true to include legacy .pagedjs_* class aliases
});

const result = await renderer.render({
	content: {
		html: `
      <style>
        @page {
          size: A4;
          margin: 25mm 20mm;
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
          }
        }
      </style>
      <h1>Annual Financial Report</h1>
      <p>Continuous flow content spanning multiple printed pages.</p>
    `,
	},
});

console.log(
	`Rendered ${result.pages.length} pages in ${result.metrics.totalDurationMs}ms.`,
);

// When finished, clean up DOM:
renderer.destroy();
```

### Isolated Iframe Surface

When rendering untrusted HTML or documents with conflicting global CSS, use `isolation: "iframe"`:

```typescript
const renderer = createRenderer({
	target: document.body,
	isolation: "iframe",
});

await renderer.render({
	content: {
		html: untrustedHtmlString,
	},
});
```

### Page Virtualization for Large Documents

```typescript
import { virtualizePages } from "@printedjs/browser";

const container = document.querySelector(".printedjs_pages") as HTMLElement;

// Virtualize rendered pages so only visible pages consume layout resources
const virtualizer = virtualizePages(container, {
	bufferPages: 2,
	rootMargin: "200px 0px",
});

// To disconnect virtualizer observers:
virtualizer.disconnect();
```

---

## API Reference

### `createRenderer(options: CreateRendererOptions): BrowserRenderer`

Creates a new `BrowserRenderer` instance with the specified options:

- `target: SurfaceTarget` — The container element or selector where pages will be rendered.
- `isolation?: "root" | "iframe"` — Isolation strategy (default: `"root"`).
- `plugins?: readonly PrintedjsPlugin[]` — Plugins to attach to the layout pipeline.
- `pagedjsCompatible?: boolean` — Whether to emit dual Printedjs and legacy Paged.js CSS classes and custom properties.

### `BrowserRenderer` Methods

- **`render(request: RenderRequest): Promise<RenderResult>`** — Parses stylesheets, prepares the surface, and renders the document.
- **`renderIncremental(request: IncrementalRenderRequest): Promise<RenderResult>`** — Re-renders from a specific page onwards without rebuilding preceding pages.
- **`destroy(): void`** — Destroys active sessions, disconnects observers, and clears rendered nodes from the target.

---

## License

MIT
