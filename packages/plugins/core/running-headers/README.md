# @printedjs/plugin-running-headers

Running headers and footers plugin for Printedjs.

Provides support for W3C GCPM `position: running(...)` and `@page` margin box element stamping via `content: element(...)`.

---

## Features

- **Element Extraction** — Removes elements from normal document flow using `position: running(ident)`.
- **Margin Box Insertion** — Places extracted elements into any `@page` margin box using `content: element(ident, policy)`.
- **Policy Support** — Supports `first`, `start`, `last`, and `first-except` running element selection policies.

---

## Installation

```bash
pnpm add @printedjs/plugin-running-headers @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { runningHeadersPlugin } from "@printedjs/plugin-running-headers";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [runningHeadersPlugin()],
});

await renderer.render({
	content: {
		html: `
      <style>
        @page {
          size: A4;
          margin: 25mm 20mm;
          @top-center {
            content: element(currentChapter, first-except);
          }
        }
        h2.chapter-title {
          position: running(currentChapter);
        }
      </style>
      <h2 class="chapter-title">Chapter 1: The Beginning</h2>
      <p>Body copy spanning multiple pages...</p>
    `,
	},
});
```

---

## Supported Assignment Policies

- **`first`** (default) — Uses the first assignment of the element on the page.
- **`start`** — Uses the element if it occurs at the very start of the page, otherwise carries forward from previous page.
- **`last`** — Uses the last occurrence of the element on the page.
- **`first-except`** — Displays on subsequent pages, but suppresses the header on the page where the element first appears.
