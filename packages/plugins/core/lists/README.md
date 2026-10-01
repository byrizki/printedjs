# @printedjs/plugin-lists

Ordered list continuity and sequence preservation plugin for Printedjs.

Maintains correct item numbering across page breaks when ordered lists (`<ol>`) split over multiple pages.

---

## Features

- **Split Continuity** — Automatically calculates list item counters before layout and applies correct `start` attributes to split `<ol>` elements on continuation pages.
- **Custom `start` Attribute Support** — Respects initial `start="..."` attributes specified in source HTML documents.
- **Zero Configuration** — Operates non-destructively during pagination passes.

---

## Installation

```bash
pnpm add @printedjs/plugin-lists @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { listsPlugin } from "@printedjs/plugin-lists";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [listsPlugin()],
});

await renderer.render({
	content: {
		html: `
      <ol>
        <li>First long section item...</li>
        <!-- Page boundary occurs here -->
        <li>Continuation item correctly numbered as 2</li>
      </ol>
    `,
	},
});
```
