# @printedjs/plugins

Collection of modular W3C CSS Paged Media and Generated Content plugins for Printedjs.

This package implements the official CSS specifications for paginated documents, including page sizing, margin boxes, page breaks, running headers, counters, footnotes, multi-column layouts, math typesetting, and PDF bookmarks.

---

## Features & Included Plugins

| Plugin                | Export                   | Description                                                                                                    |
| :-------------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Standard Preset**   | `standardPreset()`       | Complete bundle of standard plugins ready for production use.                                                  |
| **Page Rules**        | `pageRulesPlugin`        | Parses `@page` size (A4, Letter, custom dimensions), orientations, margins, bleed, and crop marks.             |
| **Breaks**            | `breaksPlugin`           | Handles `break-before`, `break-after`, `break-inside: avoid`, and blank verso/recto page insertions.           |
| **Strings**           | `stringsPlugin`          | Implements W3C `string-set` and `string(...)` for running document headers and chapter titles.                 |
| **Generated Content** | `generatedContentPlugin` | Populates margin boxes (`@top-left`, `@bottom-center`, etc.) and formats dynamic contents.                     |
| **Counters**          | `countersPlugin`         | Evaluates `counter(page)`, `counter(pages)`, and `target-counter()` across page sequences.                     |
| **Footnotes**         | `footnotesPlugin`        | Implements `float: footnote`, `@footnote` area allocation, and multi-page continuation logic.                  |
| **Columns**           | `columnsPlugin`          | Multi-column layout pagination (`column-count`, `column-gap`, `column-fill`, `column-span: all`).              |
| **Math**              | `mathPlugin`             | Protects inline and display mathematical formulas (`.katex-display`, `mjx-container`, `<math>`) from breaking. |
| **Hyphenation**       | `hyphenationPlugin`      | Preserves hyphenation rules across page transitions.                                                           |
| **Bookmarks**         | `bookmarksPlugin`        | Extracts hierarchical headings (`h1`–`h6`) for PDF table-of-contents outlines.                                 |
| **Widows & Orphans**  | `widowsOrphansPlugin`    | Enforces paragraph line split constraints across page breaks.                                                  |

---

## Installation

```bash
pnpm add @printedjs/plugins @printedjs/core
```

---

## Usage

### Standard Preset

The easiest way to configure Printedjs with full CSS Paged Media support:

```typescript
import { createRenderer } from "@printedjs/browser";
import { standardPreset } from "@printedjs/plugins";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: standardPreset(),
});
```

### Individual Plugin Registration

Plugins can be selectively registered or customized:

```typescript
import { createRenderer } from "@printedjs/browser";
import {
	bookmarksPlugin,
	breaksPlugin,
	countersPlugin,
	generatedContentPlugin,
	pageRulesPlugin,
	stringsPlugin,
} from "@printedjs/plugins";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [
		pageRulesPlugin(),
		breaksPlugin(),
		stringsPlugin(),
		countersPlugin(),
		generatedContentPlugin(),
		bookmarksPlugin(),
	],
});
```

---

## Supported CSS Specifications

### Page Sizing & Margin Boxes

```css
@page {
	size: A4 portrait;
	margin: 20mm 15mm 25mm 15mm;
	bleed: 3mm;
	marks: crop cross;

	@top-left {
		content: "Confidential";
		font-size: 8pt;
	}
	@top-right {
		content: string(heading);
		font-weight: bold;
	}
	@bottom-center {
		content: "Page " counter(page) " of " counter(pages);
	}
}

@page :first {
	margin-top: 40mm;
	@top-left {
		content: none;
	}
	@top-right {
		content: none;
	}
}
```

### Running Headers (`string-set`)

```css
h1 {
	string-set: heading content();
}
```

### Page Breaks

```css
.chapter {
	break-before: page;
}

.table-row,
.card {
	break-inside: avoid;
}

.appendix {
	break-before: right; /* Inserts blank verso page if needed */
}
```

---

## License

MIT
