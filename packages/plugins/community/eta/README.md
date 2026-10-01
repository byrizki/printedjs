# @printedjs/plugin-eta

Pre-pagination template compilation plugin for Printedjs powered by [Eta](https://eta.js.org/).

Enables dynamic data evaluation, variable interpolation, conditional rendering, loops, and custom helper functions prior to document layout.

---

## Features

- **Fast Embedded Templates** — Full Eta template engine support with `<% %>` script tags, `<%= %>` escaped output, and `<%- %>` raw output.
- **Built-in Helpers** — Pre-registered helpers for dates (`dayjs`), numbers (`numeral`), currencies, casing, and array aggregations.
- **Safe Evaluation Context** — Scoped property proxy blocking accidental prototype leaks or unwanted global access.
- **BigInt & JSON Normalization** — Deep type conversion ensuring compatibility with standard numbers and structured records.

---

## Installation

```bash
pnpm add @printedjs/plugin-eta @printedjs/core
```

---

## Usage

### As a Printedjs Plugin

```typescript
import { createRenderer } from "@printedjs/browser";
import { etaPlugin } from "@printedjs/plugin-eta";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [
		etaPlugin({
			data: {
				invoiceNumber: "INV-2025-001",
				customer: { name: "Acme Corp" },
				items: [
					{ name: "Widgets", amount: 150 },
					{ name: "Gadgets", amount: 250 },
				],
			},
		}),
	],
});
```

### Standalone Template Compilation

```typescript
import { compileTemplate, renderTemplate } from "@printedjs/plugin-eta";

const template = `
  <h1>Invoice #<%= invoiceNumber %></h1>
  <p>Customer: <%= customer.name %></p>
  <ul>
    <% items.forEach(item => { %>
      <li><%= item.name %> - <%= format(item.amount) %></li>
    <% }) %>
  </ul>
`;

const data = {
	invoiceNumber: "INV-042",
	customer: { name: "John Doe" },
	items: [{ name: "Hosting", amount: 49 }],
};

const output = renderTemplate(template, data);
console.log(output);
```

---

## Configuration Options

| Option    | Type                       | Default                  | Description                                          |
| :-------- | :------------------------- | :----------------------- | :--------------------------------------------------- |
| `data`    | `Record<string, unknown>`  | `{}`                     | Context data provided to template variables          |
| `helpers` | `Record<string, Function>` | `defaultTemplateHelpers` | Custom helper functions accessible in template scope |
| `useWith` | `boolean`                  | `true`                   | Exposes context keys directly as local variables     |
