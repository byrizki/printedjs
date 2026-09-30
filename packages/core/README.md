# @printedjs/core

The headless, DOM-independent core engine and contract foundation for Printedjs.

`@printedjs/core` provides the pure pagination runtime, CSS AST facade, progress guards, plugin lifecycle ordering, and standardized types for browser and server document layout.

---

## Features

- **Zero DOM / CSSOM Dependencies** — Pure TypeScript logic suitable for NodeJS, server environments, and browser worker threads.
- **Robust State Machine (`Paginator`)** — Orchestrates multi-page layout steps via decoupled adapters (`PaginatorAdapter`).
- **Infinite Loop Protection (`LayoutProgressGuard`)** — Guaranteed termination using token tracking and progressive loop detection.
- **Plugin Lifecycle Pipeline (`orderPlugins`)** — Deterministic lifecycle hooks: `beforeParse`, `afterParse`, `beforeLayout`, `beforePageLayout`, `afterPageLayout`, `afterRender`.
- **CSS AST Facade (`parseCss`, `generateCss`, `stripPageRules`)** — Lightweight, high-performance AST parser wrapping `css-tree` for `@page` and margin box declarations.
- **Lifecycle Management (`RenderSession`)** — Thread-safe session tracking, cancellation tokens, and non-destructive cleanup tasks.

---

## Installation

```bash
pnpm add @printedjs/core
```

---

## Architecture & API

### Core Contracts

- **`RenderRequest`** — Specification of document source (HTML or DOM element), external/inline stylesheets, render limits (e.g. `maxPages`, `timeoutMs`), and diagnostics level.
- **`RenderResult`** — Completed pagination output containing `pages: PageResult[]`, performance metrics (`totalDurationMs`), warnings, and document metadata.
- **`PageResult`** — Information for an individual laid-out page, including 1-based `pageNumber`, `pageBox` dimensions (width, height, margins, bleed), and page element reference.
- **`PrintedjsPlugin`** — Interface for implementing custom pagination plugins with hooks across the layout lifecycle.

### Paginator & Adapters

```typescript
import { Paginator, type LayoutStepResult, type PaginatorAdapter } from "@printedjs/core";

// Custom adapter implementing DOM layout or headless measurement
class CustomLayoutAdapter implements PaginatorAdapter {
	prepare(): void {}
	hasNextContent(): boolean {
		return true;
	}
	async layoutPage(pageNumber: number): Promise<LayoutStepResult> {
		return { pageNumber, hasMore: false };
	}
}

const paginator = new Paginator({
	adapter: new CustomLayoutAdapter(),
	maxPages: 100,
	onPageProgress: (event) => {
		console.log(`Page ${event.pageNumber} laid out.`);
	},
});

const pages = await paginator.paginate();
```

### CSS Parser & AST Facade

```typescript
import { generateCss, parseCss, stripPageRules } from "@printedjs/core";

const css = `
  @page {
    size: A4;
    margin: 20mm;
    @top-center { content: "Header"; }
  }
  body { color: black; }
`;

// Extract and parse CSS AST
const ast = parseCss(css);

// Strip @page and margin box rules for standard stylesheet injection
const contentCss = stripPageRules(css);
```

### Progress Guard

`LayoutProgressGuard` monitors tokens across layout steps to protect against non-progressing layout loops:

```typescript
import { LayoutProgressGuard, PrintedjsLayoutLimitError } from "@printedjs/core";

const guard = new LayoutProgressGuard({ maxZeroProgressSteps: 3 });

for (const step of layoutSteps) {
	guard.recordProgress(step.token);
	// Throws PrintedjsLayoutLimitError if token fails to make forward progress
}
```

---

## License

MIT
