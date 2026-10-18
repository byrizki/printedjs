# @printedjs/plugins

Plugin ecosystem and modular W3C CSS Paged Media extensions for Printedjs.

This directory contains the core layout plugins, presets, and community extensions that power Printedjs document pagination.

---

## Core Plugins

All core plugins can be loaded together via `@printedjs/plugin-preset` or installed individually for fine-grained tree-shaking:

| Package                                                                         | Version                                                                                                                                                                  | Purpose                                                            |
| :------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **[`@printedjs/plugin-preset`](./core/preset/README.md)**                       | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-preset.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-preset)                       | Standard bundle combining all core plugins                         |
| **[`@printedjs/plugin-page-rules`](./core/page-rules/README.md)**               | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-page-rules.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-page-rules)               | `@page` size, margins, orientation, bleeds, and crop marks         |
| **[`@printedjs/plugin-breaks`](./core/breaks/README.md)**                       | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-breaks.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-breaks)                       | CSS `break-before`, `break-after`, `break-inside`, and avoid rules |
| **[`@printedjs/plugin-strings`](./core/strings/README.md)**                     | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-strings.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-strings)                     | CSS `string-set` and `string(...)` margin notation                 |
| **[`@printedjs/plugin-generated-content`](./core/generated-content/README.md)** | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-generated-content.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-generated-content) | 16 W3C margin boxes, track distribution, and running elements      |
| **[`@printedjs/plugin-counters`](./core/counters/README.md)**                   | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-counters.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-counters)                   | `counter(page)`, `counter(pages)`, and target cross-references     |
| **[`@printedjs/plugin-footnotes`](./core/footnotes/README.md)**                 | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-footnotes.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-footnotes)                 | W3C GCPM `float: footnote` and `@footnote` area                    |
| **[`@printedjs/plugin-widows-orphans`](./core/widows-orphans/README.md)**       | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-widows-orphans.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-widows-orphans)       | `widows` and `orphans` typography constraints                      |
| **[`@printedjs/plugin-columns`](./core/columns/README.md)**                     | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-columns.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-columns)                     | CSS multi-column fragmentation and balancing                       |
| **[`@printedjs/plugin-math`](./core/math/README.md)**                           | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-math.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-math)                           | Break protection for KaTeX, MathJax, and MathML                    |
| **[`@printedjs/plugin-hyphenation`](./core/hyphenation/README.md)**             | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-hyphenation.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-hyphenation)             | Hyphenation normalization and soft hyphen preservation             |
| **[`@printedjs/plugin-bookmarks`](./core/bookmarks/README.md)**                 | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-bookmarks.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-bookmarks)                 | Heading hierarchy extraction and outline drawer UI                 |
| **[`@printedjs/plugin-lists`](./core/lists/README.md)**                         | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-lists.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-lists)                         | Ordered list sequence continuity across splits                     |
| **[`@printedjs/plugin-running-headers`](./core/running-headers/README.md)**     | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-running-headers.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-running-headers)     | Dynamic running headers and footers utility alias                  |
| **[`@printedjs/plugin-views`](./core/views/README.md)**                         | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-views.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-views)                         | Presentation view modes (single page, spread)                      |

---

## Community Plugins

| Package                                                              | Version                                                                                                                                                  | Purpose                                   | Credits                                                                   |
| :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------- | :------------------------------------------------------------------------ |
| **[`@printedjs/plugin-page-flip`](./community/page-flip/README.md)** | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-page-flip.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-page-flip) | Realistic 3D flipbook page turning engine | Adapted from [StPageFlip](https://github.com/Nodlik/StPageFlip) by Nodlik |
| **[`@printedjs/plugin-eta`](./community/eta/README.md)**             | [![npm](https://img.shields.io/npm/v/@printedjs/plugin-eta.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@printedjs/plugin-eta)             | Dynamic pre-pagination templating engine  | Powered by [Eta](https://eta.js.org/)                                     |

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
