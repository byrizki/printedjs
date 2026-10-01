# @printedjs/plugin-counters

CSS counter resolution and page numbering plugin for Printedjs.

Resolves dynamic CSS counters, document-wide page totals, and cross-reference page targets according to W3C Paged Media specifications.

---

## Features

- **Standard Page Counters** — Full resolution of `counter(page)` and total page count `counter(pages)`.
- **Cross-Reference Links** — Resolves `target-counter(attr(href), page)` for automated table of contents and index page numbers.
- **Counter Manipulation** — Supports custom `counter-increment` and `counter-reset` scopes.
- **Multiple Numbering Formats** — Formats numbers as `decimal`, `decimal-leading-zero`, `lower-roman`, `upper-roman`, `lower-alpha`, `upper-alpha`, and custom styles.

---

## Installation

```bash
pnpm add @printedjs/plugin-counters @printedjs/core
```

---

## Usage

### In CSS Stylesheets

```css
@page {
	@bottom-right {
		content: "Page " counter(page) " of " counter(pages);
	}
}

@page :first {
	counter-reset: page 1;
}

a.toc-item::after {
	content: leader(".") " " target-counter(attr(href), page, upper-roman);
}
```

### In TypeScript

```typescript
import { createRenderer } from "@printedjs/browser";
import { countersPlugin, formatPageNumber } from "@printedjs/plugin-counters";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [countersPlugin()],
});

// Standalone formatting helper:
console.log(formatPageNumber(4, "upper-roman")); // "IV"
console.log(formatPageNumber(2, "decimal-leading-zero")); // "02"
```

---

## Supported Counter Formats

- `decimal` (1, 2, 3...)
- `decimal-leading-zero` (01, 02, 03...)
- `lower-roman` (i, ii, iii, iv...)
- `upper-roman` (I, II, III, IV...)
- `lower-alpha` / `lower-latin` (a, b, c...)
- `upper-alpha` / `upper-latin` (A, B, C...)
