# @printedjs/plugins

Plugin ecosystem and modular W3C CSS Paged Media extensions for Printedjs.

This directory contains the core layout plugins, presets, and community extensions that power Printedjs document pagination.

---

## Core Plugins

All core plugins can be loaded together via `@printedjs/plugin-preset` or installed individually for fine-grained tree-shaking:

| Package                                                                         | Purpose                                                            |
| :------------------------------------------------------------------------------ | :----------------------------------------------------------------- |
| **[`@printedjs/plugin-page-rules`](./core/page-rules/README.md)**               | `@page` size, margins, orientation, bleeds, and crop marks         |
| **[`@printedjs/plugin-breaks`](./core/breaks/README.md)**                       | CSS `break-before`, `break-after`, `break-inside`, and avoid rules |
| **[`@printedjs/plugin-strings`](./core/strings/README.md)**                     | CSS `string-set` and `string(...)` margin notation                 |
| **[`@printedjs/plugin-generated-content`](./core/generated-content/README.md)** | 16 W3C margin boxes, track distribution, and running elements      |
| **[`@printedjs/plugin-counters`](./core/counters/README.md)**                   | `counter(page)`, `counter(pages)`, and target cross-references     |
| **[`@printedjs/plugin-footnotes`](./core/footnotes/README.md)**                 | W3C GCPM `float: footnote` and `@footnote` area                    |
| **[`@printedjs/plugin-widows-orphans`](./core/widows-orphans/README.md)**       | `widows` and `orphans` typography constraints                      |
| **[`@printedjs/plugin-columns`](./core/columns/README.md)**                     | CSS multi-column fragmentation and balancing                       |
| **[`@printedjs/plugin-math`](./core/math/README.md)**                           | Break protection for KaTeX, MathJax, and MathML                    |
| **[`@printedjs/plugin-hyphenation`](./core/hyphenation/README.md)**             | Hyphenation normalization and soft hyphen preservation             |
| **[`@printedjs/plugin-bookmarks`](./core/bookmarks/README.md)**                 | Heading hierarchy extraction and outline drawer UI                 |
| **[`@printedjs/plugin-lists`](./core/lists/README.md)**                         | Ordered list sequence continuity across splits                     |
| **[`@printedjs/plugin-preset`](./core/preset/README.md)**                       | Standard bundle combining all core plugins                         |
| **[`@printedjs/plugin-running-headers`](./core/running-headers/README.md)**     | Alias package for running headers and footers                      |
| **[`@printedjs/plugin-views`](./core/views/README.md)**                         | Single, spread, and flipbook view modes                            |

---

## Community Plugins

| Package                                                              | Purpose                                   | Credits                                                                   |
| :------------------------------------------------------------------- | :---------------------------------------- | :------------------------------------------------------------------------ |
| **[`@printedjs/plugin-page-flip`](./community/page-flip/README.md)** | Realistic 3D flipbook page turning engine | Adapted from [StPageFlip](https://github.com/Nodlik/StPageFlip) by Nodlik |
| **[`@printedjs/plugin-eta`](./community/eta/README.md)**             | Dynamic pre-pagination templating engine  | Powered by [Eta](https://eta.js.org/)                                     |

---

## Quick Start

```typescript
import { createRenderer } from "@printedjs/browser";
import { standardPreset } from "@printedjs/plugin-preset";

const renderer = createRenderer({
	target: document.querySelector("#viewport")!,
	plugins: [...standardPreset()],
});

await renderer.render({
	content: { html: "<p>Continuous content...</p>" },
});
```
