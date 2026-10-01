# @printedjs/plugin-widows-orphans

CSS widows and orphans typography constraint plugin for Printedjs.

Enforces minimum line thresholds at page break boundaries to prevent single-line stragglers at the top or bottom of pages.

---

## Features

- **Widows Control** — Enforces minimum line count required at the top of a page when a paragraph splits (`widows: 2`).
- **Orphans Control** — Enforces minimum line count left at the bottom of a page before breaking (`orphans: 2`).
- **Automated Re-Breaking** — Instructs the paginator to push entire paragraphs or extra lines forward to satisfy typography rules.

---

## Installation

```bash
pnpm add @printedjs/plugin-widows-orphans @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { widowsOrphansPlugin } from "@printedjs/plugin-widows-orphans";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [widowsOrphansPlugin()],
});

await renderer.render({
	content: {
		html: `
      <style>
        p {
          widows: 3;
          orphans: 3;
        }
      </style>
      <p>Long flowing text that adheres to professional typesetting constraints...</p>
    `,
	},
});
```

---

## Supported Declarations

| Property  | Values      | Default | Description                                          |
| :-------- | :---------- | :------ | :--------------------------------------------------- |
| `widows`  | `<integer>` | `2`     | Minimum lines left at the top of a broken page       |
| `orphans` | `<integer>` | `2`     | Minimum lines allowed at the bottom of a broken page |
