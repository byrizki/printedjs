# @printedjs/plugin-strings

CSS named strings and dynamic margin content plugin for Printedjs.

Implements W3C CSS Paged Media `string-set` and `string(...)` functional notation for injecting dynamic headers, titles, and attributes into margin boxes.

---

## Features

- **String Capture (`string-set`)** — Captures text content or attribute values from document headings or markers into named strings.
- **Content & Attribute Modes** — Supports `content(text)` as well as `attr(...)` extraction.
- **Margin Box Insertion** — Injects captured strings into `@page` margin boxes using `string(identifier, policy)`.
- **Policy Support** — Resolves `first`, `start`, `last`, and `first-except` string occurrence scopes.

---

## Installation

```bash
pnpm add @printedjs/plugin-strings @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { stringsPlugin } from "@printedjs/plugin-strings";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [stringsPlugin()],
});

await renderer.render({
	content: {
		html: `
      <style>
        @page {
          size: A4;
          margin: 25mm 20mm;
          @top-right {
            content: string(headingTitle, first);
          }
        }
        h1 {
          string-set: headingTitle content(text);
        }
        article {
          string-set: authorName attr(data-author);
        }
      </style>
      <article data-author="Jane Doe">
        <h1>Introduction to Fluid Mechanics</h1>
        <p>Document text...</p>
      </article>
    `,
	},
});
```

---

## Supported Declarations

| Property / Function | Syntax                      | Description                                             |
| :------------------ | :-------------------------- | :------------------------------------------------------ |
| `string-set`        | `<ident> content(text)`     | Captures element text into named string `<ident>`       |
| `string-set`        | `<ident> attr(<name>)`      | Captures attribute `<name>` into named string `<ident>` |
| `string()`          | `string(<ident>, [policy])` | Injects named string into margin box                    |
