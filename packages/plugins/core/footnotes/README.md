# @printedjs/plugin-footnotes

W3C CSS Generated Content footnote placement plugin for Printedjs.

Implements footnote layout conforming to CSS Generated Content for Paged Media (GCPM), extracting inline footnote text into bottom-of-page footnote areas.

---

## Features

- **Inline Footnote Slicing** — Detects elements styled with `float: footnote` and relocates them to the active page's footnote container.
- **Footnote Callouts & Markers** — Generates synchronized footnote reference callouts in body text and matching list markers in the footnote area.
- **Footnote Area Styling** — Parses `@footnote` blocks inside `@page` rules to style borders, separators, and margins.
- **Display & Policy Modes** — Supports `footnote-display: block | inline` and `footnote-policy: auto | line | block`.

---

## Installation

```bash
pnpm add @printedjs/plugin-footnotes @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { footnotesPlugin } from "@printedjs/plugin-footnotes";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [footnotesPlugin()],
});

await renderer.render({
	content: {
		html: `
      <style>
        @page {
          @footnote {
            border-top: 1px solid #ccc;
            padding-top: 4mm;
          }
        }
        span.footnote {
          float: footnote;
          footnote-display: block;
        }
      </style>
      <p>
        Quantum computing leverages superposition
        <span class="footnote">Physical qubits demonstrate quantum coherence.</span>
        to perform complex calculations.
      </p>
    `,
	},
});
```

---

## Supported Declarations

| Property           | Values                  | Description                                                |
| :----------------- | :---------------------- | :--------------------------------------------------------- |
| `float`            | `footnote`              | Marks element for extraction into bottom footnote area     |
| `footnote-display` | `block`, `inline`       | Layout display style of footnotes in area                  |
| `footnote-policy`  | `auto`, `line`, `block` | Rules for placing footnotes across page boundaries         |
| `@footnote`        | `{ ... }`               | Margin area descriptor inside `@page` for container styles |
