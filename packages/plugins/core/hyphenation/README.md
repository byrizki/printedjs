# @printedjs/plugin-hyphenation

CSS hyphenation and word-break preservation plugin for Printedjs.

Provides cross-browser hyphenation normalization and text measurement preservation across paginated boundaries.

---

## Features

- **Vendor Prefix Expansion** — Normalizes standard CSS `hyphens: auto` to include `-webkit-` and `-ms-` vendor prefixes.
- **Soft Hyphen Protection** — Traverses DOM text nodes to identify and preserve soft hyphens (`\u00AD` / `&shy;`) during page measurement and node slicing.
- **Accurate Word Boundary Wrapping** — Prevents unexpected line-wrapping artifacts at page breaks.

---

## Installation

```bash
pnpm add @printedjs/plugin-hyphenation @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { hyphenationPlugin } from "@printedjs/plugin-hyphenation";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [hyphenationPlugin()],
});

await renderer.render({
	content: {
		html: `
      <style>
        p {
          hyphens: auto;
          text-align: justify;
        }
      </style>
      <p>Super&shy;cali&shy;fragi&shy;listic&shy;expi&shy;ali&shy;docious</p>
    `,
	},
});
```
