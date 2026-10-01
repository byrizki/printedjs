# @printedjs/plugin-page-rules

W3C CSS Paged Media `@page` rule parser and styling plugin for Printedjs.

Parses `@page` rules, page dimensions, paper sizes, orientations, margins, bleeds, crop marks, pseudo-selectors, and named pages into structured layout dimensions.

---

## Features

- **Standard Paper Sizes** — Supports ISO (A3, A4, A5, B4, B5) and US sizes (Letter, Legal, Ledger) with `portrait` and `landscape` orientations.
- **Custom Dimensions** — Resolves explicit length units (`size: 210mm 297mm`, `size: 8.5in 11in`).
- **Page Selectors** — Evaluates `:first`, `:left`, `:right`, `:blank`, and `:nth(An+B)` pseudo-classes.
- **Named Pages** — Routes elements with `page: <name>` to matching `@page <name> { ... }` style blocks.
- **Bleed & Crop Marks** — Calculates bleed geometry (`bleed: 3mm`) and generates trim/registration marks (`marks: crop cross`).
- **Facing Page Margins** — Automatically mirrors inner and outer margins across `:left` (verso) and `:right` (recto) pages.

---

## Installation

```bash
pnpm add @printedjs/plugin-page-rules @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { pageRulesPlugin } from "@printedjs/plugin-page-rules";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [pageRulesPlugin()],
});

await renderer.render({
	content: {
		html: `
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm 15mm;
          bleed: 3mm;
          marks: crop cross;
        }

        @page :left {
          margin-left: 25mm;
          margin-right: 15mm;
        }

        @page :right {
          margin-left: 15mm;
          margin-right: 25mm;
        }

        @page cover {
          margin: 0;
        }
      </style>
      <div style="page: cover;">Front Cover</div>
      <div>Main body content...</div>
    `,
	},
});
```

---

## API

- **`pageRulesPlugin(): PrintedjsPlugin`** — Main layout plugin.
- **`parsePageRules(css: string): PageRule[]`** — Zero-DOM parser converting CSS text into structured `PageRule` objects.
- **`generatePageCss(rules: PageRule[], pagedjsCompatible?: boolean): string`** — Emits scoped CSS page box styles.
