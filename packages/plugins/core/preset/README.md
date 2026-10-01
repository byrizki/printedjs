# @printedjs/plugin-preset

Standard W3C CSS Paged Media plugin suite preset for Printedjs.

Bundles all standard core layout plugins into a single, pre-ordered array for full W3C Paged Media and GCPM compliance.

---

## Included Plugins

The `standardPreset()` suite loads the following plugins in deterministic lifecycle order:

1. **`@printedjs/plugin-page-rules`** — `@page` size, margins, orientation, bleeds, and marks
2. **`@printedjs/plugin-breaks`** — Page breaks, column breaks, and avoid rules
3. **`@printedjs/plugin-strings`** — CSS `string-set` and `string(...)` resolution
4. **`@printedjs/plugin-generated-content`** — 16 margin boxes and running headers
5. **`@printedjs/plugin-counters`** — `counter(page)`, `counter(pages)`, and target cross-references
6. **`@printedjs/plugin-footnotes`** — `float: footnote` and footnote area placement
7. **`@printedjs/plugin-widows-orphans`** — Minimum line breaking constraints
8. **`@printedjs/plugin-columns`** — Multi-column layout flow and balancing
9. **`@printedjs/plugin-math`** — Formula split protection (KaTeX, MathJax, MathML)
10. **`@printedjs/plugin-hyphenation`** — Hyphenation normalization and soft hyphen preservation
11. **`@printedjs/plugin-bookmarks`** — Heading hierarchy extraction and outline generation
12. **`@printedjs/plugin-lists`** — Ordered list numbering continuity across page breaks

---

## Installation

```bash
pnpm add @printedjs/plugin-preset @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { standardPreset } from "@printedjs/plugin-preset";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [...standardPreset()],
});

await renderer.render({
	content: {
		html: `
      <style>
        @page {
          size: A4;
          margin: 20mm;
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
          }
        }
      </style>
      <h1>Document Title</h1>
      <p>Hello world!</p>
    `,
	},
});
```
