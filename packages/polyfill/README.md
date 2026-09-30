# @printedjs/polyfill

Compatibility polyfills for older browsers running Printedjs.

`@printedjs/polyfill` provides standard DOM, observer, and modern JavaScript feature shims required by older browsers (such as older Safari, older Chrome < 86, and legacy Android WebViews) to run Printedjs smoothly.

---

## Features

- **DOM Slicing & Manipulation Shims** — Polyfills `replaceChildren`, `replaceWith`, `remove`, `append`, and `prepend` on `Element`, `DocumentFragment`, and `CharacterData`.
- **Layout Observers** — Provides fallback implementations for `ResizeObserver` and `IntersectionObserver` when missing in legacy browser runtimes.
- **Asynchronous Execution Helpers** — Shims `requestIdleCallback`, `cancelIdleCallback`, and `queueMicrotask`.
- **Modern JavaScript Standards** — Implements `Object.hasOwn`, `Array.prototype.at`, `String.prototype.replaceAll`, `Promise.allSettled`, `structuredClone`, and `CSS.supports`.
- **Zero Engine Overhead** — Contains no layout engine or parser code; pure runtime shims only.

---

## Installation

```bash
pnpm add @printedjs/polyfill
```

Or load directly via script tag:

```html
<script src="node_modules/@printedjs/polyfill/dist/index.min.global.js"></script>
```

---

## Usage

### 1. Browser Script Tag (Legacy Browser Support)

Load the polyfill script before loading `@printedjs/minimal` or `@printedjs/browser`:

```html
<!DOCTYPE html>
<html>
	<head>
		<!-- Polyfills for older browsers -->
		<script src="/path/to/index.min.global.js"></script>

		<!-- Printedjs Minimal Engine -->
		<script src="/path/to/index.min.global.js"></script>

		<style>
			@page {
				size: A4;
				margin: 20mm;
			}
		</style>
	</head>
	<body>
		<h1>Document Title</h1>
		<p>Rendered cleanly on modern and legacy browsers alike.</p>
	</body>
</html>
```

### 2. Programmatic Import

```typescript
import { installPolyfills } from "@printedjs/polyfill";

// Ensure all polyfills are installed in the global environment
installPolyfills();
```

---

## When Do You Need This?

- **Modern Browsers (Evergreen Chrome, Edge, Safari, Firefox):** You do **not** need this package. Simply use `@printedjs/minimal` or `@printedjs/browser`.
- **Legacy Browsers & WebViews:** Use this package if targeting:
  - Safari < 14
  - Chrome < 86
  - Older Android WebViews
  - Embedded browser environments lacking ES2022 / modern DOM APIs

---

## License

MIT
