# @printedjs/plugin-generated-content

Margin box generation and running element distribution plugin for Printedjs.

Implements W3C CSS Paged Media margin boxes, margin track distribution, running headers, and running footers.

---

## Features

- **16 W3C Margin Boxes** — Complete coverage of all `@page` margin areas (`@top-left`, `@top-center`, `@top-right`, `@bottom-left`, `@left-middle`, etc.).
- **Dynamic Track Sizing** — Automatic flex and grid track distribution for top, bottom, left, and right margin boxes.
- **Running Headers & Footers** — Implements `position: running(<ident>)` and margin box retrieval via `content: element(<ident>, [policy])`.
- **Policy Scopes** — Supports `first`, `start`, `last`, and `first-except` running element assignment policies.

---

## Installation

```bash
pnpm add @printedjs/plugin-generated-content @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { generatedContentPlugin } from "@printedjs/plugin-generated-content";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [generatedContentPlugin()],
});

await renderer.render({
	content: {
		html: `
      <style>
        @page {
          size: A4;
          margin: 25mm 20mm;
          @top-center {
            content: element(headerTitle);
          }
          @bottom-right {
            content: counter(page);
          }
        }
        .header-content {
          position: running(headerTitle);
        }
      </style>
      <div class="header-content">Quarterly Financial Review</div>
      <p>Page body content...</p>
    `,
	},
});
```

---

## Supported Margin Boxes

- **Top:** `@top-left-corner`, `@top-left`, `@top-center`, `@top-right`, `@top-right-corner`
- **Bottom:** `@bottom-left-corner`, `@bottom-left`, `@bottom-center`, `@bottom-right`, `@bottom-right-corner`
- **Left:** `@left-top`, `@left-middle`, `@left-bottom`
- **Right:** `@right-top`, `@right-middle`, `@right-bottom`
