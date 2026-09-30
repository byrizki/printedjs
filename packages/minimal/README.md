# @printedjs/minimal

Full-featured, all-in-one Printedjs package compiled to minimal, compact JavaScript.

`@printedjs/minimal` bundles the complete Printedjs engine (`@printedjs/browser`, `@printedjs/plugins`, and `@printedjs/core`) into an ultra-compact, minified distribution designed for high performance in modern web browsers and headless PDF environments.

---

## Features

- **Full Engine Included** — Contains the core pagination runtime, DOM layout adapter, and standard W3C CSS Paged Media plugin suite.
- **Ultra-Compact & Minified** — Compiled with dead-code elimination, tree-shaking, and minification down to a fraction of legacy Paged.js bundles.
- **Zero-Config Script Tag Drop-In** — Add `<script src="printedjs.min.js"></script>` to automatically paginate documents containing `@page` styles.
- **Legacy Paged.js Compatibility** — Drop-in replacement for `window.Paged.polyfill()`, `new Paged.Previewer()`, `Paged.Handler`, and custom handlers.
- **Dual-Branding Support** — Configurable via `pagedjsCompatible` flag or `data-pagedjs-compatible` attribute to emit both `.printedjs_*` and `.pagedjs_*` CSS classes.

---

## Installation

```bash
pnpm add @printedjs/minimal
```

Or load directly in the browser via CDN or local script tag:

```html
<script src="node_modules/@printedjs/minimal/dist/index.min.global.js"></script>
```

---

## Usage

### 1. Browser Script Tag (Auto-Paginating)

```html
<!DOCTYPE html>
<html>
	<head>
		<style>
			@page {
				size: A4;
				margin: 25mm 20mm;
				@bottom-center {
					content: "Page " counter(page) " of " counter(pages);
				}
			}
		</style>
	</head>
	<body>
		<h1>Quarterly Financial Report</h1>
		<p>Printedjs will automatically paginate this document when loaded.</p>

		<script src="/path/to/index.min.global.js"></script>
	</body>
</html>
```

### Script Attributes

```html
<script
	src="/path/to/index.min.global.js"
	data-printedjs-target="#preview-container"
	data-printedjs-isolation="iframe"
	data-pagedjs-compatible="true"
></script>
```

- **`data-printedjs-target`** — Selector for output container (default: `document.body`).
- **`data-printedjs-isolation`** — Set to `"iframe"` to sandbox document styles from the host page.
- **`data-pagedjs-compatible`** — Set to `"true"` to emit legacy `.pagedjs_*` class aliases alongside `.printedjs_*`.
- **`data-printedjs-auto="false"`** — Disables automatic pagination on load.

---

### 2. Programmatic API

```typescript
import { polyfill, Previewer } from "@printedjs/minimal";

// Run pagination on current document
const result = await polyfill({
	target: document.querySelector("#preview")!,
	isolation: "root",
	pagedjsCompatible: false,
});

console.log(
	`Rendered ${result.pages.length} pages in ${result.metrics.totalDurationMs}ms.`,
);
```

### 3. Paged.js Migration

Existing code using legacy Paged.js interfaces works seamlessly:

```javascript
class CustomFooterHandler extends Paged.Handler {
	afterRendered(pages) {
		console.log("Rendered pages:", pages.length);
	}
}

Paged.registerHandlers(CustomFooterHandler);

const previewer = new Paged.Previewer();
await previewer.preview(document.body.innerHTML, [], document.querySelector("#preview"));
```

---

## Older Browser Compatibility

If targeting older browsers (e.g. older Safari < 14, Android WebView, or older Chromium), include `@printedjs/polyfill` before loading `@printedjs/minimal`:

```html
<!-- Polyfills for older browsers -->
<script src="/path/to/index.min.global.js"></script>

<!-- Minimal compact Printedjs engine -->
<script src="/path/to/index.min.global.js"></script>
```

---

## License

MIT
