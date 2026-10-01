# @printedjs/plugin-breaks

Page and column break control plugin for Printedjs.

Implements CSS Fragmentation and Paged Media break rules, mapping CSS break declarations into paginator layout instructions.

---

## Features

- **Full CSS Fragmentation Support** — Parses `break-before`, `break-after`, and `break-inside`.
- **Legacy Property Compatibility** — Full support for `page-break-before`, `page-break-after`, and `page-break-inside`.
- **Spread & Side Alignment** — Honors directional breaks including `page`, `left`, `right`, `recto`, `verso`, and `avoid`.
- **Named Page Assignment** — Parses `page: <name>` properties to route elements onto specific named `@page` styles.
- **Fixed Position Stamping** — Marks `position: fixed` elements to repeat across generated pages.

---

## Installation

```bash
pnpm add @printedjs/plugin-breaks @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { breaksPlugin } from "@printedjs/plugin-breaks";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [breaksPlugin()],
});

await renderer.render({
	content: {
		html: `
      <style>
        h1 {
          break-before: page;
        }
        table, figure {
          break-inside: avoid;
        }
        .chapter-end {
          break-after: right;
        }
        .appendix {
          page: appendix;
        }
      </style>
      <div>...</div>
    `,
	},
});
```

---

## Supported Declarations

| Property                             | Values                                                     | Description                                             |
| :----------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------ |
| `break-before` / `page-break-before` | `auto`, `avoid`, `page`, `left`, `right`, `recto`, `verso` | Controls break behavior immediately preceding element   |
| `break-after` / `page-break-after`   | `auto`, `avoid`, `page`, `left`, `right`, `recto`, `verso` | Controls break behavior immediately following element   |
| `break-inside` / `page-break-inside` | `auto`, `avoid`                                            | Prevents page splitting across element box              |
| `page`                               | `<custom-ident>`                                           | Associates element with named `@page` rule              |
| `position`                           | `fixed`                                                    | Replicates element across all generated page containers |
