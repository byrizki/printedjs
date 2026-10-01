# @printedjs/plugin-math

Mathematical formula break protection plugin for Printedjs.

Protects complex mathematical formulas, equations, and expressions from awkward page break splits across pages.

---

## Features

- **Multi-Engine Protection** — Pre-configured selectors for KaTeX (`.katex-display`, `.katex`), MathJax (`mjx-container`), and native MathML (`<math>`).
- **Generic Selector Support** — Automatically protects elements marked with `[data-math]` or `.math-display`.
- **Enforced Non-Fragmentation** — Injects strict `break-inside: avoid !important` rules and paginator layout attributes.

---

## Installation

```bash
pnpm add @printedjs/plugin-math @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { mathPlugin } from "@printedjs/plugin-math";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [mathPlugin()],
});

await renderer.render({
	content: {
		html: `
      <!-- KaTeX Display Formula -->
      <div class="katex-display">
        <span class="katex">...</span>
      </div>

      <!-- MathJax Container -->
      <mjx-container display="true">...</mjx-container>

      <!-- Native MathML -->
      <math display="block">...</math>
    `,
	},
});
```

---

## Supported Selectors

- `.katex-display`, `.katex`
- `mjx-container`
- `math`
- `[data-math]`
- `.math-display`
