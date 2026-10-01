# Migrating from Paged.js to Printedjs

This guide explains the architectural differences between legacy Paged.js and Printedjs, and provides step-by-step instructions for upgrading existing templates, applications, and custom handlers.

---

## 1. Key Differences

For an exhaustive feature-by-feature comparison and technical capabilities catalog, see the **[Printedjs Feature Catalog & Comparison](./features.md)**.

| Feature             | Legacy Paged.js                             | Printedjs                                                       |
| :------------------ | :------------------------------------------ | :-------------------------------------------------------------- |
| **Architecture**    | Monolithic bundle with global side effects  | Modular multi-package workspace (`@printedjs/*`)                |
| **Core Runtime**    | Coupled to browser DOM & CSSOM              | Pure engine (`@printedjs/core`) with zero DOM dependencies      |
| **Isolation**       | Mutates host page elements and globals      | Surface isolation via `root` or `iframe` modes                  |
| **Teardown**        | Incomplete cleanup; leaks DOM and styles    | Deterministic `renderer.destroy()` with zero DOM residue        |
| **Plugin API**      | Global `Handler` subclasses and loose hooks | Strongly-typed `PrintedjsPlugin` with topological ordering      |
| **Loop Resiliency** | Risk of infinite page generation loops      | `LayoutProgressGuard` preventing lockups with typed errors      |
| **Table Layout**    | Inconsistent header repeats on splits       | Repeated `thead`/`tfoot`, `rowspan` continuation, auto col sync |
| **Cross-Browser**   | Legacy Chromium focus                       | 100% verified across Chromium, Firefox, and WebKit              |
| **TypeScript**      | None / Ambient declarations                 | 100% strict TypeScript with exported types                      |
| **Bundle Options**  | Single legacy script                        | Modular packages, minimal bundle (`printedjs.min.js`), CLI      |

---

## 2. Drop-in Migration (Script Tag)

For web pages currently loading Paged.js via a `<script>` tag:

### Legacy Paged.js

```html
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
```

### Printedjs Drop-in

```html
<script src="path/to/@printedjs/minimal/dist/index.min.global.js"></script>
```

The minimal bundle automatically detects `@page` stylesheets, paginates the document body upon `DOMContentLoaded`, and exposes standard `window.Paged` compatibility APIs for existing scripts.

---

## 3. Programmatic API Migration

### Legacy Paged.js

```javascript
import { Previewer } from "pagedjs";

const paged = new Previewer();
await paged.preview(htmlContent, ["print.css"], document.querySelector("#book"));
```

### Printedjs

```typescript
import { createRenderer } from "@printedjs/browser";
import { standardPreset } from "@printedjs/plugins";

const renderer = createRenderer({
	target: document.querySelector("#book")!,
	isolation: "root", // Or "iframe" for sandboxed rendering
	plugins: standardPreset(),
});

const result = await renderer.render({
	content: {
		html: htmlContent,
		stylesheets: ["print.css"],
	},
});

console.log(`Rendered ${result.pages.length} pages in ${result.metrics.durationMs}ms.`);
```

---

## 4. Migrating Handlers to Plugins

### Legacy Paged.js Handler

Legacy Paged.js relied on global class inheritance with loose lifecycle hooks:

```javascript
import { Handler, registerHandlers } from "pagedjs";

class WatermarkHandler extends Handler {
	afterRendered(pages) {
		pages.forEach((page) => {
			const box = page.element.querySelector(".pagedjs_pagebox");
			const mark = document.createElement("div");
			mark.className = "watermark";
			mark.textContent = "CONFIDENTIAL";
			box.appendChild(mark);
		});
	}
}
registerHandlers(WatermarkHandler);
```

### Printedjs Plugin

In Printedjs, plugins are pure functions returning strongly-typed `PrintedjsPlugin` objects:

```typescript
import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

export function watermarkPlugin(text: string): PrintedjsPlugin {
	return {
		name: "watermark",
		afterRender(context: PluginContext) {
			const doc = context.metadata["document"] as Document | undefined;
			if (!doc) return;

			const pages = doc.querySelectorAll<HTMLElement>(".printedjs_page");
			pages.forEach((page) => {
				const box = page.querySelector(".printedjs_pagebox") ?? page;
				const mark = doc.createElement("div");
				mark.className = "watermark";
				mark.textContent = text;
				box.appendChild(mark);
			});
		},
	};
}
```

Register the plugin when initializing the renderer:

```typescript
const renderer = createRenderer({
	target: container,
	plugins: [...standardPreset(), watermarkPlugin("CONFIDENTIAL")],
});
```

---

## 5. CSS Classes & Variables

Printedjs uses modern, non-conflicting `.printedjs_*` CSS classes and `--printedjs-*` variables, while offering full backward compatibility:

### CSS Selectors

| Legacy Paged.js            | Modern Printedjs             | Notes                             |
| :------------------------- | :--------------------------- | :-------------------------------- |
| `.pagedjs_pages`           | `.printedjs_pages`           | Root container for all pages      |
| `.pagedjs_page`            | `.printedjs_page`            | Outer page wrapper                |
| `.pagedjs_sheet`           | `.printedjs_sheet`           | Sheet area including margins      |
| `.pagedjs_pagebox`         | `.printedjs_pagebox`         | Printable content area            |
| `.pagedjs_margin-top-left` | `.printedjs_margin-top-left` | Specific margin box container     |
| `.pagedjs_margin-content`  | `.printedjs_margin-content`  | Content wrapper inside margin box |

### Backward Compatibility Mode

If your existing CSS relies on `.pagedjs_*` class selectors or `--pagedjs-*` CSS custom properties, enable `pagedjsCompatible: true`:

```typescript
const renderer = createRenderer({
	target: container,
	pagedjsCompatible: true,
	plugins: standardPreset(),
});
```

When enabled, Printedjs automatically:

- Emits dual class names on all page shells (e.g. `class="printedjs_page pagedjs_page"`)
- Mirrors CSS variables (e.g. setting both `--printedjs-width` and `--pagedjs-width`)
- Maps legacy margin box classes and data attributes

---

## 6. Teardown and Cleanup

In legacy Paged.js, destroying a previewer frequently left injected `<style>` tags and modified DOM nodes in the host document.

In Printedjs, `renderer.destroy()` guarantees complete cleanup:

```typescript
renderer.destroy();
// All container elements, injected stylesheets, and event observers are immediately removed.
```
