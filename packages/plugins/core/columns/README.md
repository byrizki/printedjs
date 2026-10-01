# @printedjs/plugin-columns

CSS multi-column layout plugin for Printedjs.

Parses CSS Multi-column Layout properties and coordinates column fragmentation across paginated boundaries.

---

## Features

- **Column Count & Gaps** — Parses `column-count` and `column-gap` declarations.
- **Balancing Policy** — Supports `column-fill: balance` and `column-fill: auto`.
- **Paged Media Integration** — Preserves multi-column flow across sequential page breaks.

---

## Installation

```bash
pnpm add @printedjs/plugin-columns @printedjs/core
```

---

## Usage

```typescript
import { createRenderer } from "@printedjs/browser";
import { columnsPlugin } from "@printedjs/plugin-columns";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [columnsPlugin()],
});

await renderer.render({
	content: {
		html: `
      <style>
        .newspaper-article {
          column-count: 3;
          column-gap: 15mm;
          column-fill: balance;
        }
      </style>
      <div class="newspaper-article">
        <p>Text flowing smoothly across three columns...</p>
      </div>
    `,
	},
});
```

---

## Supported Declarations

| Property       | Values            | Description                                   |
| :------------- | :---------------- | :-------------------------------------------- |
| `column-count` | `<integer>`       | Number of columns in element container        |
| `column-gap`   | `<length>`        | Space between adjacent column boxes           |
| `column-fill`  | `balance`, `auto` | Specifies how content balances across columns |
